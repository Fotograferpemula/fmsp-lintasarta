import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { consumeTicket } from '../ticket/route';

// ────────────────────────────────────────────────────────
// GET /api/notifications/stream
// Server-Sent Events — push notifikasi real-time ke browser
// SECURITY: Uses short-lived, single-use ticket instead of JWT in query param.
// Client must first POST to /api/notifications/ticket to exchange JWT → ticket.
// ────────────────────────────────────────────────────────

// ── SSE Connection Limiter ──
const sseConnections = new Map<string, number>(); // email → active count
const MAX_SSE_PER_USER = 3;

export async function GET(req: NextRequest) {
  // Auth via ticket (NOT raw JWT — tickets are single-use, 60s TTL)
  const ticket = req.nextUrl.searchParams.get('ticket');
  const userEmail = consumeTicket(ticket);

  if (!userEmail) {
    return new Response('Unauthorized: Invalid or expired ticket. Request a new ticket via POST /api/notifications/ticket.', { status: 401 });
  }

  // ── Connection limit per user ──
  const currentCount = sseConnections.get(userEmail) || 0;
  if (currentCount >= MAX_SSE_PER_USER) {
    return new Response('Too many SSE connections. Close existing connections first.', { status: 429 });
  }
  sseConnections.set(userEmail, currentCount + 1);

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (data: object) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { isClosed = true; }
      };

      // Cleanup helper — decrement connection count
      const cleanup = () => {
        if (!isClosed) {
          isClosed = true;
          const count = sseConnections.get(userEmail) || 1;
          if (count <= 1) {
            sseConnections.delete(userEmail);
          } else {
            sseConnections.set(userEmail, count - 1);
          }
        }
      };

      // Initial heartbeat
      send({ type: 'connected', message: 'FMSP SSE Connected', timestamp: new Date().toISOString() });

      // Send initial unread count
      try {
        const unreadCount = await prisma.notification.count({
          where: { recipientEmail: userEmail, status: 'pending' },
        });
        send({ type: 'badge', count: unreadCount });
      } catch {}

      // Poll every 30s for new notifications
      const interval = setInterval(async () => {
        if (isClosed) { clearInterval(interval); return; }
        try {
          const latest = await prisma.notification.findMany({
            where: {
              recipientEmail: userEmail,
              status: 'pending',
              sentAt: { gte: new Date(Date.now() - 35000) }, // last 35s
            },
            orderBy: { sentAt: 'desc' },
            take: 5,
          });

          if (latest.length > 0) {
            for (const n of latest) {
              send({
                type: 'notification',
                id: n.id,
                title: n.title,
                message: n.message,
                notifType: n.type,
                timestamp: n.sentAt,
              });
            }
          }

          // Send badge count
          const total = await prisma.notification.count({
            where: { recipientEmail: userEmail, status: 'pending' },
          });
          send({ type: 'badge', count: total });
        } catch {
          cleanup();
          clearInterval(interval);
          try { controller.close(); } catch {}
        }
      }, 30000);

      // Heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        if (isClosed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
          clearInterval(heartbeat);
        }
      }, 25000);

      // Cleanup on abort
      req.signal.addEventListener('abort', () => {
        cleanup();
        clearInterval(interval);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
