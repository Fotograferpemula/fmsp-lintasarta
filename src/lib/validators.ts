import { z } from "zod";

// ─── Sanitized String Zod Type (auto XSS prevention) ───
// Use safeString() instead of z.string() for user-facing text fields
function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/** A z.string() that automatically trims and HTML-escapes output */
export const safeString = (min = 1, max = 1000) =>
  z.string().min(min).max(max).transform(sanitize);

// ─── Password Complexity (Lintasarta IT Policy) ───
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
const PASSWORD_ERROR =
  "Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol (@$!%*?&#)";

export const PasswordCreateSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(PASSWORD_REGEX, PASSWORD_ERROR);

// ─── Auth ───
export const LoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// ─── Asset ───
export const AssetCreateSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi").max(255).trim(),
  type: z.enum(["land", "office", "facility", "vehicle"] as const, {
    message: "Tipe aset harus: land, office, facility, atau vehicle",
  }),
  location: z.string().min(1, "Lokasi wajib diisi").max(500).trim(),
  specs: z.any().optional().default({}),
  bookValue: z.coerce
    .number()
    .min(0, "Nilai buku tidak boleh negatif")
    .optional()
    .default(0),
  status: z.enum(["good", "warning", "broken"]).optional().default("good"),
  // Lifecycle fields (merged from AssetLifecycleRecord)
  purchaseDate: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  expectedLifeYrs: z.coerce.number().int().min(1).optional(),
  lifecycleStatus: z
    .enum(["operational", "depreciated", "retired"])
    .optional()
    .default("operational"),
  photos: z.array(z.string()).optional().default([]),
});

export const AssetUpdateSchema = z.object({
  id: z.string().min(1, "Asset ID wajib diisi"),
  name: z.string().min(1).max(255).trim().optional(),
  type: z.enum(["land", "office", "facility", "vehicle"]).optional(),
  location: z.string().min(1).max(500).trim().optional(),
  specs: z.any().optional(),
  bookValue: z.coerce.number().min(0).optional(),
  status: z.enum(["good", "warning", "broken"]).optional(),
  updatedBy: z.string().optional(),
  // Lifecycle fields
  purchaseDate: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  expectedLifeYrs: z.coerce.number().int().min(1).optional(),
  lifecycleStatus: z.enum(["operational", "depreciated", "retired"]).optional(),
  photos: z.array(z.string()).optional(),
});

export const AssetDeleteSchema = z.object({
  id: z.string().min(1, "Asset ID wajib diisi"),
});

// ─── Legal Document ───
export const LegalDocCreateSchema = z
  .object({
    assetId: z.string().min(1, "Asset ID wajib diisi"),
    title: z.string().min(1, "Judul dokumen wajib diisi").max(500).trim(),
    documentType: z.enum(
      [
        "pbg_imb",
        "slf",
        "certificate",
        "insurance",
        "tax_building",
        "tax_vehicle",
        "fire_protection",
        "elevator_sio",
        "drainage",
      ] as const,
      {
        message: "Tipe dokumen tidak valid",
      },
    ),
    documentUrl: z.string().optional().default("/uploads/docs/default.pdf"),
    issueDate: z.string().min(1, "Tanggal terbit wajib diisi"),
    expiryDate: z.string().min(1, "Tanggal kedaluwarsa wajib diisi"),
    // PUPR fields (merged from PuprDocument)
    regNumber: z.string().optional(),
    issuingAuthority: z.string().optional(),
  })
  .refine(
    (data) => {
      return new Date(data.issueDate) < new Date(data.expiryDate);
    },
    {
      message: "Tanggal terbit harus sebelum tanggal kedaluwarsa",
      path: ["expiryDate"],
    },
  );

export const LegalDocUpdateSchema = z.object({
  id: z.string().min(1, "Document ID wajib diisi"),
  title: z.string().min(1).max(500).trim().optional(),
  documentType: z
    .enum([
      "pbg_imb",
      "slf",
      "certificate",
      "insurance",
      "tax_building",
      "tax_vehicle",
      "fire_protection",
      "elevator_sio",
      "drainage",
    ])
    .optional(),
  documentUrl: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  // PUPR fields
  regNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
});

export const DeleteByIdSchema = z.object({
  id: z.string().min(1, "ID wajib diisi"),
});

// ─── Work Order ───
export const WorkOrderCreateSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(255).trim(),
  description: z.string().min(1, "Deskripsi wajib diisi").trim(),
  priority: z.enum(["critical", "high", "medium", "low"], {
    message: "Priority harus: critical, high, medium, atau low",
  }),
  category: z.string().min(1, "Kategori wajib diisi").trim(),
  assetId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  slaDeadline: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
});

