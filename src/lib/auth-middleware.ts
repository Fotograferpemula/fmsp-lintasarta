import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hasPermission, PermissionKey } from './rbac';

// ────────────────────────────────────────────────────────
// SECURITY: JWT_SECRET MUST be set via environment variable.
// Application will crash on startup if not configured.
// ────────────────────────────────────────────────────────
const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export' ||
  process.env.IS_NEXT_BUILD === 'true' ||
  (process.env.NODE_ENV === 'production' && !process.env.FLY_APP_NAME && !process.env.PORT);

const JWT_SECRET: string = process.env.JWT_SECRET || (isBuildPhase ? 'static_build_fallback_secret_min_32_chars' : '');

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    '[SECURITY FATAL] JWT_SECRET is not set or too short (min 32 chars). ' +
    'Set JWT_SECRET environment variable before starting the application. ' +
    'Generate one with: openssl rand -hex 64'
  );
}

const JWT_EXPIRES_IN = '8h';
const JWT_ISSUER = 'fmsp-lintasarta';
const JWT_AUDIENCE = 'fmsp-api';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  region?: string; // Region/lokasi untuk filter (admin_regional, admin_lokasi)
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  clientIp?: string;
}

// Generate JWT token with issuer/audience claims
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

// Verify JWT token with issuer/audience validation
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JWTPayload;
  } catch {
    return null;
  }
}

// Extract token from request headers
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Fallback: check cookie
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/fmsp_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// Extract client IP from request headers (behind reverse proxy)
export function extractClientIp(req: Request): string {
  // Fly.io / Cloudflare / Nginx forward real IP in these headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may contain comma-separated IPs; first is the client
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '0.0.0.0'; // Unknown
}

// Auth middleware wrapper for API route handlers
export function withAuth(
  handler: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: Request) => {
    const token = extractToken(req);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Token tidak ditemukan. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Token tidak valid atau sudah expired.' },
        { status: 401 }
      );
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = user;
    authReq.clientIp = extractClientIp(req);
    return handler(authReq, user);
  };
}

// Auth middleware with permission check
export function withRole(
  permission: PermissionKey,
  handler: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return withAuth(async (req, user) => {
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json(
        { success: false, error: `Forbidden: Anda tidak memiliki akses untuk fitur ini. Diperlukan permission: ${permission}` },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}
