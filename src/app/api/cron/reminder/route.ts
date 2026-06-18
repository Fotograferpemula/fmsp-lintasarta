import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-service';

const CRON_SECRET = process.env.CRON_SECRET || '';

// GET /api/cron/reminder
// Dijalankan harian pukul 08:00 WIB via Fly.io scheduled machine atau external cron
export async function GET(req: NextRequest) {
  // Validasi secret untuk keamanan
  const authHeader = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (CRON_SECRET && authHeader !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
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

Akses FMSP untuk tindak lanjut lebih lanjut.
      `.trim();

      // Kirim ke semua admin & operator
      for (const recipient of recipients) {
        try {
          await sendEmail({ to: recipient.email, subject, message, documentLink: '/?tab=legal' });

          // Catat di tabel Notification
          await prisma.notification.create({
            data: {
              recipientEmail: recipient.email,
              type: 'email',
              title: subject,
              message,
              status: 'sent',
              sentAt: now,
              scheduledAt: now,
            },
          });

          results.reminded++;
        } catch {
          results.errors++;
        }
      }
    }

    // 3. Catat di Audit Log
    await prisma.auditLog.create({
      data: {
        user: 'system:cron',
        action: 'CRON_REMINDER_RUN',
        resource: 'LegalDocument',
        details: `Cron reminder ran: ${results.checked} checked, ${results.reminded} reminded, ${results.errors} errors`,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error('[CRON REMINDER]', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
