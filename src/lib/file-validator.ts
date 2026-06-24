// ────────────────────────────────────────────────────────
// File Validation Utility
// Magic bytes verification + filename sanitization
// ────────────────────────────────────────────────────────

// Magic bytes signatures for allowed file types
const FILE_SIGNATURES: Record<string, { magic: number[]; offset: number }[]> = {
  '.pdf':  [{ magic: [0x25, 0x50, 0x44, 0x46], offset: 0 }],                     // %PDF
  '.png':  [{ magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 }], // PNG header
  '.jpg':  [{ magic: [0xFF, 0xD8, 0xFF], offset: 0 }],                            // JPEG/JFIF
  '.jpeg': [{ magic: [0xFF, 0xD8, 0xFF], offset: 0 }],                            // JPEG/JFIF
  '.webp': [{ magic: [0x52, 0x49, 0x46, 0x46], offset: 0 }],                      // RIFF (WebP)
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(FILE_SIGNATURES));

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (reduced from 100MB)

/**
 * Validate file content by checking magic bytes.
 * Returns true if the file content matches the expected format for the extension.
 */
export async function validateFileContent(file: File, extension: string): Promise<boolean> {
  const ext = extension.toLowerCase();
  const signatures = FILE_SIGNATURES[ext];
  
  if (!signatures) return false;

  try {
    // Read first 16 bytes for magic number check
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    return signatures.some(sig => {
      if (bytes.length < sig.offset + sig.magic.length) return false;
      return sig.magic.every((byte, i) => bytes[sig.offset + i] === byte);
    });
  } catch {
    return false;
  }
}

/**
 * Check if the file extension is in the allowlist.
 */
export function isAllowedExtension(extension: string): boolean {
  return ALLOWED_EXTENSIONS.has(extension.toLowerCase());
}

/**
 * Sanitize a filename to prevent path traversal and special character attacks.
 * Returns a safe filename with only alphanumeric, hyphens, underscores, and dots.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and traversal sequences
  let safe = filename
    .replace(/\.\./g, '')           // Remove path traversal
    .replace(/[\/\\]/g, '')         // Remove path separators
    .replace(/[^\w\-. ]/g, '_')    // Replace special chars with underscore
    .replace(/\s+/g, '_')          // Replace spaces with underscore
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .trim();

  // Ensure filename doesn't start with a dot (hidden file)
  if (safe.startsWith('.')) safe = safe.substring(1);

  // Limit filename length
  if (safe.length > 100) safe = safe.substring(0, 100);

  return safe || 'unnamed';
}

/**
 * Get file size limit in bytes.
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

/**
 * Validate everything about a file upload.
 * Returns an error string if invalid, or null if valid.
 */
export async function validateUploadedFile(file: File): Promise<string | null> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
  }

  if (file.size === 0) {
    return 'File kosong.';
  }

  // Extract and validate extension
  const lastDot = file.name.lastIndexOf('.');
  if (lastDot === -1) {
    return 'File harus memiliki extension (.pdf, .png, .jpg, .jpeg, .webp).';
  }

  const extension = file.name.substring(lastDot).toLowerCase();
  if (!isAllowedExtension(extension)) {
    return `Tipe file "${extension}" tidak diizinkan. Hanya: ${[...ALLOWED_EXTENSIONS].join(', ')}`;
  }

  // Validate magic bytes (content matches claimed extension)
  const contentValid = await validateFileContent(file, extension);
  if (!contentValid) {
    return `Konten file tidak sesuai dengan tipe "${extension}". File mungkin corrupt atau di-rename.`;
  }

  return null; // Valid
}
