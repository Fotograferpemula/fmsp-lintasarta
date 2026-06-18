import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import bcrypt from 'bcryptjs';

// ── GET /api/management/users — Daftar semua user ─────────
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, department: true, phone: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({ success: true, data: users });
}

// ── POST /api/management/users — Buat user baru ───────────
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, role, password, department, phone } = body;

  if (!email || !name || !role || !password) {
    return NextResponse.json({ success: false, error: 'Email, nama, role, dan password wajib diisi' }, { status: 400 });
  }
  if (!['admin', 'operator', 'viewer'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Role tidak valid' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password minimal 8 karakter' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: { email, name, role, passwordHash, department, phone },
    select: { id: true, email: true, name: true, role: true, isActive: true, department: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: 'USER_CREATED',
      resource: 'User',
      // resourceId stored in details
      details: `User baru: ${newUser.email} (${newUser.role})`,
    },
  });

  return NextResponse.json({ success: true, data: newUser }, { status: 201 });
}

// ── PATCH /api/management/users — Update user ─────────────
async function handlePatch(req: AuthenticatedRequest, user: JWTPayload) {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
  }

  const body = await req.json();
  const { id, name, role, isActive, department, phone, newPassword } = body;

  if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });

  // Prevent admin from deactivating themselves
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
  if (targetUser.email === user.email && isActive === false) {
    return NextResponse.json({ success: false, error: 'Tidak dapat menonaktifkan akun sendiri' }, { status: 400 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined && ['admin', 'operator', 'viewer'].includes(role)) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (department !== undefined) updateData.department = department;
  if (phone !== undefined) updateData.phone = phone;
  if (newPassword && newPassword.length >= 8) {
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true, department: true, updatedAt: true },
  });

  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: 'USER_UPDATED',
      resource: 'User',
      // resourceId stored in details
      details: `Updated: ${JSON.stringify(updateData).replace(/"passwordHash":"[^"]*"/, '"passwordHash":"***"')}`,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

// ── DELETE /api/management/users — Soft-delete (isActive=false) ──
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Akses ditolak' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
  if (targetUser.email === user.email) {
    return NextResponse.json({ success: false, error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
  }

  // Soft delete — set isActive to false
  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: 'USER_DEACTIVATED',
      resource: 'User',
      // resourceId stored in details
      details: `User ${targetUser.email} dinonaktifkan`,
    },
  });

  return NextResponse.json({ success: true, message: 'User berhasil dinonaktifkan' });
}

export const GET    = withAuth(handleGet);
export const POST   = withAuth(handlePost);
export const PATCH  = withAuth(handlePatch);
export const DELETE = withAuth(handleDelete);
