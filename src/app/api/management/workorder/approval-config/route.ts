import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { handleApiError } from "@/lib/api-error";

// GET /api/management/workorder/approval-config — List all approval configs
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const configs = await prisma.woApprovalConfig.findMany({
      orderBy: { category: "asc" },
    });
    return NextResponse.json({ success: true, data: configs });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// POST /api/management/workorder/approval-config — Upsert approval config
// Body: { category, requireL1, l1Roles, requireL2, l2Roles, l2Priorities, autoApproveBelow }
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const {
      category,
      requireL1 = true,
      l1Roles = ["admin_lokasi", "admin_regional"],
      requireL2 = false,
      l2Roles = ["manager_fms", "admin_pusat"],
      l2Priorities = ["critical", "high"],
      autoApproveBelow,
    } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, error: "category wajib diisi" },
        { status: 400 },
      );
    }

    const config = await prisma.woApprovalConfig.upsert({
      where: { category },
      update: {
        requireL1,
        l1Roles,
        requireL2,
        l2Roles,
        l2Priorities,
        autoApproveBelow: autoApproveBelow ?? null,
      },
      create: {
        category,
        requireL1,
        l1Roles,
        requireL2,
        l2Roles,
        l2Priorities,
        autoApproveBelow: autoApproveBelow ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPSERT_WO_APPROVAL_CONFIG",
        resource: "WoApprovalConfig",
        details: `Approval config updated: ${category} → L1: ${requireL1}, L2: ${requireL2} (${l2Priorities.join(", ")})`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// DELETE /api/management/workorder/approval-config
// Body: { id }
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID wajib diisi" },
        { status: 400 },
      );
    }

    const existing = await prisma.woApprovalConfig.findUnique({
      where: { id: body.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Config tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.woApprovalConfig.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_WO_APPROVAL_CONFIG",
        resource: "WoApprovalConfig",
        details: `Approval config deleted: ${existing.category}`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Approval config dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("wo_config", handleGet));
export const POST = withAuth(withPermission("wo_config", handlePost));
export const DELETE = withAuth(withPermission("wo_config", handleDelete));
