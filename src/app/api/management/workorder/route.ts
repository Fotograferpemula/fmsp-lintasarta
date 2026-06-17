import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: { asset: { select: { name: true, location: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: workOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { title, description, priority, category, assetId, assignedTo, slaDeadline } = body;
    if (!title || !description || !priority || !category) {
      return NextResponse.json({ success: false, error: 'title, description, priority, dan category wajib diisi.' }, { status: 400 });
    }

    // Auto-generate ticket number
    const count = await prisma.workOrder.count();
    const ticketNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const wo = await prisma.workOrder.create({
      data: {
        ticketNumber, title, description, priority, category,
        assetId: assetId || null,
        assignedTo: assignedTo || null,
        reportedBy: user.email,
        slaDeadline: slaDeadline ? new Date(slaDeadline) : null,
        status: 'open',
      },
    });
    await prisma.auditLog.create({ data: { user: user.email, action: 'CREATE_WORK_ORDER', resource: 'WorkOrder', details: `Work Order ${ticketNumber}: "${title}" dibuat.` } });
    return NextResponse.json({ success: true, data: wo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    if (updates.slaDeadline) updates.slaDeadline = new Date(updates.slaDeadline);
    if (updates.status === 'resolved') updates.resolvedAt = new Date();
    const wo = await prisma.workOrder.update({ where: { id }, data: updates });
    await prisma.auditLog.create({ data: { user: user.email, action: 'UPDATE_WORK_ORDER', resource: 'WorkOrder', details: `Work Order ${wo.ticketNumber} diperbarui.` } });
    return NextResponse.json({ success: true, data: wo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    const wo = await prisma.workOrder.findUnique({ where: { id: body.id } });
    await prisma.workOrder.delete({ where: { id: body.id } });
    await prisma.auditLog.create({ data: { user: user.email, action: 'DELETE_WORK_ORDER', resource: 'WorkOrder', details: `Work Order ${wo?.ticketNumber} dihapus.` } });
    return NextResponse.json({ success: true, message: 'Work Order berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
