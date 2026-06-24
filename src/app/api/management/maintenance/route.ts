import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { MaintenanceCreateSchema, validateRequest } from "@/lib/validators";
import { getRegionFilterNested } from "@/lib/region-filter";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const regionWhere = getRegionFilterNested(user);
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: regionWhere,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            location: true,
            type: true,
            status: true,
            specs: true,
            bookValue: true,
            purchaseDate: true,
            lifecycleStatus: true,
            photos: true,
          },
        },
      },
      orderBy: { nextDue: "asc" },
    });
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(MaintenanceCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const { assetId, title, intervalDays, lastPerformed, assignedTo, notes } =
      validation.data;
    const lastDate = new Date(lastPerformed);
    const nextDue = new Date(lastDate.getTime() + intervalDays * 86400000);

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        assetId,
        title,
        intervalDays,
        lastPerformed: lastDate,
        nextDue,
        assignedTo: assignedTo || null,
        notes: notes || null,
        status: "scheduled",
      },
    });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_MAINTENANCE",
        resource: "MaintenanceSchedule",
        details: `Jadwal "${title}" dibuat.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({ success: true, data: schedule });
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

    // Whitelist: hanya field ini yang boleh diubah (assetId blocked)
    const ALLOWED = [
      "title",
      "intervalDays",
      "lastPerformed",
      "assignedTo",
      "notes",
      "status",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Recalculate nextDue if lastPerformed or intervalDays changed
    if (updates.lastPerformed && updates.intervalDays) {
      const lastDate = new Date(updates.lastPerformed);
      updates.nextDue = new Date(
        lastDate.getTime() + parseInt(updates.intervalDays) * 86400000,
      );
      updates.intervalDays = parseInt(updates.intervalDays);
      updates.lastPerformed = lastDate;
    } else if (updates.lastPerformed) {
      // Ambil intervalDays dari existing record untuk recalculate nextDue
      const existing = await prisma.maintenanceSchedule.findUnique({
        where: { id },
        select: { intervalDays: true },
      });
      const lastDate = new Date(updates.lastPerformed);
      updates.lastPerformed = lastDate;
      if (existing) {
        updates.nextDue = new Date(
          lastDate.getTime() + existing.intervalDays * 86400000,
        );
      }
    } else if (updates.intervalDays) {
      updates.intervalDays = parseInt(updates.intervalDays);
    }

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ success: true, data: schedule });
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
    await prisma.maintenanceSchedule.delete({ where: { id: body.id } });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_MAINTENANCE",
        resource: "MaintenanceSchedule",
        details: `Jadwal maintenance ID ${body.id} dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({
      success: true,
      message: "Jadwal maintenance berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("maintenance_view", handleGet));
export const POST = withAuth(withPermission("maintenance_manage", handlePost));
export const PUT = withAuth(withPermission("maintenance_manage", handlePut));
export const DELETE = withAuth(
  withPermission("maintenance_manage", handleDelete),
);
