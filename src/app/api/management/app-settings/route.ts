import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { clearSettingsCache, seedDefaultSettings, DEFAULT_SETTINGS } from "@/lib/app-settings";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "app-settings";

// GET: Ambil semua settings (grouped), mask password
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    // Seed defaults if table is empty
    const count = await prisma.appSetting.count();
    if (count === 0) {
      await seedDefaultSettings();
    }

    const settings = await prisma.appSetting.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });

    // Mask password values
    const masked = settings.map((s) => ({
      ...s,
      value: s.inputType === "password" && s.value ? "••••••••" : s.value,
    }));

    // Group by group
    const grouped: Record<string, typeof masked> = {};
    for (const s of masked) {
      if (!grouped[s.group]) grouped[s.group] = [];
      grouped[s.group].push(s);
    }

    return NextResponse.json({ success: true, data: grouped });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// PUT: Update settings (SuperAdmin only)
async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    // Permission gating is handled by withPermission("app_settings_manage") wrapper.
    // No additional role check needed here.

    const body = await req.json();
    const { updates } = body; // [{ key: string, value: string }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Format data tidak valid. Kirim { updates: [{ key, value }] }",
        },
        { status: 400 },
      );
    }

    const results = [];
    for (const { key, value } of updates) {
      if (!key || typeof key !== "string") continue;

      // Skip masked password values (unchanged)
      if (value === "••••••••") continue;

      // Use upsert: auto-create the setting if it doesn't exist yet
      const setting = DEFAULT_SETTINGS.find((d) => d.key === key);
      const updated = await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          label: setting?.label || key,
          group: setting?.group || "system",
          inputType: setting?.inputType || "text",
        },
      });
      results.push(updated);
    }

    // Clear cache so new values take effect immediately
    clearSettingsCache();

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_APP_SETTINGS",
        resource: "AppSetting",
        details: `${results.length} pengaturan sistem diperbarui: ${results.map((r) => r.key).join(", ")}`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${results.length} pengaturan berhasil disimpan.`,
      data: results,
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

// POST: Test email dengan config saat ini
async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    if (user.role !== "superadmin") {
      return NextResponse.json(
        {
          success: false,
          error: "Hanya SuperAdmin yang bisa mengirim test email.",
        },
        { status: 403 },
      );
    }

    const { sendEmail } = await import("@/lib/email-service");

    const result = await sendEmail({
      to: user.email,
      subject: "✅ FMSP — Test Email Berhasil",
      message: `Ini adalah test email dari FMSP. Konfigurasi SMTP Anda sudah benar. Email dikirim pada ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}.`,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Test email berhasil dikirim ke ${user.email}`
        : `Gagal mengirim email: ${result.error}`,
      previewUrl: result.previewUrl,
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("app_settings_view", handleGet));
export const PUT = withAuth(withPermission("app_settings_manage", handlePut));
export const POST = withAuth(withPermission("app_settings_manage", handlePost));
