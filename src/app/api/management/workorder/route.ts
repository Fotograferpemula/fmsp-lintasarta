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
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { validateTransition } from "@/lib/wo-state-machine";

const RESOURCE = "management";

// ── GET: List Work Orders (paginated, region-filtered) ──
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const regionWhere = getRegionFilterNested(user);
    const statusFilter = searchParams.get("status");
    const categoryFilter = searchParams.get("category");

    const where: any = { ...regionWhere, deletedAt: null };
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }
    if (categoryFilter && categoryFilter !== "all") {
      where.category = categoryFilter;
    }

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          asset: { select: { name: true, location: true } },
          statusLogs: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          childWos: { select: { id: true, ticketNumber: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data: workOrders,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// ── POST: Create Work Order (draft status, auto-SLA calculation) ──
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
      estimatedCost,
      parentWoId,
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

    // Auto-calculate SLA deadline from WoSlaConfig if not explicitly provided
    let calculatedSla = slaDeadline ? new Date(slaDeadline) : null;
    if (!calculatedSla) {
      const userRegion = user.region || "*";
      // Try specific category+region, then category+*, then *+region, then *+*
      const slaConfig = await prisma.woSlaConfig.findFirst({
        where: {
          priority,
          OR: [
            { category, region: userRegion },
            { category, region: "*" },
            { category: "*", region: userRegion },
            { category: "*", region: "*" },
          ],
        },
        orderBy: [{ category: "desc" }, { region: "desc" }], // Specific first
      });
      if (slaConfig) {
        calculatedSla = new Date(
          Date.now() + slaConfig.resolveMinutes * 60 * 1000,
        );
      }
    }

    // Check if parentWoId exists
    if (parentWoId) {
      const parent = await prisma.workOrder.findUnique({
        where: { id: parentWoId },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent Work Order tidak ditemukan." },
          { status: 404 },
        );
      }
    }

    const wo = await prisma.$transaction(async (tx) => {
      const created = await tx.workOrder.create({
        data: {
          ticketNumber,
          title,
          description,
          priority,
          category,
          assetId: assetId || null,
          assignedTo: assignedTo || null,
          reportedBy: user.email,
          slaDeadline: calculatedSla,
          photos: Array.isArray(photos) ? photos : [],
          estimatedCost: estimatedCost ?? null,
          parentWoId: parentWoId || null,
          status: "draft",
        },
      });

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "CREATE_WORK_ORDER",
          resource: "WorkOrder",
          details: `Work Order ${ticketNumber}: "${title}" dibuat (draft)${estimatedCost ? ` | Est. biaya: Rp ${estimatedCost.toLocaleString("id-ID")}` : ""}${parentWoId ? ` | Follow-up dari WO lain` : ""}.`,
          ip: req.clientIp || "0.0.0.0",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: wo });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// ── PUT: Update Work Order (with state machine validation) ──
async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id)
      return NextResponse.json(
        { success: false, error: "ID wajib diisi." },
        { status: 400 },
      );

    // Fetch current WO
    const currentWo = await prisma.workOrder.findUnique({
      where: { id },
      select: { status: true, ticketNumber: true, reportedBy: true },
    });
    if (!currentWo) {
      return NextResponse.json(
        { success: false, error: "Work Order tidak ditemukan." },
        { status: 404 },
      );
    }

    // Validate status transition if status is being changed
    if (body.status && body.status !== currentWo.status) {
      const transition = validateTransition(currentWo.status, body.status);
      if (!transition.valid) {
        return NextResponse.json(
          { success: false, error: transition.error },
          { status: 400 },
        );
      }
    }

    // Whitelist: only these fields can be updated via PUT
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
      "estimatedCost",
      "actualCost",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.slaDeadline)
      updates.slaDeadline = new Date(updates.slaDeadline);
    if (updates.status === "resolved") updates.resolvedAt = new Date();

    const wo = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id },
        data: updates,
      });

      // Log status change if status was modified
      if (updates.status && updates.status !== currentWo.status) {
        await tx.workOrderStatusLog.create({
          data: {
            workOrderId: id,
            fromStatus: currentWo.status,
            toStatus: updates.status,
            changedBy: user.email,
            reason: body.statusReason || null,
          },
        });

        // Send notification to reporter when resolved (for verification)
        if (updates.status === "resolved") {
          await tx.notification.create({
            data: {
              recipientEmail: currentWo.reportedBy,
              type: "system",
              title: `WO Selesai — Verifikasi Dibutuhkan: ${currentWo.ticketNumber}`,
              message: `Work Order ${currentWo.ticketNumber} telah selesai dikerjakan. Silakan verifikasi hasilnya.`,
              status: "sent",
              sentAt: new Date(),
              scheduledAt: new Date(),
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "UPDATE_WORK_ORDER",
          resource: "WorkOrder",
          details: `Work Order ${updated.ticketNumber} diperbarui${updates.status ? ` | Status: ${currentWo.status} → ${updates.status}` : ""}.`,
          ip: req.clientIp || "0.0.0.0",
        },
      });

      return updated;
    });
    return NextResponse.json({ success: true, data: wo });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// ── DELETE: Soft delete Work Order ──
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id)
      return NextResponse.json(
        { success: false, error: "ID wajib diisi." },
        { status: 400 },
      );
    const wo = await prisma.workOrder.findUnique({ where: { id: body.id } });
    if (!wo) {
      return NextResponse.json(
        { success: false, error: "Work Order tidak ditemukan." },
        { status: 404 },
      );
    }

    // Soft delete
    await prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: body.id },
        data: { deletedAt: new Date() },
      });

      await tx.workOrderStatusLog.create({
        data: {
          workOrderId: body.id,
          fromStatus: wo.status,
          toStatus: "deleted",
          changedBy: user.email,
          reason: "Dihapus oleh user",
        },
      });

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "DELETE_WORK_ORDER",
          resource: "WorkOrder",
          details: `Work Order ${wo.ticketNumber} dihapus (soft).`,
          ip: req.clientIp || "0.0.0.0",
        },
      });
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
