import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generateToken } from '@/lib/auth-middleware';
import { LoginSchema, validateRequest } from '@/lib/validators';

export async function POST(req: Request) {
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
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          user: email,
          action: 'LOGIN_FAILED',
          resource: 'Auth',
          details: `Login gagal: akun ${email} tidak ditemukan.`,
        },
      });
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await prisma.auditLog.create({
        data: {
          user: email,
          action: 'LOGIN_FAILED',
          resource: 'Auth',
          details: `Login gagal: password salah untuk akun ${email}.`,
        },
      });
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        user: email,
        action: 'LOGIN_SUCCESS',
        resource: 'Auth',
        details: `User ${user.name} (${user.role}) berhasil login.`,
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
