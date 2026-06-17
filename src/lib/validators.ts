import { z } from 'zod';

// ─── Auth ───
export const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(4, 'Password minimal 4 karakter'),
});

// ─── Asset ───
export const AssetCreateSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi').max(255).trim(),
  type: z.enum(['land', 'office', 'facility', 'vehicle'] as const, {
    message: 'Tipe aset harus: land, office, facility, atau vehicle',
  }),
  location: z.string().min(1, 'Lokasi wajib diisi').max(500).trim(),
  specs: z.any().optional().default({}),
  bookValue: z.coerce.number().min(0, 'Nilai buku tidak boleh negatif').optional().default(0),
  status: z.enum(['good', 'warning', 'broken']).optional().default('good'),
  // Lifecycle fields (merged from AssetLifecycleRecord)
  purchaseDate: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  expectedLifeYrs: z.coerce.number().int().min(1).optional(),
  lifecycleStatus: z.enum(['operational', 'depreciated', 'retired']).optional().default('operational'),
});

export const AssetUpdateSchema = z.object({
  id: z.string().min(1, 'Asset ID wajib diisi'),
  name: z.string().min(1).max(255).trim().optional(),
  type: z.enum(['land', 'office', 'facility', 'vehicle']).optional(),
  location: z.string().min(1).max(500).trim().optional(),
  specs: z.any().optional(),
  bookValue: z.coerce.number().min(0).optional(),
  status: z.enum(['good', 'warning', 'broken']).optional(),
  updatedBy: z.string().optional(),
  // Lifecycle fields
  purchaseDate: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  expectedLifeYrs: z.coerce.number().int().min(1).optional(),
  lifecycleStatus: z.enum(['operational', 'depreciated', 'retired']).optional(),
});

export const AssetDeleteSchema = z.object({
  id: z.string().min(1, 'Asset ID wajib diisi'),
});

// ─── Legal Document ───
export const LegalDocCreateSchema = z.object({
  assetId: z.string().min(1, 'Asset ID wajib diisi'),
  title: z.string().min(1, 'Judul dokumen wajib diisi').max(500).trim(),
  documentType: z.enum(['pbg_imb', 'slf', 'certificate', 'insurance', 'tax_building', 'tax_vehicle', 'fire_protection', 'elevator_sio', 'drainage'] as const, {
    message: 'Tipe dokumen tidak valid',
  }),
  documentUrl: z.string().optional().default('/uploads/docs/default.pdf'),
  issueDate: z.string().min(1, 'Tanggal terbit wajib diisi'),
  expiryDate: z.string().min(1, 'Tanggal kedaluwarsa wajib diisi'),
  // PUPR fields (merged from PuprDocument)
  regNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
}).refine((data) => {
  return new Date(data.issueDate) < new Date(data.expiryDate);
}, { message: 'Tanggal terbit harus sebelum tanggal kedaluwarsa', path: ['expiryDate'] });

export const LegalDocUpdateSchema = z.object({
  id: z.string().min(1, 'Document ID wajib diisi'),
  title: z.string().min(1).max(500).trim().optional(),
  documentType: z.enum(['pbg_imb', 'slf', 'certificate', 'insurance', 'tax_building', 'tax_vehicle', 'fire_protection', 'elevator_sio', 'drainage']).optional(),
  documentUrl: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  // PUPR fields
  regNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
});

export const DeleteByIdSchema = z.object({
  id: z.string().min(1, 'ID wajib diisi'),
});

// ─── Helper to sanitize string (basic XSS prevention) ───
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// ─── Generic validation helper ───
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
  }
  return { success: true, data: result.data };
}
