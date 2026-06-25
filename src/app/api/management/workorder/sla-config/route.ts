import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { handleApiError } from "@/lib/api-error";

// GET /api/management/workorder/sla-config — List all SLA configs
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const configs = await prisma.woSlaConfig.findMany({
      orderBy: [{ category: "asc" }, { region: "asc" }, { priority: "asc" }],
    });
    return NextResponse.json({ success: true, data: configs });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// POST /api/management/workorder/sla-config — Upsert SLA config
// Body: { category, region, priority, responseMinutes, resolveMinutes }
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { category, region, priority, responseMinutes, resolveMinutes } = body;

    if (!category || !region || !priority || !responseMinutes || !resolveMinutes) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi: category, region, priority, responseMinutes, resolveMinutes" },
        { status: 400 },
      );
    }

    if (!["critical", "high", "medium", "low"].includes(priority)) {
      return NextResponse.json(
        { success: false, error: "Priority harus: critical, high, medium, atau low" },
        { status: 400 },
      );
    }

    const config = await prisma.woSlaConfig.upsert({
      where: {
        category_region_priority: { category, region, priority },
      },
      update: {
        responseMinutes: parseInt(responseMinutes),
        resolveMinutes: parseInt(resolveMinutes),
      },
      create: {
        category,
        region,
        priority,
        responseMinutes: parseInt(responseMinutes),
        resolveMinutes: parseInt(resolveMinutes),
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPSERT_WO_SLA_CONFIG",
        resource: "WoSlaConfig",
        details: `SLA config updated: ${category}/${region}/${priority} → response: ${responseMinutes}min, resolve: ${resolveMinutes}min`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// DELETE /api/management/workorder/sla-config
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

    await prisma.woSlaConfig.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_WO_SLA_CONFIG",
        resource: "WoSlaConfig",
        details: `SLA config deleted: ${body.id}`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, message: "SLA config dihapus." });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("wo_config", handleGet));
export const POST = withAuth(withPermission("wo_config", handlePost));
export const DELETE = withAuth(withPermission("wo_config", handleDelete));
