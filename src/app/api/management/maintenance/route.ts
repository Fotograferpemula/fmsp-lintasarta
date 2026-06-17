import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const schedules = await prisma.maintenanceSchedule.findMany({
      include: { asset: { select: { name: true, location: true } } },
      orderBy: { nextDue: 'asc' },
    });
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { assetId, title, intervalDays, lastPerformed, assignedTo, notes } = body;
    if (!assetId || !title || !intervalDays || !lastPerformed) {
      return NextResponse.json({ success: false, error: 'assetId, title, intervalDays, dan lastPerformed wajib diisi.' }, { status: 400 });
    }
    const lastDate = new Date(lastPerformed);
    const nextDue = new Date(lastDate.getTime() + intervalDays * 86400000);

    const schedule = await prisma.maintenanceSchedule.create({
      data: { assetId, title, intervalDays: parseInt(intervalDays), lastPerformed: lastDate, nextDue, assignedTo: assignedTo || null, notes: notes || null, status: 'scheduled' },
    });
    await prisma.auditLog.create({ data: { user: user.email, action: 'CREATE_MAINTENANCE', resource: 'MaintenanceSchedule', details: `Jadwal "${title}" dibuat.` } });
    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    // Recalculate nextDue if lastPerformed or intervalDays changed
    if (updates.lastPerformed && updates.intervalDays) {
      const lastDate = new Date(updates.lastPerformed);
      updates.nextDue = new Date(lastDate.getTime() + parseInt(updates.intervalDays) * 86400000);
      updates.intervalDays = parseInt(updates.intervalDays);
      updates.lastPerformed = lastDate;
    } else if (updates.intervalDays) {
      updates.intervalDays = parseInt(updates.intervalDays);
    } else if (updates.lastPerformed) {
      updates.lastPerformed = new Date(updates.lastPerformed);
    }

    const schedule = await prisma.maintenanceSchedule.update({ where: { id }, data: updates });
    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    await prisma.maintenanceSchedule.delete({ where: { id: body.id } });
    await prisma.auditLog.create({ data: { user: user.email, action: 'DELETE_MAINTENANCE', resource: 'MaintenanceSchedule', details: `Jadwal maintenance ID ${body.id} dihapus.` } });
    return NextResponse.json({ success: true, message: 'Jadwal maintenance berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
