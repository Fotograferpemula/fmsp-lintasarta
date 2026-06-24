import { NextResponse } from "next/server";
import { generateToken, extractClientIp } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// ────────────────────────────────────────────────────────
// Google OAuth 2.0 — SSO Endpoint
// Replaces previous mock SSO. Requires GOOGLE_CLIENT_ID env.
// Google handles 2-Step Verification natively.
// ────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// Verify Google ID token via Google's tokeninfo API
async function verifyGoogleIdToken(
  idToken: string,
): Promise<{
  email: string;
  name: string;
  sub: string;
  email_verified: boolean;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!response.ok) return null;

    const payload = await response.json();

    // Verify audience matches our client ID
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      console.error(
        "[SSO] Google token audience mismatch:",
        payload.aud,
        "!==",
        GOOGLE_CLIENT_ID,
      );
      return null;
    }

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && parseInt(payload.exp) < now) {
      console.error("[SSO] Google token expired");
      return null;
    }

    // Verify email is verified by Google
    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      console.error("[SSO] Google email not verified");
      return null;
    }

    return {
      email: payload.email,
      name: payload.name || payload.email,
      sub: payload.sub,
      email_verified: true,
    };
  } catch (error: any) {
    console.error("[SSO] Google token verification failed:", error.message);
    return null;
  }
}

// POST /api/auth/sso — Google OAuth login
export async function POST(req: Request) {
  try {
    // Guard: Google OAuth must be configured
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google OAuth belum dikonfigurasi. Set GOOGLE_CLIENT_ID di environment.",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { action, idToken } = body;

    // ── Step 1: Get Google Client ID for frontend initialization ──
    if (action === "config") {
      return NextResponse.json({
        success: true,
        data: {
          clientId: GOOGLE_CLIENT_ID,
          provider: "Google OAuth 2.0",
          note: "Google 2-Step Verification diterapkan secara otomatis oleh Google.",
        },
      });
    }

    // ── Step 2: Verify Google ID Token & Issue JWT ──
    if (action === "callback") {
      if (!idToken || typeof idToken !== "string") {
        return NextResponse.json(
          { success: false, error: "Google ID token wajib dikirim." },
          { status: 400 },
        );
      }

      // Verify the Google ID token
      const googleUser = await verifyGoogleIdToken(idToken);
      if (!googleUser) {
        await prisma.auditLog.create({
          data: {
            user: "unknown",
            action: "SSO_LOGIN_FAILED",
            resource: "Auth",
            details:
              "Google ID token verification failed — invalid, expired, or audience mismatch.",
            ip: extractClientIp(req),
          },
        });
        return NextResponse.json(
          {
            success: false,
            error: "Verifikasi Google gagal. Token tidak valid atau expired.",
          },
          { status: 401 },
        );
      }

      // SECURITY: Validate corporate email domain (BRD §2.1)
      const ALLOWED_DOMAIN = "@lintasarta.co.id";
      if (!googleUser.email.endsWith(ALLOWED_DOMAIN)) {
        await prisma.auditLog.create({
          data: {
            user: googleUser.email,
            action: "SSO_LOGIN_FAILED",
            resource: "Auth",
            details: `Google SSO: domain email ${googleUser.email} tidak diizinkan (hanya @lintasarta.co.id).`,
            ip: extractClientIp(req),
          },
        });
        return NextResponse.json(
          {
            success: false,
            error:
              "Hanya akun korporat @lintasarta.co.id yang diizinkan untuk login via Google SSO.",
          },
          { status: 403 },
        );
      }

      // Find matching FMSP user by email
      const user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (!user) {
        await prisma.auditLog.create({
          data: {
            user: googleUser.email,
            action: "SSO_LOGIN_FAILED",
            resource: "Auth",
            details: `Google SSO: email ${googleUser.email} terverifikasi oleh Google, tapi tidak terdaftar di sistem FMSP.`,
            ip: extractClientIp(req),
          },
        });
        return NextResponse.json(
          {
            success: false,
            error:
              "Email Google Anda tidak terdaftar di sistem FMSP. Hubungi administrator.",
          },
          { status: 403 },
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "Akun FMSP Anda telah dinonaktifkan. Hubungi administrator.",
          },
          { status: 403 },
        );
      }

      // Issue FMSP JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        region: user.region || undefined,
      });

      await prisma.auditLog.create({
        data: {
          user: user.email,
          action: "SSO_LOGIN_SUCCESS",
          resource: "Auth",
          details: `Google OAuth login berhasil. User: ${user.name} (${user.role}). Google Sub: ${googleUser.sub}`,
          ip: extractClientIp(req),
        },
      });

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
          },
          ssoProvider: "Google OAuth 2.0",
        },
      });

      response.cookies.set("fmsp_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60,
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use: config, callback." },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[SSO] Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat proses SSO." },
      { status: 500 },
    );
  }
}
