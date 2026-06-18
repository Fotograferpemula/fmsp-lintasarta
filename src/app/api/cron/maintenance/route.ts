import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-service';

const CRON_SECRET = process.env.CRON_SECRET || '';

// GET /api/cron/maintenance
// Cek jadwal maintenance overdue dan kirim reminder
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (CRON_SECRET && authHeader !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
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
      where: { role: 'admin' },
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

      const assignee = sched.assignedTo;
      const emailTargets = [...admins.map(a => a.email)];

      for (const email of emailTargets) {
        try {
          await sendEmail({ to: email, subject, message, documentLink: '/?tab=maintenance' });
          results.reminded++;
        } catch {
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

    await prisma.auditLog.create({
      data: {
        user: 'system:cron',
        action: 'CRON_MAINTENANCE_RUN',
        resource: 'MaintenanceSchedule',
        details: `Maintenance cron: ${results.overdue} overdue, ${results.upcoming} upcoming, ${results.reminded} emails sent`,
      },
    });

    return NextResponse.json({ success: true, timestamp: now.toISOString(), ...results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
