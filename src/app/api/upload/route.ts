import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';

const RESOURCE = 'upload';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'docs');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB sesuai SRS FR-04
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Tipe file tidak didukung: ${file.type}. Hanya PDF, PNG, JPG.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Ukuran file melebihi batas 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await writeFile(filePath, buffer);

    const url = `/uploads/docs/${uniqueName}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename: uniqueName,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const POST = withAuth(withRBAC(handlePost, RESOURCE));
