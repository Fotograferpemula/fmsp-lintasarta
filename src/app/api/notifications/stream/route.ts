import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fmsp-lintasarta-secret-key-change-in-production-2026';

// GET /api/notifications/stream
// Server-Sent Events — push notifikasi real-time ke browser
export async function GET(req: NextRequest) {
  // Auth dari query param (SSE tidak bisa set header)
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  let userPayload: any;
  try {
    userPayload = jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const userEmail = userPayload.email;

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
          isClosed = true;
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
          isClosed = true;
          clearInterval(heartbeat);
        }
      }, 25000);

      // Cleanup on abort
      req.signal.addEventListener('abort', () => {
        isClosed = true;
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
