# Rencana Perbaikan FMSP Lintasarta

**Berdasarkan:** `AUDIT_REPORT.md` — Audit Kesesuaian terhadap BRD  
**Tujuan:** Menyelesaikan temuan kritis dan mayor, menyelaraskan aplikasi dengan BRD, serta meningkatkan kualitas kode dan dokumentasi.

---

## 1. Prinsip Perbaikan

1. **P0 dikerjakan pertama** — Isu keamanan dan konsistensi RBAC tidak boleh ditunda.
2. **Satu perubahan, satu fokus** — Hindari refactor besar-besaran yang dapat mengganggu stabilitas.
3. **Backward-compatible** — Perubahan role/permission tidak boleh membuat user aktif kehilangan akses.
4. **Test-driven validation** — Setiap perubahan besar diikuti verifikasi `tsc`, `lint`, dan functional test manual.
5. **Dokumentasi mengikuti kode** — Perbarui `README.md` dan buat `.env.example` bersamaan dengan perubahan konfigurasi.

---

## 2. Ringkasan Fase

| Fase | Prioritas | Fokus | Estimasi |
|---|---|---|---|
| **Fase 0: Persiapan & Stabilisasi** | P0 | Setup `.env.example`, perbaiki enum mismatch, siapkan test plan | 1 hari |
| **Fase 1: RBAC & Keamanan** | P0 | Unifikasi RBAC, validasi domain SSO, perbaiki README | 2-3 hari |
| **Fase 2: Reminder & Approval** | P1 | Vendor contract reminder, work order approval workflow, audit log CSV | 3-4 hari |
| **Fase 3: Notifikasi & Integrasi** | P2 | Push notification triggers, SSE integration test | 2-3 hari |
| **Fase 4: Polish & Future** | P3 | PDF compliance report, security shift model, lint cleanup | 5-7 hari |

**Total estimasi:** 13-18 hari kerja (dapat dikerjakan secara paralel oleh 2 developer).

---

## 3. Fase 0: Persiapan & Stabilisasi (1 hari)

### Tujuan
- Memberikan fondasi yang jelas bagi developer baru.
- Memperbaiki mismatch kecil sebelum masuk ke perubahan besar.

### Tugas

#### 0.1 — Buat `.env.example`
**File baru:** `.env.example`

Isi minimal:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fmsp_lintasarta?schema=public"

# JWT
JWT_SECRET="ganti_dengan_random_string_minimal_32_karakter"

# Google OAuth SSO
GOOGLE_CLIENT_ID=""

# SMTP
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""

# Cron
CRON_SECRET="ganti_dengan_random_string_minimal_16_karakter"

# App
NEXT_PUBLIC_APP_BASE_URL="http://localhost:4100"

