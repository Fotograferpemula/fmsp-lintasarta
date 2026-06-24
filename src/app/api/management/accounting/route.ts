import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { TransactionCreateSchema, validateRequest } from "@/lib/validators";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const transactions = await prisma.accountingTransaction.findMany({
      include: {
        rabBudget: { select: { department: true, category: true, year: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(TransactionCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const { date, description, type, amount, category, rabBudgetId } =
      validation.data;

    const transaction = await prisma.accountingTransaction.create({
      data: {
        date: new Date(date),
        description,
        type,
        amount,
        category,
        rabBudgetId: rabBudgetId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_TRANSACTION",
        resource: "AccountingTransaction",
        details: `Transaksi "${description}" (${type}: Rp ${amount}) dicatat.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: transaction });
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
      "date",
      "description",
      "type",
      "amount",
      "category",
      "rabBudgetId",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.date) updates.date = new Date(updates.date);
    if (updates.amount !== undefined)
      updates.amount = parseFloat(updates.amount);

    const transaction = await prisma.accountingTransaction.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_TRANSACTION",
        resource: "AccountingTransaction",
        details: `Transaksi "${transaction.description}" diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: transaction });
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

    const tx = await prisma.accountingTransaction.findUnique({
      where: { id: body.id },
    });
    await prisma.accountingTransaction.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_TRANSACTION",
        resource: "AccountingTransaction",
        details: `Transaksi "${tx?.description}" dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("accounting_view", handleGet));
export const POST = withAuth(withPermission("accounting_manage", handlePost));
export const PUT = withAuth(withPermission("accounting_manage", handlePut));
export const DELETE = withAuth(
  withPermission("accounting_manage", handleDelete),
);
