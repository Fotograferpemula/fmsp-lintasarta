import crypto from 'crypto';

// ────────────────────────────────────────────────────────
// Cron Authentication Utility
// SECURITY: Timing-safe comparison, header-only authentication
// ────────────────────────────────────────────────────────

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Validate cron request authentication.
 * Uses timing-safe comparison to prevent timing attacks.
 * Only accepts secret via x-cron-secret header (NOT query params — to prevent URL logging).
 * 
 * @returns null if valid, or error Response if invalid.
 */
export function validateCronAuth(req: Request): { error: string; status: number } | null {
  if (!CRON_SECRET || CRON_SECRET.length < 16) {
    return { error: 'CRON_SECRET not configured or too short (min 16 chars). Set env variable.', status: 503 };
  }

  // SECURITY: Only accept from header — NOT from query params (URL logging risk)
  const headerSecret = req.headers.get('x-cron-secret');
  if (!headerSecret) {
    return { error: 'Unauthorized: x-cron-secret header required.', status: 401 };
  }

  // Timing-safe comparison to prevent timing attacks
  const secretBuffer = Buffer.from(CRON_SECRET, 'utf8');
  const headerBuffer = Buffer.from(headerSecret, 'utf8');

  if (secretBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(secretBuffer, headerBuffer)) {
    return { error: 'Unauthorized: Invalid cron secret.', status: 401 };
  }

  return null; // Valid
}
