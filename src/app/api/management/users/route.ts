import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, withRole, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { hasPermission, canManageRole, getAssignableRoles, ROLE_NAMES, getRoleConfig } from '@/lib/rbac';
import bcrypt from 'bcryptjs';

// ── GET /api/management/users — Daftar semua user ─────────
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, department: true, phone: true, region: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
  });

  // Return assignable roles for the form
  const assignableRoles = getAssignableRoles(user.role).map(r => ({
    value: r,
    label: getRoleConfig(r).label,
    color: getRoleConfig(r).color,
  }));

  return NextResponse.json({ success: true, data: users, assignableRoles });
}

// ── POST /api/management/users — Buat user baru ───────────
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  const body = await req.json();
  const { email, name, role, password, department, phone, region } = body;

  if (!email || !name || !role || !password) {
    return NextResponse.json({ success: false, error: 'Email, nama, role, dan password wajib diisi' }, { status: 400 });
  }
  if (!ROLE_NAMES.includes(role)) {
    return NextResponse.json({ success: false, error: 'Role tidak valid' }, { status: 400 });
  }
  // Cannot assign role equal or above own level
  if (!canManageRole(user.role, role)) {
    return NextResponse.json({ success: false, error: 'Tidak dapat membuat user dengan role yang sama atau lebih tinggi' }, { status: 403 });
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
    data: { email, name, role, passwordHash, department, phone, region },
    select: { id: true, email: true, name: true, role: true, isActive: true, department: true, region: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: 'USER_CREATED',
      resource: 'User',
      details: `User baru: ${newUser.email} (${getRoleConfig(newUser.role).label})`,
    },
  });

  return NextResponse.json({ success: true, data: newUser }, { status: 201 });
}

// ── PATCH /api/management/users — Update user ─────────────
async function handlePatch(req: AuthenticatedRequest, user: JWTPayload) {
  const body = await req.json();
  const { id, name, role, isActive, department, phone, region, newPassword } = body;

  if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });

  // Cannot manage user at or above own role level (unless superadmin)
  if (!canManageRole(user.role, targetUser.role)) {
    return NextResponse.json({ success: false, error: 'Tidak dapat mengedit user dengan role yang sama atau lebih tinggi' }, { status: 403 });
  }

  // Prevent self-deactivation
  if (targetUser.email === user.email && isActive === false) {
    return NextResponse.json({ success: false, error: 'Tidak dapat menonaktifkan akun sendiri' }, { status: 400 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined && ROLE_NAMES.includes(role)) {
    if (!canManageRole(user.role, role)) {
      return NextResponse.json({ success: false, error: 'Tidak dapat mengubah ke role yang sama atau lebih tinggi' }, { status: 403 });
    }
    updateData.role = role;
  }
  if (isActive !== undefined) updateData.isActive = isActive;
  if (department !== undefined) updateData.department = department;
  if (phone !== undefined) updateData.phone = phone;
  if (region !== undefined) updateData.region = region;
  if (newPassword && newPassword.length >= 8) {
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true, department: true, region: true, updatedAt: true },
  });

  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: 'USER_UPDATED',
      resource: 'User',
      details: `Updated ${targetUser.email}: ${JSON.stringify(updateData).replace(/"passwordHash":"[^"]*"/, '"passwordHash":"***"')}`,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

// ── DELETE /api/management/users — Soft-delete (isActive=false) ──
async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });

  if (!canManageRole(user.role, targetUser.role)) {
    return NextResponse.json({ success: false, error: 'Tidak dapat menonaktifkan user dengan role yang sama atau lebih tinggi' }, { status: 403 });
  }
  if (targetUser.email === user.email) {
    return NextResponse.json({ success: false, error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: {
      user: user.email,
      action: 'USER_DEACTIVATED',
      resource: 'User',
      details: `User ${targetUser.email} (${getRoleConfig(targetUser.role).label}) dinonaktifkan`,
    },
  });

  return NextResponse.json({ success: true, message: 'User berhasil dinonaktifkan' });
}

export const GET    = withRole('user_manage', handleGet);
export const POST   = withRole('user_manage', handlePost);
export const PATCH  = withRole('user_manage', handlePatch);
export const DELETE = withRole('user_manage', handleDelete);
