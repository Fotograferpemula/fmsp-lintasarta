import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { handleApiError } from "@/lib/api-error";
import { getRoleLevel } from "@/lib/rbac";

// POST /api/management/workorder/verify
// Body: { id, verified: true|false, notes? }
// Pelapor DAN Admin (level ≤3) bisa verifikasi
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, verified, notes } = body;

    if (!id || typeof verified !== "boolean") {
      return NextResponse.json(
        { success: false, error: "id dan verified (boolean) wajib diisi" },
        { status: 400 },
      );
    }

    const wo = await prisma.workOrder.findUnique({ where: { id } });
    if (!wo) {
      return NextResponse.json(
        { success: false, error: "Work Order tidak ditemukan" },
        { status: 404 },
      );
    }

    if (wo.status !== "resolved") {
      return NextResponse.json(
        {
          success: false,
          error: `Work Order harus berstatus "resolved" untuk diverifikasi (status saat ini: ${wo.status})`,
        },
        { status: 400 },
      );
    }

    // Only reporter or admin (level ≤3) can verify
    const isReporter = user.email === wo.reportedBy;
    const isAdmin = getRoleLevel(user.role) <= 3;
    if (!isReporter && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Hanya pelapor atau admin yang dapat memverifikasi Work Order ini.",
        },
        { status: 403 },
      );
    }

    const now = new Date();

    if (verified) {
      // ── Verified → Closed ──
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.workOrder.update({
          where: { id },
          data: {
            status: "closed",
            verifiedBy: user.email,
            verifiedAt: now,
          },
        });

        await tx.workOrderStatusLog.create({
          data: {
            workOrderId: id,
            fromStatus: "resolved",
            toStatus: "verified",
            changedBy: user.email,
            reason: notes || "Diverifikasi dan ditutup",
          },
        });

        // Also log verified → closed
        await tx.workOrderStatusLog.create({
          data: {
            workOrderId: id,
            fromStatus: "verified",
            toStatus: "closed",
            changedBy: user.email,
            reason: "Auto-close setelah verifikasi",
          },
        });

        await tx.auditLog.create({
          data: {
            user: user.email,
            action: "WO_VERIFIED",
            resource: "WorkOrder",
            details: `WO ${wo.ticketNumber} diverifikasi oleh ${isReporter ? "pelapor" : "admin"} dan ditutup.${notes ? ` Catatan: ${notes}` : ""}`,
            ip: req.clientIp || "0.0.0.0",
          },
        });

        return result;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Work Order ${wo.ticketNumber} diverifikasi dan ditutup.`,
      });
    } else {
      // ── Not verified → Reopened ──
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.workOrder.update({
          where: { id },
          data: {
            status: "reopened",
            verifiedBy: null,
            verifiedAt: null,
            resolvedAt: null,
          },
        });

        await tx.workOrderStatusLog.create({
          data: {
            workOrderId: id,
            fromStatus: "resolved",
            toStatus: "reopened",
            changedBy: user.email,
            reason: notes || "Masalah belum terselesaikan",
          },
        });

        // Notify assignee
        if (wo.assignedTo) {
          await tx.notification.create({
            data: {
              recipientEmail: wo.reportedBy, // will also notify via dashboard
              type: "system",
              title: `WO Dibuka Kembali: ${wo.ticketNumber}`,
              message: `Work Order ${wo.ticketNumber} dibuka kembali oleh pelapor: ${notes || "Masalah belum terselesaikan"}`,
              status: "sent",
              sentAt: now,
              scheduledAt: now,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            user: user.email,
            action: "WO_REOPENED",
            resource: "WorkOrder",
            details: `WO ${wo.ticketNumber} dibuka kembali: ${notes || "Masalah belum terselesaikan"}`,
            ip: req.clientIp || "0.0.0.0",
          },
        });

        return result;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Work Order ${wo.ticketNumber} dibuka kembali.`,
      });
    }
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const POST = withAuth(withPermission("wo_verify", handlePost));
