# Audit FMSP Lintasarta — Kesesuaian terhadap BRD (Buku Putih/User Manual v2.1)

**Tanggal Audit:** 22 Juni 2026  
**Auditor:** Zed Coding Agent  
**Sumber BRD:** `public/docs/Buku_Putih_User_Manual_FMSP_Lintasarta.pdf`  
**Cakupan:** Backend API, database schema, autentikasi, RBAC, modul operasional Fase 1 & Fase 2, fitur pendukung, dan konfigurasi deployment.

---

## 1. Ringkasan Eksekutif

Aplikasi **FMSP Lintasarta** telah mengimplementasikan sebagian besar fitur yang dipersyaratkan dalam BRD. Secara umum, arsitektur teknologi sesuai (Next.js 16 App Router, Prisma, PostgreSQL, JWT, Google SSO, Tailwind CSS), dan fitur-fitur inti seperti manajemen aset, dokumen legalitas, preventive maintenance, work order, inventory, SMK3, HRD, keuangan/RAB, vendor contract, audit log, master data, AI copilot, push notification, serta laporan compliance telah tersedia baik di backend maupun frontend.

Namun, audit ini menemukan **beberapa temuan signifikan** yang perlu segera ditangani, terutama terkait **inkonsistensi model role antara BRD dan README**, **dua sistem RBAC yang saling tumpang tindih**, **kurangnya `.env.example`**, serta **beberapa fitur BRD yang belum sepenuhnya terimplementasi** (auto-reminder H-30 untuk vendor contract, notifikasi push yang belum terintegrasi ke cron/work order, dan approval workflow work order yang masih sederhana).

| Kategori | Jumlah |
|---|---|
| Temuan Kritis | 2 |
| Temuan Mayor | 5 |
| Temuan Minor | 6 |
| Total Temuan | 13 |

**Kesimpulan:** Aplikasi dapat berjalan secara fungsional, tetapi memerlukan perbaikan pada konsistensi RBAC/role, dokumentasi environment, dan penyempurnaan fitur reminder/approval sebelum siap untuk production.

---

## 2. Metodologi Audit

Audit dilakukan dengan cara:

1. **Ekstraksi teks BRD** dari `Buku_Putih_User_Manual_FMSP_Lintasarta.pdf` untuk mengidentifikasi persyaratan fungsional dan non-fungsional.
2. **Review source code** di `src/app/api/`, `src/lib/`, `src/components/`, `prisma/schema.prisma`, dan `prisma/seed.ts`.
3. **Static analysis** dengan menjalankan `npx tsc --noEmit` dan `npm run lint`.
4. **Verifikasi konfigurasi** di `next.config.ts`, `package.json`, dan `fly.toml`.
5. **Pembandingan langsung** antara implementasi kode dengan setiap poin BRD.

---

## 3. Matriks Kesesuaian per Modul BRD

### 3.1 Keamanan Sistem & Autentikasi

| BRD § | Persyaratan | Status | Keterangan |
|---|---|---|---|
| 2.1 | Login Email/Password + JWT | ✅ Sesuai | `src/app/api/auth/login/route.ts` menggunakan `bcryptjs` + JWT 8 jam. |
| 2.1 | Google SSO (domain `@lintasarta.co.id`) | ⚠️ Sebagian | `src/app/api/auth/sso/route.ts` memverifikasi Google ID token, tetapi **tidak memvalidasi domain email** secara eksplisit. |
| 2.2 | RBAC 6 tingkat | ⚠️ Inkonsisten | Schema & seed menggunakan 6 role, tetapi `README.md` menyebutkan 3 role. Dua sistem RBAC berbeda (`rbac.ts` vs `rbac-middleware.ts`) digunakan bersamaan. |
| 2.3 | Proteksi brute force & account lockout 15 menit setelah 5x gagal | ✅ Sesuai | `src/app/api/auth/login/route.ts` mengimplementasikan lockout. |
| 2.4 | Manajemen pengguna & reset password approval-based | ✅ Sesuai | `src/app/api/management/users/route.ts` mengelola user dan approval reset password. |
| 2.5 | Audit log dengan filter & CSV | ⚠️ Sebagian | Audit log tersedia (`src/app/api/audit-logs/route.ts`) dengan filter user/action dan pagination, tetapi **tidak ada endpoint export CSV**. |

### 3.2 Modul Operasional Fase 1

