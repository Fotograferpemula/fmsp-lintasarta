# FMSP Lintasarta — Facility Management System Platform

> Sistem manajemen fasilitas terpadu berbasis web untuk PT Lintasarta, dibangun dengan Next.js 16, Prisma ORM, dan PostgreSQL.

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| UI | Tailwind CSS + lucide-react |
| Deploy | Fly.io |

## 🏗️ Fitur Utama (Phase 1)

- **Dashboard Storytelling** — KPI, horizontal bar charts, compliance timeline
- **Manajemen Aset** — CRUD aset fisik + mutasi lokasi + lifecycle tracking
- **Perizinan & Legal** — Dokumen legal dengan reminder otomatis
- **HRD & Security** — Data karyawan dan petugas keamanan
- **Inventory** — Stock barang operasional
- **SMK3 Safety** — Inspeksi keselamatan kerja
- **Keuangan** — Accounting & RAB
- **Preventive Maintenance** — Jadwal pemeliharaan
- **Vendor & Contract** — Manajemen kontrak vendor
- **Work Order** — Tiket pekerjaan
- **Audit Log** — Catatan aktivitas sistem (admin only)
- **Admin Master Data** — Kelola jenis fasilitas, tipe aset, lokasi, dll

## ⚙️ Setup Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm

### Install

```bash
# Clone repository
git clone <repo-url>
cd fmsp-lintasarta

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan DATABASE_URL yang sesuai

# Setup database
npx prisma db push
npx prisma db seed

# Jalankan development server
npm run dev
```

Buka [http://localhost:3847](http://localhost:3847)

**Login default (seed data):**
- `superadmin@lintasarta.co.id` / Password: `superadmin123`
- `manager@lintasarta.co.id` / Password: `manager123`
- `admin.pusat@lintasarta.co.id` / Password: `adminpusat123`
- `admin.regional@lintasarta.co.id` / Password: `adminregional123`
- `admin.lokasi@lintasarta.co.id` / Password: `adminlokasi123`
- `user@lintasarta.co.id` / Password: `user123`

> ⚠️ Ganti password default setelah login pertama (flag `mustChangePassword`).

## 🐳 Docker

```bash
# Build image
docker build -t fmsp-lintasarta .

# Jalankan dengan docker compose (include PostgreSQL)
docker compose up -d
```

## ☁️ Deploy ke Fly.io

```bash
# Login fly
flyctl auth login

# Buat PostgreSQL database
flyctl postgres create --name fmsp-db --region sin

# Attach database ke app
flyctl postgres attach fmsp-db

# Deploy
flyctl deploy
```

## 📁 Struktur Project

```
src/
├── app/
│   ├── api/           # API routes (REST)
│   │   ├── assets/
│   │   ├── legal-documents/
│   │   ├── management/
│   │   └── auth/
│   ├── page.tsx       # Main dashboard page
│   └── layout.tsx
├── components/
│   └── management/    # Modul-modul management
└── lib/
    ├── db.ts          # Prisma client singleton
    ├── auth-middleware.ts
    └── rbac-middleware.ts
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Data seeder
```

## 🔒 Role Akses (RBAC 6 Tingkat)

Sesuai BRD §2.2, sistem menerapkan RBAC 6 tingkat dengan filter data berbasis region:

| Role | Level | Akses | Scope Data |
|---|---|---|---|
| `superadmin` | 1 | Full CRUD semua modul + Approve WO + Audit Log + Master Data + App Settings | Nasional |
| `manager_fms` | 2 | Read All + Approve/Reject WO + Read + Approve RAB | Nasional |
| `admin_pusat` | 2 | Full CRUD modul operasional + Create/Assign WO + Read Only RAB | Nasional |
| `admin_regional` | 3 | CRUD modul operasional di region + Create/Assign WO + Read Only RAB | Region Tertentu |
| `admin_lokasi` | 3 | CRUD modul operasional di lokasi + Create WO | Lokasi Tertentu |
| `user` | 4 | Read Only + Update Status WO | Sesuai Tugas |

**Catatan:** `admin_regional` dan `admin_lokasi` hanya dapat melihat dan mengelola data aset yang berada di wilayah/gedung yang ditugaskan kepada mereka (region filter).

---

*Developed for PT Lintasarta — General Affairs Division*
