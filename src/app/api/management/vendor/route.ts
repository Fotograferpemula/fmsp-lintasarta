import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { VendorContractCreateSchema, validateRequest } from "@/lib/validators";
import { handleApiError } from "@/lib/api-error";
import { parsePagination, paginationMeta } from "@/lib/pagination";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const where = { deletedAt: null };

    const [contracts, total] = await Promise.all([
      prisma.vendorContract.findMany({
        where,
        orderBy: { endDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.vendorContract.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data: contracts,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(VendorContractCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const {
      vendorName,
      contractTitle,
      contractType,
      startDate,
      endDate,
      value,
      pic,
      documentUrl,
      notes,
    } = validation.data;
    const contract = await prisma.vendorContract.create({
      data: {
        vendorName,
        contractTitle,
        contractType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        value,
        pic,
        documentUrl: documentUrl || null,
        notes: notes || null,
        status: "active",
      },
    });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_VENDOR_CONTRACT",
        resource: "VendorContract",
        details: `Kontrak "${contractTitle}" dengan ${vendorName} dibuat.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({ success: true, data: contract });
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
      "vendorName",
      "contractTitle",
      "contractType",
      "startDate",
      "endDate",
      "value",
      "pic",
      "documentUrl",
      "notes",
      "status",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.value) updates.value = parseFloat(updates.value);
    const contract = await prisma.vendorContract.update({
      where: { id },
      data: updates,
    });
    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_VENDOR_CONTRACT",
        resource: "VendorContract",
        details: `Kontrak "${contract.contractTitle}" dengan ${contract.vendorName} diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });
    return NextResponse.json({ success: true, data: contract });
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

    const contract = await prisma.vendorContract.findUnique({ where: { id: body.id } });
    if (!contract) {
      return NextResponse.json(
        { success: false, error: "Kontrak tidak ditemukan." },
        { status: 404 },
      );
    }

    // Soft delete
    await prisma.$transaction(async (tx) => {
      await tx.vendorContract.update({
        where: { id: body.id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          user: user.email,
          action: "DELETE_VENDOR_CONTRACT",
          resource: "VendorContract",
          details: `Kontrak "${contract.contractTitle}" dengan ${contract.vendorName} dihapus (soft).`,
          ip: req.clientIp || "0.0.0.0",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Kontrak vendor berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("vendor_view", handleGet));
export const POST = withAuth(withPermission("vendor_manage", handlePost));
export const PUT = withAuth(withPermission("vendor_manage", handlePut));
export const DELETE = withAuth(withPermission("vendor_manage", handleDelete));