| BRD § | Persyaratan | Status | Keterangan |
|---|---|---|---|
| 3.1 | Dashboard storytelling (KPI, bar charts, compliance timeline, tabel urgensi) | ✅ Sesuai | `src/app/api/analytics/route.ts` dan `src/app/page.tsx` menyediakan KPI, trend, dan breakdown. |
| 3.2 | Manajemen aset fisik (CRUD, foto, QR code, mutasi lokasi, lifecycle) | ✅ Sesuai | `src/app/api/assets/route.ts`, `src/app/api/assets/qr/route.ts`, dan schema `Asset`/`AssetTransfer`. |
| 3.3 | Dokumen legalitas & auto-reminder H-30 | ✅ Sesuai | `src/app/api/legal-documents/route.ts` dan `src/lib/cron-scheduler.ts` mengirim reminder H-30, H-14, H-7, H-3, H-1, dan expired. |
| 3.4 | Alerts & notifikasi email real-time (SSE) | ✅ Sesuai | SSE di `src/app/api/notifications/stream/route.ts` dan ticket exchange. |
| 3.5 | Preventive Maintenance (PM) dengan reminder H-7 | ✅ Sesuai | `src/app/api/management/maintenance/route.ts` dan cron job mengirim reminder untuk PM overdue/upcoming. |
| 3.6 | Inventory & safety stock alert | ✅ Sesuai | `src/app/api/management/inventory/route.ts` dan `InventoryView` menyediakan safety stock. |
| 3.7 | SMK3 Safety & checklist K3 | ✅ Sesuai | `src/app/api/management/smk3/route.ts` dan `Smk3View`. |
| 3.8 | Vendor & Contract Management dengan auto-reminder H-30 | ❌ Tidak sesuai | Model `VendorContract` ada, tetapi **tidak ada cron job atau reminder** untuk kontrak vendor. |

### 3.3 Modul Advance (Fase 2)

| BRD § | Persyaratan | Status | Keterangan |
|---|---|---|---|
| 4.1 | HRD & Security Shift | ⚠️ Sebagian | Model `Employee` mencakup data karyawan dan security (gadaLevel, KTA). Namun, **tidak ada model/tabel jadwal shift satpam** yang terpisah. |
| 4.2 | Keuangan & RAB terintegrasi | ✅ Sesuai | `AccountingTransaction` terhubung ke `RabBudget`; pengurangan pagu real-time tersedia. |
| 4.3 | Work Order & Approval Workflow | ⚠️ Sebagian | Work order CRUD dan status tersedia, tetapi **approval workflow hanya berupa field `approvalStatus` tanpa alur terstruktur** dan notifikasi email prioritas tinggi untuk tiket Critical belum terintegrasi. |
| 4.4 | Analytics & visualisasi data | ✅ Sesuai | `src/app/api/analytics/route.ts` dan `AnalyticsView` menyediakan berbagai chart. |

### 3.4 Fitur Pendukung

| BRD § | Persyaratan | Status | Keterangan |
|---|---|---|---|
| 5.1 | AI Copilot (Ollama Integration) | ✅ Sesuai | `src/app/api/chat/route.ts` dan `HelpBot.tsx` mengintegrasikan Ollama dengan fallback keyword. |
| 5.2 | Panduan kontekstual (Help Guide) | ✅ Sesuai | `src/components/HelpGuide.tsx` menyediakan panduan kontekstual per halaman/form. |
| 5.3 | Push Notification & Web Push (VAPID) | ⚠️ Sebagian | Service worker, VAPID, dan subscription endpoint tersedia, tetapi **tidak ada pemicu push dari cron/work order/legal doc**. |
| 5.4 | Master Data & Pengaturan SMTP | ✅ Sesuai | `src/app/api/management/admin/route.ts` dan `src/app/api/management/app-settings/route.ts`. |
| 5.5 | Laporan Compliance PDF | ⚠️ Sebagian | `src/app/api/reports/compliance/route.ts` menghasilkan HTML siap cetak, bukan PDF binary. |
| 6 | Tema dark/light & responsif | ✅ Sesuai | Tema dan sidebar drawer tersedia di `page.tsx`. |

---

## 4. Temuan Kritis

### K1 — Dua Sistem RBAC yang Saling Bertentangan

**Lokasi:** `src/lib/rbac.ts` dan `src/lib/rbac-middleware.ts`  
**Dampak:** Risiko akses tidak konsisten; satu route bisa lolos di satu middleware tetapi ditolak di middleware lain.

