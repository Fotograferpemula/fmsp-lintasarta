import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { handleApiError } from "@/lib/api-error";

// POST /api/management/workorder/escalate
// Body: { id } — Manual escalation of a specific WO
// OR    {} — Auto-escalate all overdue WOs (for cron)
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = body as { id?: string };

    const now = new Date();

    if (id) {
      // ── Manual escalation of a single WO ──
      const wo = await prisma.workOrder.findUnique({ where: { id } });
      if (!wo) {
        return NextResponse.json(
          { success: false, error: "Work Order tidak ditemukan" },
          { status: 404 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.workOrder.update({
          where: { id },
          data: {
            escalationLevel: Math.min(wo.escalationLevel + 1, 2),
            escalatedAt: now,
          },
        });

        await tx.workOrderStatusLog.create({
          data: {
            workOrderId: id,
            fromStatus: wo.status,
            toStatus: wo.status, // Status doesn't change, only escalation level
            changedBy: user.email,
            reason: `Manual escalation: Level ${wo.escalationLevel} → ${Math.min(wo.escalationLevel + 1, 2)}`,
          },
        });

        await tx.auditLog.create({
          data: {
            user: user.email,
            action: "WO_ESCALATED",
            resource: "WorkOrder",
            details: `WO ${wo.ticketNumber} di-escalate ke level ${Math.min(wo.escalationLevel + 1, 2)}.`,
            ip: req.clientIp || "0.0.0.0",
          },
        });

        return result;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Work Order ${wo.ticketNumber} di-escalate.`,
      });
    }

    // ── Auto-escalate overdue WOs ──
    // Critical pending > 1 hour, High pending > 4 hours
    const escalationRules = [
      {
        priority: "critical",
        maxMinutes: 60,
        statuses: ["pending_approval", "pending_l2"],
      },
      {
        priority: "high",
        maxMinutes: 240,
        statuses: ["pending_approval", "pending_l2"],
      },
    ];

    let escalatedCount = 0;

    for (const rule of escalationRules) {
      const threshold = new Date(now.getTime() - rule.maxMinutes * 60 * 1000);

      const overdueWos = await prisma.workOrder.findMany({
        where: {
          priority: rule.priority,
          status: { in: rule.statuses },
          updatedAt: { lt: threshold },
          escalationLevel: { lt: 2 },
          deletedAt: null,
        },
      });

      for (const wo of overdueWos) {
        await prisma.$transaction(async (tx) => {
          await tx.workOrder.update({
            where: { id: wo.id },
            data: {
              escalationLevel: Math.min(wo.escalationLevel + 1, 2),
              escalatedAt: now,
            },
          });

          await tx.workOrderStatusLog.create({
            data: {
              workOrderId: wo.id,
              fromStatus: wo.status,
              toStatus: wo.status,
              changedBy: "system",
              reason: `Auto-escalation: ${rule.priority} menunggu > ${rule.maxMinutes} menit`,
            },
          });

          // Notify manager
          await tx.notification.create({
            data: {
              recipientEmail: "manager@lintasarta.co.id",
              type: "system",
              title: `⚠️ Escalation: ${wo.ticketNumber} (${wo.priority})`,
              message: `WO ${wo.ticketNumber} "${wo.title}" telah menunggu lebih dari ${rule.maxMinutes} menit. Escalation level: ${wo.escalationLevel + 1}.`,
              status: "sent",
              sentAt: now,
              scheduledAt: now,
            },
          });
        });

        escalatedCount++;
      }
    }

    // SLA breach check for in_progress WOs
    const slaBreached = await prisma.workOrder.findMany({
      where: {
        status: "in_progress",
        slaDeadline: { lt: now },
        escalationLevel: { lt: 2 },
        deletedAt: null,
      },
    });

    for (const wo of slaBreached) {
      await prisma.$transaction(async (tx) => {
        await tx.workOrder.update({
          where: { id: wo.id },
          data: {
            escalationLevel: 2,
            escalatedAt: now,
          },
        });

        await tx.notification.create({
          data: {
            recipientEmail: "manager@lintasarta.co.id",
            type: "system",
            title: `🚨 SLA Breach: ${wo.ticketNumber}`,
            message: `WO ${wo.ticketNumber} telah melewati SLA deadline. Status: ${wo.status}. Priority: ${wo.priority}.`,
            status: "sent",
            sentAt: now,
            scheduledAt: now,
          },
        });
      });

      escalatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Auto-escalation selesai. ${escalatedCount} WO di-escalate.`,
      escalatedCount,
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const POST = withAuth(withPermission("wo_escalate", handlePost));
