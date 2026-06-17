import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const items = await prisma.smk3Item.findMany({ orderBy: { lastChecked: 'desc' } });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { item, location, lastChecked, status, checkedBy } = body;

    if (!item || !location || !lastChecked || !checkedBy) {
      return NextResponse.json({ success: false, error: 'item, location, lastChecked, dan checkedBy wajib diisi.' }, { status: 400 });
    }

    const record = await prisma.smk3Item.create({
      data: { item, location, lastChecked: new Date(lastChecked), status: status || 'ok', checkedBy },
    });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'CREATE_SMK3', resource: 'Smk3Item', details: `Item SMK3 "${item}" di ${location} ditambahkan.` },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    if (updates.lastChecked) updates.lastChecked = new Date(updates.lastChecked);

    const record = await prisma.smk3Item.update({ where: { id }, data: updates });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'UPDATE_SMK3', resource: 'Smk3Item', details: `Item SMK3 "${record.item}" di ${record.location} diperbarui.` },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    const item = await prisma.smk3Item.findUnique({ where: { id: body.id } });
    await prisma.smk3Item.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'DELETE_SMK3', resource: 'Smk3Item', details: `Item SMK3 "${item?.item}" dihapus.` },
    });

    return NextResponse.json({ success: true, message: 'Item SMK3 berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
