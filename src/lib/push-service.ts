import webpush from 'web-push';
import { prisma } from '@/lib/db';
import { getAppSetting } from '@/lib/app-settings';

// Configure VAPID
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
let vapidInitialized = false;

async function ensureVapid() {
  if (vapidInitialized || !VAPID_PUBLIC || !VAPID_PRIVATE) return;
  const vapidEmail = await getAppSetting('vapid_email', 'mailto:admin@lintasarta.co.id');
  webpush.setVapidDetails(vapidEmail, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidInitialized = true;
}

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  icon?: string;
}

/**
 * Send push notification to a specific user (all their devices)
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  await ensureVapid();
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          tag: payload.tag || 'fmsp-notification',
          url: payload.url || '/',
          icon: payload.icon || '/icon-192.png',
        })
      );
      sent++;
    } catch (error: any) {
      // If subscription expired (410 Gone), remove it
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      console.error(`[Push] Failed to send to ${sub.endpoint.slice(0, 50)}...`, error.message);
    }
  }

  return sent;
}

/**
 * Send push notification to all users with a specific role
 */
export async function sendPushToRole(role: string, payload: PushPayload): Promise<number> {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });

  let totalSent = 0;
  for (const u of users) {
    totalSent += await sendPushToUser(u.id, payload);
  }
  return totalSent;
}

/**
 * Send push notification to ALL active users
 */
export async function sendPushBroadcast(payload: PushPayload): Promise<number> {
  await ensureVapid();
  const subs = await prisma.pushSubscription.findMany({
    include: { user: { select: { isActive: true } } },
  });

  let sent = 0;
  for (const sub of subs) {
    if (!sub.user.isActive) continue;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          tag: payload.tag || 'fmsp-broadcast',
          url: payload.url || '/',
          icon: payload.icon || '/icon-192.png',
        })
      );
      sent++;
    } catch (error: any) {
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  return sent;
}
