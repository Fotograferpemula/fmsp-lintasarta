import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generateToken, extractClientIp } from '@/lib/auth-middleware';
import { LoginSchema, validateRequest } from '@/lib/validators';
import { getRoleConfig } from '@/lib/rbac';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  const clientIp = extractClientIp(req);
  try {
    const body = await req.json();
    
    // Validate input
    const validation = validateRequest(LoginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await prisma.auditLog.create({
        data: {
          user: email,
          action: 'LOGIN_FAILED',
          resource: 'Auth',
          details: `Login gagal: akun ${email} tidak ditemukan.`,
          ip: clientIp,
        },
      });
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah dinonaktifkan. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // ── Account Lockout Check ──
    if (user.lockedUntil) {
      const now = new Date();
      if (user.lockedUntil > now) {
        const remainingMs = user.lockedUntil.getTime() - now.getTime();
        const remainingMin = Math.ceil(remainingMs / 60000);
        return NextResponse.json(
          { success: false, error: `Akun terkunci karena ${MAX_FAILED_ATTEMPTS}x percobaan gagal. Coba lagi dalam ${remainingMin} menit.` },
          { status: 429 }
        );
      }
      // Lockout expired — reset counter
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastFailedLogin: null },
      });
      user.failedLoginAttempts = 0;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lastFailedLogin: new Date(),
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        },
      });

      await prisma.auditLog.create({
        data: {
          user: email,
          action: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          resource: 'Auth',
          details: shouldLock
            ? `Akun ${email} DIKUNCI selama 15 menit (${newAttempts}x gagal login).`
            : `Login gagal: password salah untuk ${email} (percobaan ke-${newAttempts}/${MAX_FAILED_ATTEMPTS}).`,
          ip: clientIp,
        },
      });

      if (shouldLock) {
        return NextResponse.json(
          { success: false, error: `Akun terkunci selama 15 menit karena ${MAX_FAILED_ATTEMPTS}x percobaan gagal.` },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Email atau password salah. (${newAttempts}/${MAX_FAILED_ATTEMPTS} percobaan)` },
        { status: 401 }
      );
    }

    // ── Login Success — reset lockout counter ──
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastFailedLogin: null },
      });
    }

    // Generate JWT (include region for scoped access)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      region: user.region || undefined,
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        user: email,
        action: 'LOGIN_SUCCESS',
        resource: 'Auth',
        details: `User ${user.name} (${user.role}) berhasil login.`,
        ip: clientIp,
      },
    });

    // Set cookie + return token
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          region: user.region,
          roleLabel: getRoleConfig(user.role).label,
          mustChangePassword: user.mustChangePassword || false,
        },
      },
    });

    response.cookies.set('fmsp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat proses login.' },
      { status: 500 }
    );
  }
}
