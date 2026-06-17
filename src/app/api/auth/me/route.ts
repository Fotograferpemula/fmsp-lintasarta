import { NextResponse } from 'next/server';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest, user: JWTPayload) {
  return NextResponse.json({
    success: true,
    data: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

export const GET = withAuth(handler);