**Detail:**
- `rbac.ts` mendefinisikan permission key granular (`asset_create`, `wo_approve`, `user_manage`, dll.) dan digunakan oleh `withRole()` di `auth-middleware.ts`.
- `rbac-middleware.ts` mendefinisikan matriks akses berbasis resource + HTTP method (`c`, `r`, `u`, `d`) dan digunakan oleh `withRBAC()`.
- Contoh: `/api/management/users` menggunakan `withRole('user_manage', ...)` (benar), tetapi banyak route lain seperti `/api/management/maintenance` menggunakan `withRBAC(..., 'management')` yang hanya memeriksa HTTP method, bukan permission spesifik.

**Rekomendasi:**
- Pilih satu pendekatan RBAC. Disarankan menggunakan `rbac.ts` (permission-based) karena lebih sesuai BRD §2.2.
- Hapus atau refactor `rbac-middleware.ts` agar menggunakan `hasPermission()` dari `rbac.ts`.
- Pastikan setiap route memiliki permission key yang sesuai dengan BRD.

### K2 — README Menyebutkan 3 Role, BRD Menyebutkan 6 Role

**Lokasi:** `README.md` baris 115-121 vs `src/lib/rbac.ts` dan `prisma/schema.prisma`  
**Dampak:** Dokumentasi menyesatkan; developer/operator bisa salah memahami hierarki akses.

**Detail:**
- BRD §2.2 menyebutkan 6 role: SuperAdmin, Manager FMS, Admin Pusat, Admin Regional, Admin Lokasi, User/Viewer.
- README menyebutkan hanya 3 role: admin, operator, viewer.
- Implementasi kode menggunakan 6 role.

**Rekomendasi:**
- Perbarui `README.md` agar mencerminkan 6 role sesuai BRD.
- Tambahkan matriks akses lengkap per role sesuai BRD §2.2.

---

## 5. Temuan Mayor

### M1 — Google SSO Tidak Memvalidasi Domain Email

**Lokasi:** `src/app/api/auth/sso/route.ts` baris 114-132  
**Dampak:** Akun Google di luar domain korporat (`@lintasarta.co.id`) dapat login jika email-nya terdaftar di sistem.

**Detail:**
- Endpoint memeriksa `email_verified` dan `aud`, tetapi tidak memeriksa apakah email berakhiran `@lintasarta.co.id`.
- BRD §2.1 secara eksplisit menyebutkan validasi domain email.

**Rekomendasi:**
- Tambahkan validasi domain, contoh:
  ```ts
  if (!googleUser.email.endsWith('@lintasarta.co.id')) {
    return NextResponse.json({ error: 'Hanya akun korporat @lintasarta.co.id yang diizinkan.' }, { status: 403 });
  }
  ```

### M2 — Tidak Ada Auto-Reminder untuk Vendor Contract

**Lokasi:** `src/lib/cron-scheduler.ts` dan `prisma/schema.prisma`  
**Dampak:** Kontrak vendor yang akan expired tidak terdeteksi otomatis, melanggar BRD §3.8.

**Detail:**
- Model `VendorContract` memiliki field `endDate` dan `status`, tetapi tidak ada cron job yang memeriksa kontrak H-30.
- Cron job hanya mencakup `LegalDocument` dan `MaintenanceSchedule`.

**Rekomendasi:**
- Tambahkan fungsi `runVendorContractJob()` di `cron-scheduler.ts`.
- Jadwalkan job harian untuk memeriksa `endDate` dan membuat notifikasi/email H-30.
- Perbarui `status` kontrak ke `expiring`/`expired` secara otomatis.

### M3 — Approval Workflow Work Order Belum Terstruktur

**Lokasi:** `src/app/api/management/workorder/route.ts`  
**Dampak:** Tiket Critical tidak memicu alert email prioritas tinggi; alur approval BRD §4.3 belum sepenuhnya terimplementasi.

**Detail:**
- Model `WorkOrder` memiliki field `approvalStatus`, tetapi tidak ada endpoint khusus untuk approve/reject dengan alasan.
- Tidak ada pemicu email otomatis untuk tiket Critical.
- Status hanya diupdate via PUT umum.

