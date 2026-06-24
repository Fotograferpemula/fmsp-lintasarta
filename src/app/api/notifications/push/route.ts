import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleApiError } from '@/lib/api-error';

// POST: Subscribe to push notifications
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription object' },
        { status: 400 }
      );
    }

    // Upsert subscription (update if same endpoint exists)
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: user.userId,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: user.userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Push subscription berhasil disimpan' });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    return handleApiError(error, 'API');
  }
}

// DELETE: Unsubscribe from push notifications
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint wajib diisi' },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.userId },
    });

    return NextResponse.json({ success: true, message: 'Push subscription berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePost);
export const DELETE = withAuth(handleDelete);
