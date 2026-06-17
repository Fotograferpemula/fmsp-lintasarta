import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const budgets = await prisma.rabBudget.findMany({
      include: {
        transactions: {
          select: { id: true, amount: true, type: true, description: true, date: true },
        },
      },
      orderBy: { year: 'desc' },
    });

    // Compute actual spent from linked transactions
    const enriched = budgets.map(b => {
      const computedSpent = b.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, computedSpent };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { year, department, category, allocatedAmount, spentAmount } = body;

    if (!year || !department || !category || allocatedAmount === undefined) {
      return NextResponse.json({ success: false, error: 'year, department, category, dan allocatedAmount wajib diisi.' }, { status: 400 });
    }

    const budget = await prisma.rabBudget.create({
      data: {
        year: parseInt(year), department, category,
        allocatedAmount: parseFloat(allocatedAmount),
        spentAmount: spentAmount !== undefined ? parseFloat(spentAmount) : 0,
      },
    });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'CREATE_RAB', resource: 'RabBudget', details: `RAB ${department} ${category} ${year} (Rp ${allocatedAmount}) dibuat.` },
    });

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    if (updates.year !== undefined) updates.year = parseInt(updates.year);
    if (updates.allocatedAmount !== undefined) updates.allocatedAmount = parseFloat(updates.allocatedAmount);
    if (updates.spentAmount !== undefined) updates.spentAmount = parseFloat(updates.spentAmount);

    const budget = await prisma.rabBudget.update({ where: { id }, data: updates });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'UPDATE_RAB', resource: 'RabBudget', details: `RAB ${budget.department} ${budget.category} ${budget.year} diperbarui.` },
    });

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    const budget = await prisma.rabBudget.findUnique({ where: { id: body.id } });
    await prisma.rabBudget.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'DELETE_RAB', resource: 'RabBudget', details: `RAB ${budget?.department} ${budget?.category} ${budget?.year} dihapus.` },
    });

    return NextResponse.json({ success: true, message: 'Anggaran RAB berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