// ─── Employee / HRD ───
export const EmployeeCreateSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi").trim(),
  name: z.string().min(1, "Nama wajib diisi").max(255).trim(),
  role: z.string().min(1, "Role/jabatan wajib diisi").trim(),
  department: z.string().min(1, "Departemen wajib diisi").trim(),
  phone: z.string().min(1, "Telepon wajib diisi").trim(),
  email: z.string().email("Format email tidak valid"),
  joinDate: z.string().min(1, "Tanggal bergabung wajib diisi"),
  contractType: z.enum(["permanent", "pkwt", "outsource"], {
    message: "Tipe kontrak harus: permanent, pkwt, atau outsource",
  }),
  status: z
    .enum(["active", "inactive", "terminated"])
    .optional()
    .default("active"),
  baseSalary: z.coerce.number().min(0, "Gaji tidak boleh negatif"),
  skills: z.array(z.string()).optional().default([]),
  gadaLevel: z.string().optional().nullable(),
  ktaNumber: z.string().optional().nullable(),
  ktaExpiry: z.string().optional().nullable(),
});

// ─── Inventory ───
export const InventoryCreateSchema = z.object({
  sku: z.string().min(1, "SKU wajib diisi").trim(),
  name: z.string().min(1, "Nama item wajib diisi").max(255).trim(),
  category: z.string().min(1, "Kategori wajib diisi").trim(),
  qty: z.coerce.number().int().min(0, "Qty tidak boleh negatif"),
  minQty: z.coerce.number().int().min(0, "MinQty tidak boleh negatif"),
  maxQty: z.coerce.number().int().min(1, "MaxQty minimal 1"),
  unit: z.string().min(1, "Satuan wajib diisi").trim(),
  location: z.string().min(1, "Lokasi gudang wajib diisi").trim(),
  unitPrice: z.coerce.number().min(0, "Harga satuan tidak boleh negatif"),
  lastRestocked: z.string().optional(),
});

// ─── SMK3 ───
export const Smk3CreateSchema = z.object({
  item: z.string().min(1, "Item K3 wajib diisi").max(500).trim(),
  location: z.string().min(1, "Lokasi wajib diisi").trim(),
  lastChecked: z.string().min(1, "Tanggal terakhir cek wajib diisi"),
  status: z.enum(["ok", "warning", "danger"]).optional().default("ok"),
  checkedBy: z.string().min(1, "Pemeriksa wajib diisi").trim(),
});

// ─── Accounting Transaction ───
export const TransactionCreateSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi").max(500).trim(),
  type: z.enum(["income", "expense"], {
    message: "Tipe harus: income atau expense",
  }),
  amount: z.coerce.number().min(0, "Jumlah tidak boleh negatif"),
  category: z.string().min(1, "Kategori wajib diisi").trim(),
  rabBudgetId: z.string().optional().nullable(),
});

// ─── RAB Budget ───
export const RabCreateSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  department: z.string().min(1, "Departemen wajib diisi").trim(),
  category: z.string().min(1, "Kategori wajib diisi").trim(),
  allocatedAmount: z.coerce
    .number()
    .min(0, "Alokasi anggaran tidak boleh negatif"),
  spentAmount: z.coerce.number().min(0).optional().default(0),
});

// ─── Vendor Contract ───
export const VendorContractCreateSchema = z.object({
  vendorName: z.string().min(1, "Nama vendor wajib diisi").max(255).trim(),
  contractTitle: z.string().min(1, "Judul kontrak wajib diisi").max(500).trim(),
  contractType: z.string().min(1, "Tipe kontrak wajib diisi").trim(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal berakhir wajib diisi"),
  value: z.coerce.number().min(0, "Nilai kontrak tidak boleh negatif"),
  pic: z.string().min(1, "PIC wajib diisi").trim(),
  documentUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ─── Maintenance Schedule ───
export const MaintenanceCreateSchema = z.object({
  assetId: z.string().min(1, "Asset ID wajib diisi"),
  title: z.string().min(1, "Judul jadwal wajib diisi").max(500).trim(),
  intervalDays: z.coerce.number().int().min(1, "Interval minimal 1 hari"),
  lastPerformed: z.string().min(1, "Tanggal terakhir perawatan wajib diisi"),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ─── Helper to sanitize string (basic XSS prevention) ───
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// ─── Generic validation helper ───
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: `${firstError.path.join(".")}: ${firstError.message}`,
    };
  }
  return { success: true, data: result.data };
}
