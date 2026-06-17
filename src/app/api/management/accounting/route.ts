import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const transactions = await prisma.accountingTransaction.findMany({
      include: { rabBudget: { select: { department: true, category: true, year: true } } },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { date, description, type, amount, category, rabBudgetId } = body;

    if (!date || !description || !type || amount === undefined || !category) {
      return NextResponse.json({ success: false, error: 'date, description, type, amount, dan category wajib diisi.' }, { status: 400 });
    }

    const transaction = await prisma.accountingTransaction.create({
      data: {
        date: new Date(date), description, type,
        amount: parseFloat(amount), category,
        rabBudgetId: rabBudgetId || null,
      },
    });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'CREATE_TRANSACTION', resource: 'AccountingTransaction', details: `Transaksi "${description}" (${type}: Rp ${amount}) dicatat.` },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    if (updates.date) updates.date = new Date(updates.date);
    if (updates.amount !== undefined) updates.amount = parseFloat(updates.amount);

    const transaction = await prisma.accountingTransaction.update({ where: { id }, data: updates });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'UPDATE_TRANSACTION', resource: 'AccountingTransaction', details: `Transaksi "${transaction.description}" diperbarui.` },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    const tx = await prisma.accountingTransaction.findUnique({ where: { id: body.id } });
    await prisma.accountingTransaction.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'DELETE_TRANSACTION', resource: 'AccountingTransaction', details: `Transaksi "${tx?.description}" dihapus.` },
    });

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
