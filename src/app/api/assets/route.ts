import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import {
  AssetCreateSchema,
  AssetUpdateSchema,
  DeleteByIdSchema,
  validateRequest,
} from "@/lib/validators";
import { getRegionFilter } from "@/lib/region-filter";
import { handleApiError } from "@/lib/api-error";
import { parsePagination, paginationMeta } from "@/lib/pagination";

const RESOURCE = "assets";

// GET: Ambil semua aset
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const regionWhere = getRegionFilter(user);
    const where = { ...regionWhere, deletedAt: null };

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          transfers: {
            orderBy: { transferredAt: "desc" },
          },
          legalDocuments: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: assets,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error: any) {
    console.error("Error fetching assets:", error);
    return handleApiError(error, "API");
  }
}

// POST: Buat aset baru
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(AssetCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const {
      name,
      type,
      location,
      specs,
      bookValue,
      status,
      purchaseDate,
      purchaseCost,
      expectedLifeYrs,
      lifecycleStatus,
      photos,
    } = validation.data;

    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({
        data: {
          name,
          type,
          location,
          specs: specs || {},
          bookValue,
          status,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchaseCost: purchaseCost !== undefined ? purchaseCost : null,
          expectedLifeYrs: expectedLifeYrs !== undefined ? expectedLifeYrs : null,
          lifecycleStatus: lifecycleStatus || "operational",
          photos: Array.isArray(photos) ? photos : [],
        },
      });

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "CREATE_ASSET",
          resource: "Asset",
          details: `Aset "${name}" (${type}) ditambahkan di lokasi ${location}.`,
          ip: req.clientIp || "0.0.0.0",
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: asset });
  } catch (error: any) {
    console.error("Error creating asset:", error);
    return handleApiError(error, "API");
  }
}

// PUT: Perbarui data aset (termasuk transfer log)
async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(AssetUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const {
      id,
      name,
      type,
      location,
      specs,
      bookValue,
      status,
      purchaseDate,
      purchaseCost,
      expectedLifeYrs,
      lifecycleStatus,
    } = validation.data;

    const currentAsset = await prisma.asset.findUnique({ where: { id } });
    if (!currentAsset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 },
      );
    }

    const isLocationChanged = location && currentAsset.location !== location;

    const result = await prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          name: name || currentAsset.name,
          type: type || currentAsset.type,
          location: location || currentAsset.location,
          specs: specs || currentAsset.specs || {},
          bookValue:
            bookValue !== undefined ? bookValue : currentAsset.bookValue,
          status: status || currentAsset.status,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          purchaseCost: purchaseCost !== undefined ? purchaseCost : undefined,
          expectedLifeYrs:
            expectedLifeYrs !== undefined ? expectedLifeYrs : undefined,
          lifecycleStatus: lifecycleStatus || undefined,
        },
      });

      if (isLocationChanged) {
        await tx.assetTransfer.create({
          data: {
            assetId: id,
            fromLocation: currentAsset.location,
            toLocation: location!,
            transferredBy: user.email,
            notes: `Perubahan lokasi aset dari panel manajemen FMSP.`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "UPDATE_ASSET",
          resource: "Asset",
          details: `Aset "${updatedAsset.name}" diperbarui oleh ${user.name}.`,
          ip: req.clientIp || "0.0.0.0",
        },
      });

      return updatedAsset;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error updating asset:", error);
    return handleApiError(error, "API");
  }
}

// DELETE: Hapus aset beserta relasi
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(DeleteByIdSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const { id } = validation.data;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 },
      );
    }

    // Soft delete — data tetap tersimpan untuk keperluan audit historis
    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "DELETE_ASSET",
          resource: "Asset",
          details: `Aset "${asset.name}" (${asset.type}) di ${asset.location} telah dihapus (soft) oleh ${user.name}.`,
          ip: req.clientIp || "0.0.0.0",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Aset "${asset.name}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("Error deleting asset:", error);
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("asset_view", handleGet));
export const POST = withAuth(withPermission("asset_create", handlePost));
export const PUT = withAuth(withPermission("asset_update", handlePut));
export const DELETE = withAuth(withPermission("asset_delete", handleDelete));
