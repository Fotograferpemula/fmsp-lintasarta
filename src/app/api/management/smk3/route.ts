import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { Smk3CreateSchema, validateRequest } from "@/lib/validators";
import { getRegionFilter } from "@/lib/region-filter";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const regionWhere = getRegionFilter(user);
    const items = await prisma.smk3Item.findMany({
      where: regionWhere,
      orderBy: { lastChecked: "desc" },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(Smk3CreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const { item, location, lastChecked, status, checkedBy } = validation.data;

    const record = await prisma.smk3Item.create({
      data: {
        item,
        location,
        lastChecked: new Date(lastChecked),
        status: status || "ok",
        checkedBy,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_SMK3",
        resource: "Smk3Item",
        details: `Item SMK3 "${item}" di ${location} ditambahkan.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: record });
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

    // Whitelist: hanya field ini yang boleh diubah
    const ALLOWED = [
      "item",
      "location",
      "lastChecked",
      "status",
      "checkedBy",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.lastChecked)
      updates.lastChecked = new Date(updates.lastChecked);

    const record = await prisma.smk3Item.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_SMK3",
        resource: "Smk3Item",
        details: `Item SMK3 "${record.item}" di ${record.location} diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: record });
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

    const item = await prisma.smk3Item.findUnique({ where: { id: body.id } });
    await prisma.smk3Item.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_SMK3",
        resource: "Smk3Item",
        details: `Item SMK3 "${item?.item}" dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Item SMK3 berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("smk3_view", handleGet));
export const POST = withAuth(withPermission("smk3_manage", handlePost));
export const PUT = withAuth(withPermission("smk3_manage", handlePut));
export const DELETE = withAuth(withPermission("smk3_manage", handleDelete));