# AI (opsional)
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="qwen2.5"
```

**Kriteria selesai:** File tersedia dan di-commit.

#### 0.2 — Perbaiki Enum Mismatch
**File yang diubah:**
- `src/lib/validators.ts`
- `prisma/schema.prisma` (jika diperlukan)

**Langkah:**
1. Di `EmployeeCreateSchema`, ubah `contractType` enum dari `['permanent', 'contract', 'outsource']` menjadi `['permanent', 'pkwt', 'outsource']` agar sesuai model Prisma.
2. Di `Smk3CreateSchema`, ubah status dari `['ok', 'warning', 'fail']` menjadi `['ok', 'warning', 'danger']` agar sesuai model Prisma.
3. Jalankan `npx prisma generate` untuk memastikan tidak ada error.

**Kriteria selesai:** `npx tsc --noEmit` lolos dan form create employee/SMK3 dapat digunakan tanpa error.

#### 0.3 — Buat Test Plan Sederhana
**File baru:** `docs/TEST_PLAN.md` (opsional) atau catatan di `RENCANA_PERBAIKAN.md`.

**Scenario wajib diuji setiap fase:**
1. Login email/password dan Google SSO.
2. CRUD aset, legal document, work order, maintenance, inventory, SMK3, vendor, employee.
3. RBAC: user/viewer hanya bisa read; admin regional hanya melihat data region-nya.
4. Cron reminder legal document & maintenance.
5. Export audit log CSV.
6. Push notification subscription dan penerimaan notifikasi.

---

## 4. Fase 1: RBAC & Keamanan (2-3 hari)

### Tujuan
- Menyatukan sistem RBAC agar konsisten dengan BRD.
- Menambahkan validasi domain Google SSO.
- Memperbarui dokumentasi role.

### Tugas

#### 1.1 — Unifikasi RBAC
**File yang diubah:**
- `src/lib/rbac-middleware.ts` (refactor total atau hapus)
- `src/lib/auth-middleware.ts`
- `src/lib/rbac.ts` (tambahkan permission key yang hilang)
- Semua `src/app/api/**/route.ts` yang menggunakan `withRBAC`

**Strategi:**
Gunakan pendekatan **permission-based** dari `rbac.ts`. Middleware `withRBAC` diubah agar menerima `PermissionKey` dan memanggil `hasPermission()`.

**Langkah detail:**
1. Di `src/lib/rbac.ts`:
   - Tambahkan permission key yang belum ada, misalnya:
     - `asset_update`, `asset_delete` (saat ini hanya `asset_create`, `asset_view`, `asset_delete`)
     - `legal_update`, `legal_delete`
     - `maintenance_create`, `maintenance_update`, `maintenance_delete`
     - `inventory_create`, `inventory_update`, `inventory_delete`
     - `smk3_create`, `smk3_update`, `smk3_delete`
     - `vendor_create`, `vendor_update`, `vendor_delete`
     - `accounting_create`, `accounting_update`, `accounting_delete`
     - `hrd_create`, `hrd_update`, `hrd_delete`
     - `notification_manage`
     - `report_view`
   - Pastikan matriks permission mencerminkan BRD §2.2.

2. Di `src/lib/rbac-middleware.ts`:
   - Refactor agar menerima parameter `permission: PermissionKey`.
   - Hapus `ACCESS_MATRIX` berbasis resource+HTTP method.
   - Gunakan `hasPermission(user.role, permission)`.
   - Contoh signature baru:
     ```ts
     export function withPermission(
       permission: PermissionKey,
       handler: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
     ) { ... }
     ```

3. Di setiap API route:
   - Ganti `withRBAC(handler, RESOURCE)` dengan `withPermission(permissionKey, handler)`.
   - Contoh mapping:
     - `assets` GET → `asset_view`
     - `assets` POST → `asset_create`
     - `assets` PUT → `asset_update`
     - `assets` DELETE → `asset_delete`
     - `legal-documents` GET → `legal_view`
     - `legal-documents` POST → `legal_create`
     - `management/maintenance` GET → `maintenance_view`
     - `management/maintenance` POST → `maintenance_manage`
     - `management/workorder` POST → `wo_create`
     - `management/users` GET/POST/PATCH/DELETE → `user_manage`
     - `audit-logs` GET → `audit_log_view`
     - `reports` GET → `compliance_report`
     - `analytics` GET → `analytics_view`
     - `app-settings` GET → `master_data` atau buat permission baru `app_settings_view`
     - `upload` POST → tetap `upload` (tambahkan permission `upload` di `rbac.ts`)

4. Pastikan `superadmin` tetap bypass semua pengecekan.

**Kriteria selesai:**
- Semua route menggunakan satu middleware RBAC.
- `npm run lint` dan `npx tsc --noEmit` lolos.
- Manual test: user dengan role `user` tidak bisa POST/PUT/DELETE; admin regional hanya melihat data region-nya.

#### 1.2 — Validasi Domain Google SSO
**File yang diubah:** `src/app/api/auth/sso/route.ts`

**Langkah:**
Setelah verifikasi Google token berhasil, tambahkan pengecekan domain:
```ts
const ALLOWED_DOMAIN = '@lintasarta.co.id';
if (!googleUser.email.endsWith(ALLOWED_DOMAIN)) {
  await prisma.auditLog.create({
    data: {
      user: googleUser.email,
      action: 'SSO_LOGIN_FAILED',
      resource: 'Auth',
      details: `Google SSO: domain email ${googleUser.email} tidak diizinkan.`,
      ip: extractClientIp(req),
    },
  });
  return NextResponse.json(
    { success: false, error: 'Hanya akun korporat @lintasarta.co.id yang diizinkan.' },
    { status: 403 }
  );
}
```

**Kriteria selesai:**
- Akun Google di luar domain ditolak.
- Audit log tercatat.
- Test manual berhasil.

#### 1.3 — Perbarui Dokumentasi Role
**File yang diubah:** `README.md`

**Langkah:**
1. Ganti bagian "🔒 Role Akses" yang menyebutkan 3 role dengan tabel 6 role sesuai BRD §2.2.
2. Tambahkan ringkasan matriks akses per modul (bisa disederhanakan).
3. Perbarui login default agar mencerminkan 6 role (opsional, tapi disarankan).

**Kriteria selesai:** README mencerminkan 6 role BRD.

---

## 5. Fase 2: Reminder & Approval (3-4 hari)

### Tujuan
- Menambahkan reminder otomatis untuk vendor contract.
- Memperkuat approval workflow work order.
- Menambahkan export CSV audit log.

### Tugas

#### 2.1 — Vendor Contract Reminder Cron Job
**File yang diubah:**
- `src/lib/cron-scheduler.ts`
- `prisma/schema.prisma` (jika perlu index tambahan)
- `src/instrumentation.ts` (jika perlu)

**Langkah:**
1. Tambahkan fungsi `runVendorContractJob()` di `src/lib/cron-scheduler.ts`:
   - Query `vendorContract` dengan `endDate` dalam 30 hari ke depan atau sudah lewat.
   - Update status: `active` → `expiring` (jika H-30 sampai H+1), `expired` (jika sudah lewat).
   - Buat notifikasi email untuk admin/manager.
   - Hindari duplikat dengan pengecekan notifikasi 23 jam terakhir (sama seperti reminder legal doc).

2. Jadwalkan job di `startCronJobs()`:
   ```ts
   cron.schedule('0 9 * * *', () => {
     runVendorContractJob();
   }, { timezone: 'Asia/Jakarta' });
   ```

3. Tambahkan endpoint `/api/cron/vendor` (opsional, untuk trigger eksternal) dengan `validateCronAuth`.

**Kriteria selesai:**
- Cron job berjalan setiap hari pukul 09:00 WIB.
- Kontrak H-30 menghasilkan email notifikasi.
- Status kontrak otomatis berubah menjadi `expiring`/`expired`.

#### 2.2 — Work Order Approval Workflow
**File yang diubah:**
- `src/app/api/management/workorder/route.ts`
- `src/lib/email-service.ts` (jika perlu helper email baru)
- `src/components/management/WorkOrderView.tsx`

**Langkah:**
1. Tambahkan endpoint baru:
   - `POST /api/management/workorder/[id]/approve`
   - `POST /api/management/workorder/[id]/reject`

2. Endpoint approve:
   - Cek permission `wo_approve`.
   - Update `status` menjadi `closed`, `approvalStatus` menjadi `approved`, `approvedBy`, `approvedAt`.
   - Buat audit log.

3. Endpoint reject:
   - Cek permission `wo_approve`.
   - Update `status` menjadi `in_progress` (atau `resolved` tergantung kebijakan), `approvalStatus` menjadi `rejected`, `rejectedBy`, `rejectedAt`, `rejectedReason`.
   - Kirim notifikasi ke teknisi yang ditugaskan.
   - Buat audit log.

4. Saat work order **Critical** dibuat (`POST /api/management/workorder`):
   - Kirim email prioritas tinggi ke Manager FMS dan SuperAdmin.
   - Subjek: `[CRITICAL] Work Order Baru: {ticketNumber}`.

5. Update UI `WorkOrderView.tsx` agar menampilkan tombol Approve/Reject untuk user dengan permission `wo_approve`.

**Kriteria selesai:**
- Manager/SuperAdmin dapat approve/reject WO.
- WO Critical memicu email prioritas tinggi.
- WO rejected kembali ke teknisi dengan alasan.
- Audit log tercatat untuk setiap aksi.

#### 2.3 — Export CSV Audit Log
**File yang diubah:**
- `src/app/api/audit-logs/route.ts` atau buat file baru `src/app/api/audit-logs/export/route.ts`

**Langkah:**
1. Buat route `GET /api/audit-logs/export`.
2. Terima query parameter: `format=csv`, `user`, `action`, `from`, `to`.
3. Query `auditLog` sesuai filter.
4. Generate CSV dengan header: `timestamp,user,action,resource,details,ip`.
5. Set header `Content-Type: text/csv` dan `Content-Disposition: attachment; filename="audit-log-YYYY-MM-DD.csv"`.

**Kriteria selesai:**
- Endpoint dapat diunduh dari UI.
- CSV berisi data yang sesuai filter.

---

## 6. Fase 3: Notifikasi & Integrasi (2-3 hari)

### Tujuan
- Mengintegrasikan push notification ke event bisnis.
- Memastikan notifikasi real-time berjalan baik.

### Tugas

#### 3.1 — Integrasi Push Notification
**File yang diubah:**
- `src/lib/cron-scheduler.ts`
- `src/app/api/management/workorder/route.ts`
- `src/lib/push-service.ts` (jika perlu penambahan helper)

**Langkah:**
1. Di cron reminder legal document:
   - Setelah membuat notifikasi email, panggil `sendPushToRole('manager_fms', ...)` dan `sendPushToRole('superadmin', ...)`.

2. Di cron maintenance:
   - Saat ada jadwal overdue, kirim push ke role terkait.

3. Di work order Critical:
   - Setelah membuat WO, kirim push ke Manager FMS dan SuperAdmin.

4. Pastikan VAPID keys tersedia; jika tidak, push service harus graceful degradation (log warning, tidak crash).

**Kriteria selesai:**
- Push notification terkirim saat event reminder/maintenance/Critical WO terjadi.
- Service worker menampilkan notifikasi di browser.

#### 3.2 — Uji End-to-End SSE
**File yang diubah:** Tidak perlu perubahan besar, hanya testing.

**Langkah:**
1. Pastikan client mendapatkan ticket dari `/api/notifications/ticket`.
2. Buka koneksi SSE ke `/api/notifications/stream?ticket=...`.
3. Buat notifikasi pending untuk user tersebut.
4. Verifikasi notifikasi muncul di UI dalam 30 detik.

**Kriteria selesai:** SSE berfungsi normal.

---

## 7. Fase 4: Polish & Future (5-7 hari)

### Tugas

#### 4.1 — Generate Laporan Compliance PDF Binary
**File yang diubah:**
- `src/app/api/reports/compliance/route.ts`
- Tambahkan dependency `@react-pdf/renderer` (sudah ada di `package.json`)

**Langkah:**
1. Tambahkan opsi `format=pdf`.
2. Gunakan `@react-pdf/renderer` untuk generate PDF dari data report.
3. Return PDF binary dengan `Content-Type: application/pdf`.

**Alternatif:** Jika `@react-pdf/renderer` terlalu kompleks, gunakan Puppeteer (tambah dependency dan runtime cost lebih besar).

**Kriteria selesai:** Tombol "Download PDF" menghasilkan file PDF.

#### 4.2 — Tambahkan Model Security Shift
**File yang diubah:**
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/app/api/management/security-shift/route.ts` (baru)
- `src/components/management/SecurityView.tsx`

