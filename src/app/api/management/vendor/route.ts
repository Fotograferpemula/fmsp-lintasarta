import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const contracts = await prisma.vendorContract.findMany({ orderBy: { endDate: 'asc' } });
    return NextResponse.json({ success: true, data: contracts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { vendorName, contractTitle, contractType, startDate, endDate, value, pic, documentUrl, notes } = body;
    if (!vendorName || !contractTitle || !contractType || !startDate || !endDate || !value || !pic) {
      return NextResponse.json({ success: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }
    const contract = await prisma.vendorContract.create({
      data: { vendorName, contractTitle, contractType, startDate: new Date(startDate), endDate: new Date(endDate), value: parseFloat(value), pic, documentUrl: documentUrl || null, notes: notes || null, status: 'active' },
    });
    await prisma.auditLog.create({ data: { user: user.email, action: 'CREATE_VENDOR_CONTRACT', resource: 'VendorContract', details: `Kontrak "${contractTitle}" dengan ${vendorName} dibuat.` } });
    return NextResponse.json({ success: true, data: contract });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.value) updates.value = parseFloat(updates.value);
    const contract = await prisma.vendorContract.update({ where: { id }, data: updates });
    return NextResponse.json({ success: true, data: contract });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    await prisma.vendorContract.delete({ where: { id: body.id } });
    await prisma.auditLog.create({ data: { user: user.email, action: 'DELETE_VENDOR_CONTRACT', resource: 'VendorContract', details: `Kontrak vendor ID ${body.id} dihapus.` } });
    return NextResponse.json({ success: true, message: 'Kontrak vendor berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
