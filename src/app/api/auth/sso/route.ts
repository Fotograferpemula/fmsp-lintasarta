import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth-middleware';
import { prisma } from '@/lib/db';

// Mock SSO Endpoint — simulates OAuth2/SAML 2.0 flow
// Designed to be replaced with Lintasarta Infosec SSO in production

// POST /api/auth/sso — Initiate SSO login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, state, mfaCode } = body;

    // Step 1: Initiate SSO
    if (action === 'initiate') {
      const mockState = `sso_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      return NextResponse.json({
        success: true,
        data: {
          state: mockState,
          redirectUrl: `https://sso.lintasarta.co.id/oauth2/authorize?state=${mockState}`,
          provider: 'Lintasarta Active Directory (Mock)',
          protocol: 'OAuth2 / SAML 2.0',
        },
      });
    }

    // Step 2: SSO Callback — validate state and issue JWT
    if (action === 'callback') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email required for SSO callback' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found in FMSP system' }, { status: 404 });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      await prisma.auditLog.create({
        data: { user: email, action: 'SSO_LOGIN', resource: 'Auth', details: `SSO login via Lintasarta AD (Mock). User: ${user.name} (${user.role}).` },
      });

      return NextResponse.json({
        success: true,
        data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, ssoProvider: 'Lintasarta AD (Mock)' },
      });
    }

    // Step 3: MFA Verification
    if (action === 'mfa-verify') {
      // Mock: accept any 6-digit code or "approve"
      const isValid = mfaCode === 'approve' || (mfaCode && mfaCode.length === 6);
      
      await prisma.auditLog.create({
        data: { user: email || 'unknown', action: isValid ? 'MFA_VERIFIED' : 'MFA_FAILED', resource: 'Auth', details: `MFA verification ${isValid ? 'success' : 'failed'} via Microsoft Authenticator (Mock).` },
      });

      return NextResponse.json({
        success: isValid,
        data: isValid ? { verified: true, method: 'Microsoft Authenticator (Mock Push Notification)' } : undefined,
        error: isValid ? undefined : 'MFA verification failed. Invalid code.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use: initiate, callback, or mfa-verify.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
