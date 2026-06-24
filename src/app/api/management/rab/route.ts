import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { RabCreateSchema, validateRequest } from "@/lib/validators";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const budgets = await prisma.rabBudget.findMany({
      include: {
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            date: true,
          },
        },
      },
      orderBy: { year: "desc" },
    });

    // Compute actual spent from linked transactions
    const enriched = budgets.map((b) => {
      const computedSpent = b.transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, computedSpent };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(RabCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const { year, department, category, allocatedAmount, spentAmount } =
      validation.data;

    const budget = await prisma.rabBudget.create({
      data: {
        year,
        department,
        category,
        allocatedAmount,
        spentAmount: spentAmount ?? 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_RAB",
        resource: "RabBudget",
        details: `RAB ${department} ${category} ${year} (Rp ${allocatedAmount}) dibuat.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: budget });
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
      "year",
      "department",
      "category",
      "allocatedAmount",
      "spentAmount",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.year !== undefined) updates.year = parseInt(updates.year);
    if (updates.allocatedAmount !== undefined)
      updates.allocatedAmount = parseFloat(updates.allocatedAmount);
    if (updates.spentAmount !== undefined)
      updates.spentAmount = parseFloat(updates.spentAmount);

    const budget = await prisma.rabBudget.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_RAB",
        resource: "RabBudget",
        details: `RAB ${budget.department} ${budget.category} ${budget.year} diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: budget });
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

    const budget = await prisma.rabBudget.findUnique({
      where: { id: body.id },
    });
    await prisma.rabBudget.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_RAB",
        resource: "RabBudget",
        details: `RAB ${budget?.department} ${budget?.category} ${budget?.year} dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Anggaran RAB berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("rab_view", handleGet));
export const POST = withAuth(withPermission("rab_manage", handlePost));
export const PUT = withAuth(withPermission("rab_manage", handlePut));
export const DELETE = withAuth(withPermission("rab_manage", handleDelete));
