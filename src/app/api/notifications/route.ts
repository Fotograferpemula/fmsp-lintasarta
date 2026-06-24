import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { sendPendingNotifications } from "@/lib/cron-scheduler";
import { getAppSetting } from "@/lib/app-settings";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "notifications";

// GET: Ambil daftar semua notifikasi/pengingat
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// POST: Jalankan evaluasi cron job manual untuk mendeteksi dokumen expired/warning
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const now = new Date();
    const docs = await prisma.legalDocument.findMany({
      include: { asset: true },
    });

    let createdCount = 0;
    const notificationsCreated: any[] = [];
    const defaultEmail = await getAppSetting(
      "notification_default_email",
      "admin@lintasarta.co.id",
    );
    const warningDays =
      parseInt(await getAppSetting("doc_warning_days", "30")) || 30;

    for (const doc of docs) {
      const expiry = new Date(doc.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let shouldAlert = false;
      let title = "";
      let message = "";

      if (diffDays < 0) {
        shouldAlert = true;
        title = `⚠️ PERINGATAN CRITICAL: Dokumen Legal ${doc.title} TELAH EXPIRED`;
        message = `Dokumen legalitas "${doc.title}" untuk aset "${doc.asset.name}" telah habis masa berlakunya pada tanggal ${expiry.toLocaleDateString("id-ID")}. Mohon segera lakukan proses perpanjangan dokumen.`;
      } else if (diffDays <= warningDays) {
        shouldAlert = true;
        title = `⚠️ PENGINGAT WARNING: Dokumen Legal ${doc.title} Mendekati Jatuh Tempo`;
        message = `Dokumen legalitas "${doc.title}" untuk aset "${doc.asset.name}" akan kedaluwarsa pada tanggal ${expiry.toLocaleDateString("id-ID")} (${diffDays} hari lagi). Harap siapkan dokumen perpanjangan.`;
      }

      if (shouldAlert) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            recipientEmail: defaultEmail,
            title: title,
            scheduledAt: { gte: new Date(now.getTime() - 30 * 86400000) },
          },
        });

        if (!existingNotification) {
          const newNotif = await prisma.notification.create({
            data: {
              recipientEmail: defaultEmail,
              type: "email",
              title,
              message,
              status: "pending",
              scheduledAt: now,
            },
          });
          notificationsCreated.push(newNotif);
          createdCount++;
        }
      }
    }

    // Kirim semua notifikasi pending via email service
    const sentNotifications = await sendPendingNotifications();

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "RUN_CRON_REMINDER",
        resource: "NotificationEngine",
        details: `Evaluasi pengingat otomatis. Notifikasi baru: ${createdCount}, Terkirim: ${sentNotifications.filter((n) => n.status === "sent").length}, Gagal: ${sentNotifications.filter((n) => n.status === "failed").length}.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reminder evaluation completed",
      createdCount,
      sentCount: sentNotifications.filter((n) => n.status === "sent").length,
      failedCount: sentNotifications.filter((n) => n.status === "failed")
        .length,
      notifications: sentNotifications,
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("notification_view", handleGet));
export const POST = withAuth(withPermission("notification_manage", handlePost));
