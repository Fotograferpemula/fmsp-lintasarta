import { NextResponse } from 'next/server';

// ────────────────────────────────────────────────────────
// Centralized API Error Handler
// SECURITY: Returns generic messages to client, logs details server-side
// ────────────────────────────────────────────────────────

/**
 * Handle API errors safely:
 * - Logs full error details server-side (for debugging)
 * - Returns generic message to client (prevents information leakage)
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  // Log full error details server-side
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(JSON.stringify({
    level: 'error',
    context,
    message: errorMessage,
    // Only include stack in non-production for server-side debugging
    ...(process.env.NODE_ENV !== 'production' && errorStack ? { stack: errorStack } : {}),
    timestamp: new Date().toISOString(),
  }));

  // Return generic error to client
  return NextResponse.json(
    { success: false, error: 'Terjadi kesalahan internal server. Silakan coba lagi.' },
    { status: 500 }
  );
}

/**
 * Safe error message — returns a sanitized error string
 * that doesn't expose internal details.
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Filter out Prisma and DB-specific errors
    if (error.message.includes('prisma') || error.message.includes('P2')) {
      return 'Database operation failed.';
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return 'Service temporarily unavailable.';
    }
  }
  return 'Terjadi kesalahan internal server.';
}
