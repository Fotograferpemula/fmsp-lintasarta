import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { sendEmail } from "@/lib/email-service";
import { statusAfterL1 } from "@/lib/wo-state-machine";

// POST /api/management/workorder/approve
// Body: { id, action: 'approve'|'reject', reason? }
// 2-tier approval: determines tier automatically based on WO state + user role
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  const body = await req.json();
  const { id, action, reason } = body;

  if (!id || !action) {
    return NextResponse.json(
      { success: false, error: "id dan action wajib diisi" },
      { status: 400 },
    );
  }
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { success: false, error: "action harus approve atau reject" },
      { status: 400 },
    );
  }
  if (action === "reject" && !reason?.trim()) {
    return NextResponse.json(
      { success: false, error: "Alasan penolakan wajib diisi" },
      { status: 400 },
    );
  }

  const wo = await prisma.workOrder.findUnique({
    where: { id },
    include: { asset: { select: { name: true, location: true } } },
  });

  if (!wo) {
    return NextResponse.json(
      { success: false, error: "Work Order tidak ditemukan" },
      { status: 404 },
    );
  }

  // Determine which tier this approval is for
  const isL1 = wo.status === "pending_approval" && wo.approvalLevel === 0;
  const isL2 = wo.status === "pending_l2" && wo.approvalLevel === 1;

  if (!isL1 && !isL2) {
    return NextResponse.json(
      {
        success: false,
        error: `Work Order ini tidak dalam status menunggu approval (status: ${wo.status}, level: ${wo.approvalLevel}).`,
      },
      { status: 409 },
    );
  }

  // Load approval config for this category
  const approvalConfig = await prisma.woApprovalConfig.findUnique({
    where: { category: wo.category },
  });

  // Validate user role against config
  if (isL1 && approvalConfig) {
    const allowedRoles = approvalConfig.l1Roles;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Role Anda (${user.role}) tidak memiliki izin untuk approval L1 kategori "${wo.category}". Roles yang diizinkan: ${allowedRoles.join(", ")}`,
        },
        { status: 403 },
      );
    }
  }
  if (isL2 && approvalConfig) {
    const allowedRoles = approvalConfig.l2Roles;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Role Anda (${user.role}) tidak memiliki izin untuk approval L2 kategori "${wo.category}". Roles yang diizinkan: ${allowedRoles.join(", ")}`,
        },
        { status: 403 },
      );
    }
  }

  const now = new Date();

  // ── Handle REJECT (any tier) ──
  if (action === "reject") {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.workOrder.update({
        where: { id },
        data: {
          status: "rejected",
          rejectedBy: user.email,
          rejectedAt: now,
          rejectedReason: reason,
        },
      });

      await tx.workOrderStatusLog.create({
        data: {
          workOrderId: id,
          fromStatus: wo.status,
          toStatus: "rejected",
          changedBy: user.email,
          reason,
        },
      });

      await tx.notification.create({
        data: {
          recipientEmail: wo.reportedBy,
          type: "system",
          title: `WO Ditolak: ${wo.title}`,
          message: `Work Order ${wo.ticketNumber} ditolak oleh ${user.name || user.email}: ${reason}`,
          status: "sent",
          sentAt: now,
          scheduledAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: isL1 ? "WO_REJECTED_L1" : "WO_REJECTED_L2",
          resource: "WorkOrder",
          details: `WO ${wo.ticketNumber} ditolak (${isL1 ? "L1" : "L2"}): ${reason}`,
          ip: req.clientIp || "0.0.0.0",
        },
      });

      return result;
    });

    // Email notification
    try {
      await sendEmail({
        to: wo.reportedBy,
        subject: `[FMSP] Work Order ❌ Ditolak: ${wo.title}`,
        message: `
Work Order Anda telah DITOLAK.

📋 Nomor Tiket  : ${wo.ticketNumber}
📌 Judul        : ${wo.title}
🏢 Aset         : ${wo.asset?.name || "-"} (${wo.asset?.location || "-"})
👤 Ditolak oleh : ${user.name || user.email}
📅 Waktu        : ${now.toLocaleString("id-ID")}

❌ Alasan Penolakan:
${reason}

Akses FMSP untuk melihat detail lebih lanjut.
        `.trim(),
        documentLink: "/?tab=workorder",
      });
    } catch (emailErr) {
      console.error("[WO Approve] Email error:", emailErr);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Work Order ${wo.ticketNumber} ditolak (${isL1 ? "L1" : "L2"}).`,
    });
  }

  // ── Handle APPROVE ──
  let newStatus: string;
  let updateData: any;

  if (isL1) {
    // L1 Approval
    const requireL2 = approvalConfig?.requireL2 ?? false;
    const l2Priorities = approvalConfig?.l2Priorities ?? ["critical", "high"];
    newStatus = statusAfterL1(wo.priority, requireL2, l2Priorities);

    updateData = {
      approvalLevel: 1,
      approvedL1By: user.email,
      approvedL1At: now,
      status: newStatus,
    };
  } else {
    // L2 Approval
    newStatus = "assigned";
    updateData = {
      approvalLevel: 2,
      approvedL2By: user.email,
      approvedL2At: now,
      status: newStatus,
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.workOrder.update({
      where: { id },
      data: updateData,
    });

    await tx.workOrderStatusLog.create({
      data: {
        workOrderId: id,
        fromStatus: wo.status,
        toStatus: newStatus,
        changedBy: user.email,
        reason: `Disetujui ${isL1 ? "L1" : "L2"} oleh ${user.name || user.email}`,
      },
    });

    await tx.notification.create({
      data: {
        recipientEmail: wo.reportedBy,
        type: "system",
        title: `WO Disetujui (${isL1 ? "L1" : "L2"}): ${wo.title}`,
        message:
          newStatus === "pending_l2"
            ? `Work Order ${wo.ticketNumber} disetujui L1 oleh ${user.name || user.email}. Menunggu approval L2.`
            : `Work Order ${wo.ticketNumber} disetujui oleh ${user.name || user.email}. Status: ${newStatus}.`,
        status: "sent",
        sentAt: now,
        scheduledAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        user: user.email,
        action: isL1 ? "WO_APPROVED_L1" : "WO_APPROVED_L2",
        resource: "WorkOrder",
        details: `WO ${wo.ticketNumber} disetujui (${isL1 ? "L1" : "L2"}) → ${newStatus}`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return result;
  });

  // Email notification
  try {
    await sendEmail({
      to: wo.reportedBy,
      subject: `[FMSP] Work Order ✅ Disetujui (${isL1 ? "L1" : "L2"}): ${wo.title}`,
      message: `
Work Order Anda telah DISETUJUI (${isL1 ? "Tier 1" : "Tier 2"}).

📋 Nomor Tiket  : ${wo.ticketNumber}
📌 Judul        : ${wo.title}
🏢 Aset         : ${wo.asset?.name || "-"} (${wo.asset?.location || "-"})
👤 Disetujui oleh: ${user.name || user.email}
📅 Waktu        : ${now.toLocaleString("id-ID")}
📊 Status       : ${newStatus}
${newStatus === "pending_l2" ? "\n⏳ Work Order masih membutuhkan approval L2 dari Manager." : "\n✅ Work Order akan segera diproses oleh tim teknis."}

Akses FMSP untuk melihat detail lebih lanjut.
      `.trim(),
      documentLink: "/?tab=workorder",
    });
  } catch (emailErr) {
    console.error("[WO Approve] Email error:", emailErr);
  }

  return NextResponse.json({
    success: true,
    data: updated,
    message: `Work Order ${wo.ticketNumber} disetujui (${isL1 ? "L1" : "L2"}) → ${newStatus}.`,
  });
}

export const POST = withAuth(withPermission("wo_approve", handlePost));
