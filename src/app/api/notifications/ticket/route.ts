import { NextResponse } from 'next/server';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import crypto from 'crypto';

// ────────────────────────────────────────────────────────
// SSE Ticket Exchange Endpoint
// SECURITY: Exchange a JWT (via Authorization header) for a short-lived,
// single-use ticket that can be safely passed as a query parameter to SSE.
// This prevents the long-lived JWT from being logged in server access logs.
// ────────────────────────────────────────────────────────

interface TicketEntry {
  email: string;
  expiresAt: number;
}

// In-memory store for tickets (single-instance safe; Fly.io runs 1 instance)
const ticketStore = new Map<string, TicketEntry>();

const TICKET_TTL_MS = 60_000; // 60 seconds
const MAX_TICKETS = 1000;     // Prevent memory exhaustion

// Periodic cleanup of expired tickets
function cleanupExpiredTickets() {
  const now = Date.now();
  for (const [ticket, entry] of ticketStore.entries()) {
    if (entry.expiresAt < now) {
      ticketStore.delete(ticket);
    }
  }
}

/**
 * Consume a ticket: returns the user email if valid, null otherwise.
 * Tickets are single-use — deleted after first consumption.
 */
export function consumeTicket(ticket: string | null): string | null {
  if (!ticket) return null;

  const entry = ticketStore.get(ticket);
  if (!entry) return null;

  // Always delete (single-use)
  ticketStore.delete(ticket);

  // Check expiry
  if (entry.expiresAt < Date.now()) return null;

  return entry.email;
}

// POST /api/notifications/ticket
// Exchange JWT → short-lived ticket for SSE connection
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  // Cleanup old tickets periodically
  cleanupExpiredTickets();

  // Guard: prevent memory exhaustion
  if (ticketStore.size >= MAX_TICKETS) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak permintaan ticket. Coba lagi nanti.' },
      { status: 429 }
    );
  }

  // Generate cryptographically random ticket
  const ticket = crypto.randomBytes(32).toString('hex');

  ticketStore.set(ticket, {
    email: user.email,
    expiresAt: Date.now() + TICKET_TTL_MS,
  });

  return NextResponse.json({
    success: true,
    ticket,
    expiresIn: TICKET_TTL_MS / 1000,
  });
}

export const POST = withAuth(handlePost);
