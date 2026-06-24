import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hilangkan dev indicator (tombol "N" di kiri bawah)
  devIndicators: false,

  // Production-ready settings
  poweredByHeader: false,
  compress: true,

  // Standalone output for deployment (Docker/VPS)
  output: 'standalone',

  // ── Security Headers ──────────────────────────────────
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // XSS Protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Dev: 'unsafe-eval' required by React dev mode (stack trace reconstruction)
              // Prod: strict, no eval
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com"
                : "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              // Dev: allow localhost websocket for HMR + Next.js dev server
              isDev
                ? "connect-src 'self' ws://localhost:* http://localhost:* https://oauth2.googleapis.com https://accounts.google.com"
                : "connect-src 'self' https://oauth2.googleapis.com https://accounts.google.com",
              "frame-src https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
          // HSTS — force HTTPS (only in production, 1 year)
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }
          ] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
