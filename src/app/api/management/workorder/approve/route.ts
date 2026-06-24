import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withRole, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { sendEmail } from '@/lib/email-service';
import { getRoleConfig } from '@/lib/rbac';

// POST /api/management/workorder/approve
// Body: { id, action: 'approve'|'reject', reason? }
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  // Permission already checked by withRole('wo_approve')

  const body = await req.json();
  const { id, action, reason } = body;

  if (!id || !action) {
    return NextResponse.json({ success: false, error: 'id dan action wajib diisi' }, { status: 400 });
  }
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ success: false, error: 'action harus approve atau reject' }, { status: 400 });
  }
  if (action === 'reject' && !reason?.trim()) {
    return NextResponse.json({ success: false, error: 'Alasan penolakan wajib diisi' }, { status: 400 });
  }

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: { asset: { select: { name: true, location: true } } },
  });

  if (!wo) {
    return NextResponse.json({ success: false, error: 'Work Order tidak ditemukan' }, { status: 404 });
  }

  if (wo.approvalStatus === 'approved' || wo.approvalStatus === 'rejected') {
    return NextResponse.json({
      success: false,
      error: `Work Order sudah ${wo.approvalStatus === 'approved' ? 'disetujui' : 'ditolak'} sebelumnya`,
    }, { status: 409 });
  }

  const now = new Date();
  const updateData =
    action === 'approve'
      ? {
          approvalStatus: 'approved',
          approvedBy: user.email,
          approvedAt: now,
          status: 'in_progress' as const,
        }
      : {
          approvalStatus: 'rejected',
          rejectedBy: user.email,
          rejectedAt: now,
          rejectedReason: reason,
          status: 'closed' as const,
        };

  const updated = await prisma.workOrder.update({
    where: { id },
    data: updateData,
  });

  // ── Kirim notifikasi email ke reporter ─────────────────────
  try {
    const isApproved = action === 'approve';
    await sendEmail({
      to: wo.reportedBy,
      subject: `[FMSP] Work Order ${isApproved ? '✅ Disetujui' : '❌ Ditolak'}: ${wo.title}`,
      message: `
Work Order Anda telah ${isApproved ? 'DISETUJUI' : 'DITOLAK'}.

📋 Nomor Tiket  : ${wo.ticketNumber}
📌 Judul        : ${wo.title}
🏢 Aset         : ${wo.asset?.name || '-'} (${wo.asset?.location || '-'})
👤 ${isApproved ? 'Disetujui oleh' : 'Ditolak oleh'}: ${user.name || user.email}
📅 Waktu        : ${now.toLocaleString('id-ID')}
${!isApproved ? `\n❌ Alasan Penolakan:\n${reason}` : '\n✅ Work Order akan segera diproses oleh tim teknis.'}

Akses FMSP untuk melihat detail lebih lanjut.
      `.trim(),
      documentLink: '/?tab=workorder',
    });
  } catch (emailErr) {
    console.error('[WO Approve] Email error:', emailErr);
  }

  // ── Simpan ke tabel Notification ──────────────────────────
  await prisma.notification.create({
    data: {
      recipientEmail: wo.reportedBy,
      type: 'system',
      title: `WO ${action === 'approve' ? 'Disetujui' : 'Ditolak'}: ${wo.title}`,
      message: action === 'approve'
        ? `Work Order ${wo.ticketNumber} disetujui oleh ${user.name || user.email}`
        : `Work Order ${wo.ticketNumber} ditolak: ${reason}`,
      status: 'sent',
      sentAt: now,
      scheduledAt: now,
    },
  });

  // ── Audit Log ─────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: action === 'approve' ? 'WO_APPROVED' : 'WO_REJECTED',
      resource: 'WorkOrder',
      // resourceId stored in details
      details: action === 'approve'
        ? `WO ${wo.ticketNumber} disetujui`
        : `WO ${wo.ticketNumber} ditolak: ${reason}`,
      ip: req.clientIp || '0.0.0.0',
    },
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: action === 'approve'
      ? `Work Order ${wo.ticketNumber} berhasil disetujui`
      : `Work Order ${wo.ticketNumber} berhasil ditolak`,
  });
}

export const POST = withRole('wo_approve', handlePost);