**Rekomendasi:**
- Buat endpoint `/api/management/workorder/[id]/approve` dan `/api/management/workorder/[id]/reject`.
- Kirim email prioritas tinggi ke Manager FMS/SuperAdmin saat tiket Critical dibuat.
- Pastikan tiket rejected kembali ke teknisi dengan alasan.

### M4 — Push Notification Tidak Terintegrasi ke Event Bisnis

**Lokasi:** `src/lib/push-service.ts`  
**Dampak:** Fitur push notification hanya tersedia sebagai library, tetapi tidak dipanggil oleh cron, work order, atau reminder.

**Detail:**
- `sendPushToUser`, `sendPushToRole`, dan `sendPushBroadcast` tersedia, tetapi tidak ada pemanggilan di cron-scheduler, work order, atau legal document.
- BRD §3.4 dan §5.3 menyebutkan push notification untuk alert dokumen expired, work order, dan maintenance.

**Rekomendasi:**
- Integrasikan `sendPushToRole()` ke cron job reminder, maintenance, dan work order Critical.
- Pastikan VAPID keys dikonfigurasi di environment.

### M5 — Tidak Ada Endpoint Export CSV untuk Audit Log

**Lokasi:** `src/app/api/audit-logs/route.ts`  
**Dampak:** Admin tidak dapat mengunduh audit log dalam format CSV untuk keperluan compliance (BRD §2.5).

**Rekomendasi:**
- Tambahkan endpoint `GET /api/audit-logs/export?format=csv` yang menghasilkan CSV dengan header `timestamp,user,action,resource,details,ip`.

---

## 6. Temuan Minor

### m1 — Tidak Ada `.env.example`

**Lokasi:** Root project  
**Dampak:** Developer baru kesulitan mengetahui environment variables yang diperlukan.

