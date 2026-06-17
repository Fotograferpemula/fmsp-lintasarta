import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fmsp-lintasarta-secret-key-change-in-production-2026';
const JWT_EXPIRES_IN = '8h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Extract token from request headers
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Fallback: check cookie
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/fmsp_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// Auth middleware wrapper for API route handlers
export function withAuth(
  handler: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: Request) => {
    const token = extractToken(req);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Token tidak ditemukan. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Token tidak valid atau sudah expired.' },
        { status: 401 }
      );
    }

    (req as AuthenticatedRequest).user = user;
    return handler(req as AuthenticatedRequest, user);
  };
}
