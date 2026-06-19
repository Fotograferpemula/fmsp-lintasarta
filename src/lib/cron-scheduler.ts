import cron from 'node-cron';
import crypto from 'crypto';
import { prisma } from './db';
import { sendEmail } from './email-service';

/**
 * Thread-safe and distributed-safe processor that claims all 'pending' notifications
 * in the database, attempts to send them via SMTP, and updates their status
 * to 'sent' or 'failed' accordingly.
 */
export async function sendPendingNotifications() {
  const runId = crypto.randomUUID();
  const statusPlaceholder = `sending_${runId}`;

  try {
    // 1. Atomically claim all pending notifications for this run
    await prisma.notification.updateMany({
      where: { status: 'pending' },
      data: { status: statusPlaceholder },
    });

    // 2. Fetch only the notifications claimed by this process
    const myNotifs = await prisma.notification.findMany({
      where: { status: statusPlaceholder },
    });

    if (myNotifs.length === 0) {
      return [];
    }

    console.log(`[NOTIFICATION ENGINE] Processing ${myNotifs.length} staged notifications...`);
    const processed = [];

    for (const notif of myNotifs) {
      // Direct user to correct tab based on notification type/topic
      const documentLink = notif.title.toLowerCase().includes('maintenance')
        ? '/?tab=maintenance'
        : '/?tab=legal';

      const emailResult = await sendEmail({
        to: notif.recipientEmail,
        subject: notif.title,
        message: notif.message,
        documentLink,
      });

      const updatedNotif = await prisma.notification.update({
        where: { id: notif.id },
        data: {
          status: emailResult.success ? 'sent' : 'failed',
          sentAt: emailResult.success ? new Date() : null,
        },
      });

      processed.push({ ...updatedNotif, previewUrl: emailResult.previewUrl });
    }

    return processed;
  } catch (error: any) {
    console.error('❌ [NOTIFICATION ENGINE] Error in sendPendingNotifications:', error.message);
    
    // Recovery: reset any stuck status back to pending if needed
    try {
      await prisma.notification.updateMany({
        where: { status: statusPlaceholder },
        data: { status: 'pending' },
      });
    } catch (e: any) {
      console.error('❌ [NOTIFICATION ENGINE] Failed to roll back stuck notifications:', e.message);
    }
    
    return [];
  }
}

export async function runReminderJob() {
  const now = new Date();
  console.log(`⏰ [CRON RUNNER] Starting Reminder Job at ${now.toISOString()}`);
  const results = { checked: 0, reminded: 0, errors: 0 };

  try {
    // 1. Cari semua dokumen legal yang akan/sudah expired
    const docs = await prisma.legalDocument.findMany({
      where: {
        complianceStatus: { in: ['warning', 'expired'] },
        expiryDate: { not: undefined },
      },
      include: { asset: { select: { name: true, location: true } } },
    });

    // 2. Ambil semua admin & operator untuk notifikasi
    const recipients = await prisma.user.findMany({
      where: { role: { in: ['superadmin', 'manager_fms', 'admin_pusat', 'admin_regional'] }, isActive: true },
      select: { email: true, name: true },
    });

    for (const doc of docs) {
      results.checked++;

      const expiry = doc.expiryDate!;
      const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Kirim reminder hanya di hari tertentu: 30, 14, 7, 3, 1, dan setelah expired
      const shouldRemind = [30, 14, 7, 3, 1].includes(daysUntil) || daysUntil <= 0;
      if (!shouldRemind) continue;

      const isExpired = daysUntil <= 0;
      const urgencyLabel = isExpired
        ? `🚨 SUDAH EXPIRED ${Math.abs(daysUntil)} hari lalu`
        : daysUntil <= 3
        ? `🔴 KRITIS — ${daysUntil} hari lagi`
        : daysUntil <= 7
        ? `🟠 MENDESAK — ${daysUntil} hari lagi`
        : `🟡 PERINGATAN — ${daysUntil} hari lagi`;

      const subject = `[FMSP] ${urgencyLabel}: ${doc.title}`;
      const message = `
Dokumen legal berikut memerlukan perhatian segera:

📋 Dokumen  : ${doc.title}
🏢 Aset     : ${doc.asset?.name || 'N/A'} (${doc.asset?.location || '-'})
📅 Jatuh Tempo : ${expiry.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
⚠️  Status    : ${urgencyLabel}

${isExpired
  ? 'Dokumen ini SUDAH MELEWATI tanggal jatuh tempo. Segera lakukan perpanjangan atau penggantian.'
  : `Dokumen akan jatuh tempo dalam ${daysUntil} hari. Segera koordinasikan perpanjangan.`
}

Akses FMSP untuk info lebih lanjut.
      `.trim();

      // Kirim ke semua admin & operator
      for (const recipient of recipients) {
        try {
          // Check for duplicate in last 23 hours to prevent duplicate spamming
          const existingNotification = await prisma.notification.findFirst({
            where: {
              recipientEmail: recipient.email,
              title: subject,
              scheduledAt: { gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
            },
          });

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                recipientEmail: recipient.email,
                type: 'email',
                title: subject,
                message,
                status: 'pending',
                scheduledAt: now,
              },
            });
          }
        } catch (err: any) {
          console.error(`[CRON ERROR] Failed to stage reminder notification for ${recipient.email}:`, err.message);
          results.errors++;
        }
      }
    }

    // Process all pending notifications staged by this job (and any previous pending ones)
    const processed = await sendPendingNotifications();
    results.reminded = processed.filter(n => n.status === 'sent').length;
    results.errors += processed.filter(n => n.status === 'failed').length;

    // 3. Catat di Audit Log
    await prisma.auditLog.create({
      data: {
        user: 'system:cron',
        action: 'CRON_REMINDER_RUN',
        resource: 'LegalDocument',
        details: `Auto cron reminder ran: ${results.checked} checked, ${results.reminded} reminded, ${results.errors} errors`,
      },
    });

    console.log(`⏰ [CRON RUNNER] Reminder Job finished:`, results);
    return results;
  } catch (error: any) {
    console.error('❌ [CRON RUNNER] Reminder Job failed:', error.message);
    return results;
  }
}

