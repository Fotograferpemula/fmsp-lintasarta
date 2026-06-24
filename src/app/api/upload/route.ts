import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
  extractClientIp,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { validateUploadedFile, sanitizeFilename } from "@/lib/file-validator";

const RESOURCE = "upload";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "docs");

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan." },
        { status: 400 },
      );
    }

    // SECURITY: Comprehensive file validation (magic bytes, extension, size)
    const validationError = await validateUploadedFile(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      );
    }

    // SECURITY: Generate cryptographically random filename (prevent guessing)
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;

    // Sanitize original filename for logging (prevent log injection)
    const safeOriginalName = sanitizeFilename(file.name);

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // SECURITY: Verify the final path is within UPLOAD_DIR (prevent path traversal)
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return NextResponse.json(
        { success: false, error: "Path file tidak valid." },
        { status: 400 },
      );
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(resolvedPath, buffer);

    const url = `/uploads/docs/${uniqueName}`;

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPLOAD_FILE",
        resource: "Upload",
        details: `File "${safeOriginalName}" (${(file.size / 1024).toFixed(1)}KB) diupload sebagai "${uniqueName}".`,
        ip: req.clientIp || extractClientIp(req),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename: uniqueName,
        originalName: safeOriginalName,
        size: file.size,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mengupload file." },
      { status: 500 },
    );
  }
}

export const POST = withAuth(withPermission("upload", handlePost));