**Langkah:**
1. Tambahkan model:
   ```prisma
   model SecurityShift {
     id        String   @id @default(cuid())
     employeeId String
     employee   Employee @relation(fields: [employeeId], references: [id])
     date       DateTime
     shift      String   // shift_1 | shift_2 | shift_3
     post       String   // pos jaga
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt
   }
   ```
2. Tambahkan relasi di model `Employee`.
3. Buat API CRUD untuk security shift.
4. Update UI Security View agar bisa mengelola jadwal shift.

**Kriteria selesai:** Admin dapat membuat dan melihat jadwal shift satpam.

#### 4.3 — Cleanup Lint Error
**File yang diubah:** Semua `src/app/api/**/route.ts`

**Langkah:**
1. Ganti `error: any` dengan tipe yang lebih aman di handler error.
2. Hapus unused imports.
3. Jalankan `npm run lint` hingga bersih atau minimal tidak ada error kritis.

**Kriteria selesai:** `npm run lint` tidak ada error (warning diperbolehkan jika tidak kritis).

---

## 8. Jadwal & Alokasi Resource

### Jadwal Ideal (Satu Developer)

| Minggu | Fase | Durasi |
|---|---|---|
| Minggu 1 | Fase 0 + Fase 1 | 3-4 hari |
| Minggu 1-2 | Fase 2 | 3-4 hari |
| Minggu 2 | Fase 3 | 2-3 hari |
| Minggu 3 | Fase 4 | 5-7 hari |

