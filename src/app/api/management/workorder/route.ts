import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { WorkOrderCreateSchema, validateRequest } from "@/lib/validators";
import { getRegionFilterNested } from "@/lib/region-filter";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const regionWhere = getRegionFilterNested(user);
    const workOrders = await prisma.workOrder.findMany({
      where: regionWhere,
      include: { asset: { select: { name: true, location: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: workOrders });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(WorkOrderCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const {
      title,
      description,
      priority,
      category,
      assetId,
      assignedTo,
      slaDeadline,
      photos,
    } = validation.data;

    // Auto-generate ticket number (collision-safe: use max existing number)
    const year = new Date().getFullYear();
    const lastWo = await prisma.workOrder.findFirst({
      where: { ticketNumber: { startsWith: `WO-${year}-` } },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });
    const lastNum = lastWo
      ? parseInt(lastWo.ticketNumber.split("-")[2]) || 0
      : 0;
    const ticketNumber = `WO-${year}-${String(lastNum + 1).padStart(4, "0")}`;

    const wo = await prisma.workOrder.create({
      data: {
        ticketNumber,
        title,
        description,
        priority,
        category,
        assetId: assetId || null,
        assignedTo: assignedTo || null,
        reportedBy: user.email,
        slaDeadline: slaDeadline ? new Date(slaDeadline) : null,
        photos: Array.isArray(photos) ? photos : [],
        status: "open",
      },
    });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_WORK_ORDER",
        resource: "WorkOrder",
        details: `Work Order ${ticketNumber}: "${title}" dibuat${photos?.length ? ` dengan ${photos.length} foto` : ""}.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({ success: true, data: wo });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id)
      return NextResponse.json(
        { success: false, error: "ID wajib diisi." },
        { status: 400 },
      );

    // Whitelist: hanya field ini yang boleh diubah via PUT
    const ALLOWED = [
      "title",
      "description",
      "priority",
      "category",
      "assetId",
      "assignedTo",
      "slaDeadline",
      "status",
      "photos",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.slaDeadline)
      updates.slaDeadline = new Date(updates.slaDeadline);
    if (updates.status === "resolved") updates.resolvedAt = new Date();
    const wo = await prisma.workOrder.update({ where: { id }, data: updates });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_WORK_ORDER",
        resource: "WorkOrder",
        details: `Work Order ${wo.ticketNumber} diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({ success: true, data: wo });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id)
      return NextResponse.json(
        { success: false, error: "ID wajib diisi." },
        { status: 400 },
      );
    const wo = await prisma.workOrder.findUnique({ where: { id: body.id } });
    await prisma.workOrder.delete({ where: { id: body.id } });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_WORK_ORDER",
        resource: "WorkOrder",
        details: `Work Order ${wo?.ticketNumber} dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({
      success: true,
      message: "Work Order berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("wo_create", handleGet));
export const POST = withAuth(withPermission("wo_create", handlePost));
export const PUT = withAuth(withPermission("wo_update", handlePut));
export const DELETE = withAuth(withPermission("wo_delete", handleDelete));
