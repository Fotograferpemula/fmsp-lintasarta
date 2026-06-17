import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'management';

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { sku: 'asc' } });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { sku, name, category, qty, minQty, maxQty, unit, location, unitPrice, lastRestocked } = body;

    if (!sku || !name || !category || qty === undefined || minQty === undefined || maxQty === undefined || !unit || !location || unitPrice === undefined) {
      return NextResponse.json({ success: false, error: 'Semua field wajib (kecuali lastRestocked).' }, { status: 400 });
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ success: false, error: `Item dengan SKU ${sku} sudah ada.` }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        sku, name, category,
        qty: parseInt(qty), minQty: parseInt(minQty), maxQty: parseInt(maxQty),
        unit, location, unitPrice: parseFloat(unitPrice),
        lastRestocked: lastRestocked ? new Date(lastRestocked) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'CREATE_INVENTORY', resource: 'InventoryItem', details: `Item "${name}" (SKU: ${sku}) ditambahkan.` },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    if (updates.qty !== undefined) updates.qty = parseInt(updates.qty);
    if (updates.minQty !== undefined) updates.minQty = parseInt(updates.minQty);
    if (updates.maxQty !== undefined) updates.maxQty = parseInt(updates.maxQty);
    if (updates.unitPrice !== undefined) updates.unitPrice = parseFloat(updates.unitPrice);
    if (updates.lastRestocked) updates.lastRestocked = new Date(updates.lastRestocked);

    const item = await prisma.inventoryItem.update({ where: { id }, data: updates });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'UPDATE_INVENTORY', resource: 'InventoryItem', details: `Item "${item.name}" (SKU: ${item.sku}) diperbarui.` },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });

    const item = await prisma.inventoryItem.findUnique({ where: { id: body.id } });
    await prisma.inventoryItem.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'DELETE_INVENTORY', resource: 'InventoryItem', details: `Item "${item?.name}" (SKU: ${item?.sku}) dihapus.` },
    });

    return NextResponse.json({ success: true, message: 'Item inventaris berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
