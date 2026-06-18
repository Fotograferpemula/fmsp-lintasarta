import { NextResponse } from 'next/server';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { getRoleConfig } from '@/lib/rbac';

async function handler(req: AuthenticatedRequest, user: JWTPayload) {
  return NextResponse.json({
    success: true,
    data: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      region: user.region || null,
      roleLabel: getRoleConfig(user.role).label,
    },
  });
}

export const GET = withAuth(handler);
