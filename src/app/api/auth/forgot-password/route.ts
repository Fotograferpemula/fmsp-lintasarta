import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPushToRole } from '@/lib/push-service';
import { extractClientIp } from '@/lib/auth-middleware';
import { handleApiError } from '@/lib/api-error';

// POST /api/auth/forgot-password
// User requests password reset → creates a PasswordResetRequest for admin approval
export async function POST(req: Request) {
  const clientIp = extractClientIp(req);
  try {
    const body = await req.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email wajib diisi.' }, { status: 400 });
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists — always return success message
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, permintaan reset password akan dikirim ke administrator untuk persetujuan.',
      });
    }

    // Rate limit: max 3 pending requests per user
    const pendingCount = await prisma.passwordResetRequest.count({
      where: { userId: user.id, status: 'pending' },
    });
    if (pendingCount >= 3) {
      return NextResponse.json({
        success: false,
        error: 'Anda sudah memiliki permintaan reset password yang menunggu persetujuan. Hubungi administrator.',
      }, { status: 429 });
    }

    // Create reset request (pending admin approval)
    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        reason: reason || 'Lupa password',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        user: email,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'Auth',
        details: `User ${user.name} meminta reset password. Menunggu persetujuan admin.`,
        ip: clientIp,
      },
    });

    // Create in-app notification for admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['superadmin', 'admin_pusat'] }, isActive: true },
      select: { email: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          recipientEmail: admin.email,
          type: 'dashboard',
          title: '🔑 Permintaan Reset Password',
          message: `User ${user.name} (${user.email}) meminta reset password. Alasan: ${reason || 'Lupa password'}. Silakan review di menu Manajemen User.`,
          scheduledAt: new Date(),
        },
      });
    }

    // Send push notifications to admins
    try {
      await sendPushToRole('superadmin', {
        title: '🔑 Permintaan Reset Password',
        body: `${user.name} (${user.email}) meminta reset password.`,
        tag: 'password-reset-request',
        url: '/?tab=users',
      });
      await sendPushToRole('admin_pusat', {
        title: '🔑 Permintaan Reset Password',
        body: `${user.name} (${user.email}) meminta reset password.`,
        tag: 'password-reset-request',
        url: '/?tab=users',
      });
    } catch {} // Push failure should not break the flow

    return NextResponse.json({
      success: true,
      message: 'Permintaan reset password telah dikirim ke administrator untuk persetujuan.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return handleApiError(error, 'API');
  }
}
