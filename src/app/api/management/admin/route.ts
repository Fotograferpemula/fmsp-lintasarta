import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'admin';

// GET: Ambil semua master data (opsional filter by category)
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) where.category = category;

    const data = await prisma.masterData.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });

    // Get distinct categories for the sidebar
    const categories = await prisma.masterData.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data,
      categories: categories.map(c => ({ category: c.category, count: c._count.id })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Buat master data baru
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { category, code, label, description, isActive, sortOrder } = body;

    if (!category || !code || !label) {
      return NextResponse.json({ success: false, error: 'category, code, dan label wajib diisi' }, { status: 400 });
    }

    const item = await prisma.masterData.create({
      data: {
        category: category.toLowerCase().replace(/\s+/g, '_'),
        code: code.toLowerCase().replace(/\s+/g, '_'),
        label,
        description: description || '',
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: 'CREATE_MASTER_DATA',
        resource: 'MasterData',
        details: `Master data "${label}" (${category}/${code}) ditambahkan.`,
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Kode sudah ada di kategori tersebut (duplikat)' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update master data
async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id, label, description, isActive, sortOrder, code } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.masterData.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.masterData.update({
      where: { id },
      data: {
        label: label || existing.label,
        code: code ? code.toLowerCase().replace(/\s+/g, '_') : existing.code,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: 'UPDATE_MASTER_DATA',
        resource: 'MasterData',
        details: `Master data "${updated.label}" (${updated.category}/${updated.code}) diperbarui.`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus master data
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }

    const item = await prisma.masterData.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    await prisma.masterData.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: 'DELETE_MASTER_DATA',
        resource: 'MasterData',
        details: `Master data "${item.label}" (${item.category}/${item.code}) dihapus.`,
      },
    });

    return NextResponse.json({ success: true, message: `"${item.label}" berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
