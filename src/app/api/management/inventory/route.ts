import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { InventoryCreateSchema, validateRequest } from "@/lib/validators";
import { getRegionFilter } from "@/lib/region-filter";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const regionWhere = getRegionFilter(user);
    const items = await prisma.inventoryItem.findMany({
      where: regionWhere,
      orderBy: { sku: "asc" },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(InventoryCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const {
      sku,
      name,
      category,
      qty,
      minQty,
      maxQty,
      unit,
      location,
      unitPrice,
      lastRestocked,
    } = validation.data;

    const existing = await prisma.inventoryItem.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Item dengan SKU ${sku} sudah ada.` },
        { status: 400 },
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        sku,
        name,
        category,
        qty,
        minQty,
        maxQty,
        unit,
        location,
        unitPrice,
        lastRestocked: lastRestocked ? new Date(lastRestocked) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_INVENTORY",
        resource: "InventoryItem",
        details: `Item "${name}" (SKU: ${sku}) ditambahkan.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: item });
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

    // Whitelist: hanya field ini yang boleh diubah (SKU blocked)
    const ALLOWED = [
      "name",
      "category",
      "qty",
      "minQty",
      "maxQty",
      "unit",
      "location",
      "unitPrice",
      "lastRestocked",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.qty !== undefined) updates.qty = parseInt(updates.qty);
    if (updates.minQty !== undefined) updates.minQty = parseInt(updates.minQty);
    if (updates.maxQty !== undefined) updates.maxQty = parseInt(updates.maxQty);
    if (updates.unitPrice !== undefined)
      updates.unitPrice = parseFloat(updates.unitPrice);
    if (updates.lastRestocked)
      updates.lastRestocked = new Date(updates.lastRestocked);

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_INVENTORY",
        resource: "InventoryItem",
        details: `Item "${item.name}" (SKU: ${item.sku}) diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: item });
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

    const item = await prisma.inventoryItem.findUnique({
      where: { id: body.id },
    });
    await prisma.inventoryItem.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_INVENTORY",
        resource: "InventoryItem",
        details: `Item "${item?.name}" (SKU: ${item?.sku}) dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Item inventaris berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("inventory_view", handleGet));
export const POST = withAuth(withPermission("inventory_manage", handlePost));
export const PUT = withAuth(withPermission("inventory_manage", handlePut));
export const DELETE = withAuth(
  withPermission("inventory_manage", handleDelete),
);