**Variabel yang diperlukan:**
- `DATABASE_URL`
- `JWT_SECRET` (min 32 karakter)
- `GOOGLE_CLIENT_ID`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET` (min 16 karakter)
- `NEXT_PUBLIC_APP_BASE_URL`
- `OLLAMA_HOST` / `OLLAMA_MODEL` (opsional, default ada di `chat/route.ts`)

**Rekomendasi:** Buat file `.env.example` dengan deskripsi setiap variabel.

### m2 — Laporan Compliance Berupa HTML, Bukan PDF Binary

**Lokasi:** `src/app/api/reports/compliance/route.ts`  
**Dampak:** BRD §5.5 menyebutkan "Laporan Compliance PDF", tetapi outputnya adalah HTML dengan `window.print()`.

**Rekomendasi:**
- Pertahankan HTML sebagai fallback, tetapi tambahkan opsi generate PDF binary menggunakan `@react-pdf/renderer` atau Puppeteer.
- Atau ubah dokumentasi BRD/User Manual agar konsisten dengan implementasi.

### m3 — Model Employee Mencakup Security, Tetapi Tidak Ada Tabel Shift Security

**Lokasi:** `prisma/schema.prisma`  
**Dampak:** BRD §4.1 menyebutkan penjadwalan piket satpam (Shift 1/2/3), tetapi tidak ada model untuk shift.

**Rekomendasi:**
- Tambahkan model `SecurityShift` dengan field: `employeeId`, `date`, `shift`, `post`, `createdAt`.
- Buat API dan UI untuk mengelola jadwal shift.

### m4 — `EmployeeCreateSchema` Mengizinkan `contractType: 'contract'`, Tetapi Model Hanya Menerima `permanent|pkwt|outsource`

**Lokasi:** `src/lib/validators.ts` baris 126 dan `prisma/schema.prisma` baris 206  
**Dampak:** Potensi mismatch data; schema Prisma tidak memiliki nilai `contract`.

**Rekomendasi:**
- Samakan enum: gunakan `pkwt` di validator, bukan `contract`.
- Atau tambahkan `contract` ke model Prisma jika memang diperlukan.

### m5 — `Smk3CreateSchema` Menggunakan Status `fail`, Tetapi Model Menggunakan `danger`

**Lokasi:** `src/lib/validators.ts` baris 154 dan `prisma/schema.prisma` baris 244  
**Dampak:** Validasi akan menolak input `danger` dan menerima `fail` yang tidak dikenali model.

**Rekomendasi:**
- Ubah validator menjadi `z.enum(['ok', 'warning', 'danger'])`.
- Perbarui frontend agar menggunakan label `danger`.

### m6 — Banyak Penggunaan `any` di Error Handling

**Lokasi:** Hampir semua API route (`src/app/api/**/route.ts`)  
**Dampak:** Mengurangi type safety dan menyulitkan debugging.

**Rekomendasi:**
- Definisikan tipe error yang jelas atau gunakan `unknown` dengan narrowing.
- Pertimbangkan membuat helper `handleApiError()` yang menerima `unknown`.

---

## 7. Rekomendasi Prioritas

| Prioritas | Tindakan | Estimasi Usaha |
|---|---|---|
| **P0 (Segera)** | Refactor/unifikasi RBAC; hapus `rbac-middleware.ts` atau buat agar menggunakan `rbac.ts` | 1-2 hari |
| **P0 (Segera)** | Tambahkan validasi domain Google SSO `@lintasarta.co.id` | 30 menit |
| **P1 (Minggu ini)** | Buat `.env.example` dan perbarui `README.md` agar mencerminkan 6 role | 1 jam |
| **P1 (Minggu ini)** | Tambahkan cron job reminder untuk vendor contract H-30 | 2-4 jam |
| **P1 (Minggu ini)** | Perbaiki approval workflow work order (approve/reject endpoint + email Critical) | 4-6 jam |
| **P2 (Bulan ini)** | Integrasikan push notification ke event bisnis | 4-6 jam |
| **P2 (Bulan ini)** | Tambahkan export CSV audit log | 2-3 jam |
| **P2 (Bulan ini)** | Perbaiki enum mismatch (`contractType`, `smk3 status`) | 1 jam |
| **P3 (Future)** | Generate laporan compliance PDF binary | 1-2 hari |
| **P3 (Future)** | Tambahkan model Security Shift | 1-2 hari |

---

## 8. Hasil Static Analysis

### TypeScript (`npx tsc --noEmit`)
- **Status:** Berhasil tanpa error.
- **Catatan:** Meskipun tidak ada error TypeScript, banyak penggunaan `any` yang terdeteksi oleh linter.

### ESLint (`npm run lint`)
- **Status:** Terdapat puluhan error/warning, sebagian besar terkait:
  - `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/no-unused-vars`
- **Rekomendasi:** Perbaiki error lint secara bertahap; prioritaskan file di `src/app/api/`.

---

## 9. Daftar Pemeriksaan Lingkungan & Konfigurasi

| Item | Status | Keterangan |
|---|---|---|
| `next.config.ts` security headers | ✅ | X-Frame-Options, CSP, HSTS, dll. tersedia. |
| `middleware.ts` rate limiting | ✅ | Token bucket per path prefix. |
| Cron secret via header | ✅ | `validateCronAuth()` menggunakan `x-cron-secret`. |
| JWT secret enforcement | ✅ | Aplikasi crash jika `JWT_SECRET` kurang dari 32 karakter. |
| Database seed | ✅ | `prisma/seed.ts` menyediakan data awal lengkap. |
| `.env.example` | ❌ | Tidak ditemukan. |
| Docker / Fly.io config | ✅ | `Dockerfile`, `docker-compose.yml`, `fly.toml` tersedia. |

---

## 10. Kesimpulan Akhir

FMSP Lintasarta adalah aplikasi yang **fungsional dan memiliki fondasi keamanan yang baik** (JWT, bcrypt, rate limiting, audit log, CSP, HSTS). Sebagian besar modul BRD telah diimplementasikan dengan cukup baik.

Namun, ada **dua isu kritis** yang harus diselesaikan sebelum aplikasi digunakan di production:

1. **Unifikasi RBAC** — Dua sistem RBAC yang berbeda dapat menyebabkan celah akses.
2. **Konsistensi dokumentasi role** — README harus mencerminkan 6 role BRD.

Selain itu, fitur **reminder vendor contract**, **approval workflow work order**, dan **integrasi push notification** perlu diselesaikan agar sepenuhnya sesuai dengan BRD.

**Rekomendasi umum:**
- Prioritaskan perbaikan RBAC dan validasi domain SSO.
- Buat `.env.example` dan perbarui dokumentasi.
- Selesaikan fitur-fitur "missing link" (vendor reminder, WO approval, push notification triggers).
- Perbaiki lint error dan kurangi penggunaan `any`.

---

*Audit ini disusun berdasarkan review source code dan BRD yang tersedia. Untuk validasi lebih lanjut, disarankan melakukan functional testing end-to-end dan penetration testing.*