export async function runMaintenanceJob() {
  const now = new Date();
  console.log(`⏰ [CRON RUNNER] Starting Maintenance Job at ${now.toISOString()}`);
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const results = { overdue: 0, upcoming: 0, reminded: 0, errors: 0 };

  try {
    // Cari jadwal yang overdue atau akan due dalam 7 hari
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: {
        OR: [
          { status: 'overdue' },
          { nextDue: { lte: in7days }, status: 'scheduled' },
        ],
      },
      include: { asset: { select: { name: true, location: true } } },
    });

    const admins = await prisma.user.findMany({
      where: { role: { in: ['superadmin', 'manager_fms', 'admin_pusat'] }, isActive: true },
      select: { email: true },
    });

    for (const sched of schedules) {
      const isOverdue = sched.status === 'overdue' || (sched.nextDue && sched.nextDue < now);
      if (isOverdue) results.overdue++; else results.upcoming++;

      const daysUntil = sched.nextDue
        ? Math.ceil((sched.nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const label = isOverdue
        ? `🚨 OVERDUE (${Math.abs(daysUntil)} hari terlambat)`
        : `📅 Due dalam ${daysUntil} hari`;

      const subject = `[FMSP Maintenance] ${label}: ${sched.title}`;
      const message = `
Jadwal maintenance berikut memerlukan perhatian:

🔧 Jadwal    : ${sched.title}
🏢 Aset      : ${sched.asset?.name || 'N/A'} (${sched.asset?.location || '-'})
📅 Due Date  : ${sched.nextDue?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) || 'N/A'}
⚠️  Status   : ${label}
👤 Assigned  : ${sched.assignedTo || 'Belum ditugaskan'}

${sched.notes ? `📝 Catatan: ${sched.notes}` : ''}

Segera lakukan tindakan preventive maintenance yang dijadwalkan.
      `.trim();

      const emailTargets = [...admins.map(a => a.email)];

      for (const email of emailTargets) {
        try {
          // Check for duplicate in last 23 hours to prevent duplicate spamming
          const existingNotification = await prisma.notification.findFirst({
            where: {
              recipientEmail: email,
              title: subject,
              scheduledAt: { gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
            },
          });

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                recipientEmail: email,
                type: 'email',
                title: subject,
                message,
                status: 'pending',
                scheduledAt: now,
              },
            });
          }
        } catch (err: any) {
          console.error(`[CRON ERROR] Failed to stage maintenance notification for ${email}:`, err.message);
          results.errors++;
        }
      }

      // Update status ke overdue jika sudah lewat
      if (!isOverdue && sched.nextDue && sched.nextDue < now) {
        await prisma.maintenanceSchedule.update({
          where: { id: sched.id },
          data: { status: 'overdue' },
        });
      }
    }

    // Process all pending notifications staged by this job (and any previous pending ones)
    const processed = await sendPendingNotifications();
    results.reminded = processed.filter(n => n.status === 'sent').length;
    results.errors += processed.filter(n => n.status === 'failed').length;

    await prisma.auditLog.create({
      data: {
        user: 'system:cron',
        action: 'CRON_MAINTENANCE_RUN',
        resource: 'MaintenanceSchedule',
        details: `Auto maintenance cron: ${results.overdue} overdue, ${results.upcoming} upcoming, ${results.reminded} emails sent, ${results.errors} errors`,
      },
    });

    console.log(`⏰ [CRON RUNNER] Maintenance Job finished:`, results);
    return results;
  } catch (error: any) {
    console.error('❌ [CRON RUNNER] Maintenance Job failed:', error.message);
    return results;
  }
}

export function startCronJobs() {
  console.log('🚀 [CRON SCHEDULER] Initializing background cron jobs...');

  // 1. Schedule Reminder Job at 08:00 AM Asia/Jakarta every day
  cron.schedule('0 8 * * *', () => {
    runReminderJob();
  }, {
    timezone: 'Asia/Jakarta'
  });

  // 2. Schedule Maintenance Job at 08:30 AM Asia/Jakarta every day
  cron.schedule('30 8 * * *', () => {
    runMaintenanceJob();
  }, {
    timezone: 'Asia/Jakarta'
  });

  console.log('✅ [CRON SCHEDULER] Scheduled Daily Reminder (08:00 Asia/Jakarta) and Maintenance (08:30 Asia/Jakarta).');

  // 3. Run immediately on server boot sequentially (after a 15-second delay to ensure database & server are ready)
  setTimeout(async () => {
    console.log('⚡ [CRON SCHEDULER] Running initial startup check sequentially...');
    await runReminderJob();
    await runMaintenanceJob();
  }, 15000);
}