### Jadwal Paralel (Dua Developer)

- **Developer A:** Fokus Fase 1 (RBAC + SSO) dan Fase 2 (Vendor reminder + WO approval).
- **Developer B:** Fokus Fase 0 (env + enum), Fase 3 (push notification), dan Fase 4 (PDF + security shift + lint).

---

## 9. Checklist Validasi Akhir

Setelah semua fase selesai, jalankan checklist berikut:

- [ ] `npx tsc --noEmit` lolos tanpa error.
- [ ] `npm run lint` lolos tanpa error kritis.
- [ ] `.env.example` tersedia dan lengkap.
- [ ] README.md mencerminkan 6 role BRD.
- [ ] User `user` hanya bisa read; tidak bisa create/update/delete.
- [ ] Admin regional hanya melihat data region-nya.
- [ ] Google SSO dengan domain selain `@lintasarta.co.id` ditolak.
- [ ] Reminder legal document H-30 terkirim.
- [ ] Reminder vendor contract H-30 terkirim.
- [ ] Work Order Critical memicu email prioritas tinggi.
- [ ] Manager dapat approve/reject WO.
- [ ] Audit log dapat di-export CSV.
- [ ] Push notification muncul saat reminder/maintenance/Critical WO.
- [ ] Laporan compliance dapat diunduh sebagai PDF.
- [ ] Security shift dapat dikelola.

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Refactor RBAC menyebabkan user kehilangan akses | Tinggi | Backup database sebelum deploy; uji per role; pertahankan fallback ke `superadmin` bypass. |
| Perubahan schema Prisma memerlukan migration | Sedang | Buat migration baru setelah perubahan model; jalankan `npx prisma migrate dev` di staging dulu. |
| Push notification memerlukan VAPID keys | Sedang | Dokumentasikan cara generate VAPID keys di `.env.example`; aplikasi tetap berjalan tanpa push jika keys tidak ada. |
| Vendor reminder cron membuat email berlebihan | Sedang | Implementasi deduplikasi 23 jam seperti reminder legal doc. |
| Approval WO mengubah alur bisnis | Sedang | Koordinasi dengan stakeholders; buat alur reject yang jelas. |

---

## 11. Langkah Langsung yang Bisa Dikerjakan Sekarang

Jika ingin memulai segera, berikut urutan kerja yang disarankan:

1. **Hari ini:** Buat `.env.example` dan perbaiki enum mismatch (`contractType`, `smk3 status`).
2. **Besok:** Refactor RBAC — ubah `rbac-middleware.ts` agar menggunakan permission-based RBAC dari `rbac.ts`.
3. **Hari ketiga:** Tambahkan validasi domain Google SSO.
4. **Hari keempat:** Perbarui `README.md`.
5. **Setelahnya:** Lanjutkan ke Fase 2 (vendor reminder, WO approval, audit log CSV).

---

*Rencana ini bersifat iteratif. Setiap fase sebaiknya di-review dan diuji sebelum melanjutkan ke fase berikutnya.*
