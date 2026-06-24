import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ────────────────────────────────────────────────────────
// Edge Middleware: Rate Limiting + CORS
// Runs on every request before reaching API routes.
// ────────────────────────────────────────────────────────

// ── In-memory Token Bucket Rate Limiter ──
// NOTE: In serverless (Fly.io with multiple instances), each instance
// has its own bucket. For true distributed rate limiting, use Redis.
// This is still effective for single-instance deployments.

interface RateBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateBucket>();

// Rate limit configurations per path prefix
const RATE_LIMITS: Record<string, { maxTokens: number; refillRate: number; windowMs: number }> = {
  // Auth endpoints — strict (prevent brute force)
  '/api/auth/login':           { maxTokens: 5,  refillRate: 1,  windowMs: 60_000 },   // 5 per minute
  '/api/auth/forgot-password': { maxTokens: 3,  refillRate: 1,  windowMs: 120_000 },  // 3 per 2 minutes
  '/api/auth/reset-password':  { maxTokens: 5,  refillRate: 1,  windowMs: 60_000 },   // 5 per minute
  '/api/auth/sso':             { maxTokens: 10, refillRate: 2,  windowMs: 60_000 },   // 10 per minute
  // Chat — moderate (LLM is expensive)
  '/api/chat':                 { maxTokens: 10, refillRate: 2,  windowMs: 60_000 },   // 10 per minute
  // Upload — moderate (bandwidth)
  '/api/upload':               { maxTokens: 5,  refillRate: 1,  windowMs: 60_000 },   // 5 per minute
  // General API — generous
  '/api/':                     { maxTokens: 60, refillRate: 10, windowMs: 60_000 },   // 60 per minute
};

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || '0.0.0.0';
}

function getRateLimitConfig(pathname: string) {
  // Match most specific path first
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (prefix !== '/api/' && pathname.startsWith(prefix)) {
      return { prefix, config };
    }
  }
  // Fallback to general API rate limit
  if (pathname.startsWith('/api/')) {
    return { prefix: '/api/', config: RATE_LIMITS['/api/'] };
  }
  return null;
}

function checkRateLimit(ip: string, prefix: string, config: typeof RATE_LIMITS[string]): { allowed: boolean; remaining: number; resetMs: number } {
  const key = `${ip}:${prefix}`;
  const now = Date.now();

  let bucket = rateLimitStore.get(key);
  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    rateLimitStore.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refillAmount = Math.floor(elapsed / config.windowMs) * config.refillRate;
  if (refillAmount > 0) {
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + refillAmount);
    bucket.lastRefill = now;
  }

  // Consume a token
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens, resetMs: config.windowMs };
  }

  return { allowed: false, remaining: 0, resetMs: config.windowMs };
}

// Periodic cleanup of old entries (every 5 minutes)
let lastCleanup = Date.now();
function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return; // 5 min
  lastCleanup = now;
  const maxAge = 600_000; // 10 minutes
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// ── CORS Configuration ──
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3847',
  'http://localhost:3000',
  'https://fmsp-lintasarta.fly.dev',
]);

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Cron-Secret',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && (ALLOWED_ORIGINS.has(origin) || process.env.NODE_ENV === 'development')) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

// ── Main Middleware ──
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin');

  // ── Bypass rate limiting for cron endpoints (internal scheduler) ──
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // ── Handle CORS Preflight ──
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders(origin);
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // ── Rate Limiting (API routes only) ──
  if (pathname.startsWith('/api/')) {
    cleanupOldEntries();

    const rateLimitMatch = getRateLimitConfig(pathname);
    if (rateLimitMatch) {
      const ip = getClientIp(req);
      const { allowed, remaining, resetMs } = checkRateLimit(ip, rateLimitMatch.prefix, rateLimitMatch.config);

      if (!allowed) {
        console.warn(`[RATE LIMIT] Blocked: IP=${ip}, Path=${pathname}, Prefix=${rateLimitMatch.prefix}`);
        return NextResponse.json(
          { success: false, error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(resetMs / 1000)),
              'X-RateLimit-Remaining': '0',
              ...getCorsHeaders(origin),
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      
      // Add CORS headers
      const corsHeaders = getCorsHeaders(origin);
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }

      return response;
    }
  }

  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};
