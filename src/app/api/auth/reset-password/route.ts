import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { PasswordCreateSchema } from '@/lib/validators';
import { extractClientIp } from '@/lib/auth-middleware';
import { handleApiError } from '@/lib/api-error';

// POST /api/auth/reset-password
// User submits new password with valid token (after admin approval)
export async function POST(req: Request) {
  const clientIp = extractClientIp(req);
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: 'Token dan password baru wajib diisi.' }, { status: 400 });
    }

    // Validate password complexity
    const passwordValidation = PasswordCreateSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return NextResponse.json({
        success: false,
        error: passwordValidation.error.issues[0].message,
      }, { status: 400 });
    }

    // SECURITY: Tokens are stored as bcrypt hashes — find by comparing candidates
    const candidates = await prisma.passwordResetRequest.findMany({
      where: {
        status: 'approved',
        token: { not: null },
        tokenExpiry: { gte: new Date() },
      },
      include: { user: true },
    });

    let resetRequest = null;
    for (const candidate of candidates) {
      if (candidate.token && await bcrypt.compare(token, candidate.token)) {
        resetRequest = candidate;
        break;
      }
    }

    if (!resetRequest) {
      return NextResponse.json({ success: false, error: 'Token reset tidak valid, sudah digunakan, atau kadaluarsa.' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and reset lockout
    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLogin: null,
      },
    });

    // Invalidate the token (mark as used)
    await prisma.passwordResetRequest.update({
      where: { id: resetRequest.id },
      data: { token: null, tokenExpiry: null, status: 'approved' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user: resetRequest.user.email,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'Auth',
        details: `Password berhasil direset untuk ${resetRequest.user.name} (${resetRequest.user.email}).`,
        ip: clientIp,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return handleApiError(error, 'API');
  }
}
