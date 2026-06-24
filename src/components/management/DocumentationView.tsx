'use client';

import React from 'react';
import { FileText, Download, BookOpen, Settings, Server, Info, ShieldAlert, FileOutput, Database, Shield, Layers, Users, Wrench, BarChart3, Bot } from 'lucide-react';

interface DocumentationViewProps {
  isDark?: boolean;
}

export default function DocumentationView({ isDark = false }: DocumentationViewProps) {
  const c_bg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200';
  const c_card = isDark ? 'bg-[#1B1F26]/60 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-900';
  const c_text_body = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const c_text_desc = isDark ? 'text-zinc-500' : 'text-zinc-400';
  const c_border = isDark ? 'border-zinc-800' : 'border-zinc-200';
  const c_section_bg = isDark ? 'bg-[#0B1222]/60' : 'bg-zinc-100/60';

  return (
    <div className={`p-6 rounded-xl border ${c_bg} shadow-xl transition-all duration-300 space-y-6`}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b ${c_border}`}>
        <div>
          <h2 className={`text-xl font-bold ${c_text_title} flex items-center gap-3`}>
            <BookOpen className="w-6 h-6 text-[#3370FF]" />
            Dokumentasi & Buku Manual FMSP
          </h2>
          <p className={`text-xs ${c_text_body} mt-1`}>
            Unduh berkas Buku Putih Panduan Pengguna dan Manual Pemeliharaan Teknis untuk PT Aplikanusa Lintasarta.
          </p>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-semibold bg-[#3370FF]/10 text-[#5B8EFF] border border-[#3370FF]/20`}>
          <Info className="w-3.5 h-3.5" />
          Akses Terbatas: Administrator Only
        </div>
      </div>

      {/* Warning Alert Banner */}
      <div className={`flex items-start gap-4 p-4 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">PEMBERITAHUAN KEAMANAN INFORMASI (INFOSEC):</p>
          <p>
            Dokumen manual yang disediakan di bawah ini memuat informasi detail operasional, struktur skema database, 
            konfigurasi server, dan sistem keamanan internal FMSP Lintasarta. Dilarang keras menyebarluaskan dokumen ini 
            kepada pihak ketiga di luar PT Aplikanusa Lintasarta tanpa persetujuan tertulis dari Divisi Keamanan Informasi.
          </p>
        </div>
      </div>

      {/* Grid Documentation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: User Manual */}
        <div className={`flex flex-col justify-between p-5 rounded-xl border ${c_card} transition-all duration-300 group`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#3370FF]/10 text-[#3370FF]">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-[#3370FF]/15 text-[#5B8EFF]`}>
                  PDF
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 ${c_text_body}`}>
                  DOCX
                </span>
              </div>
            </div>

            <div>
              <h3 className={`text-base font-bold ${c_text_title} group-hover:text-[#3370FF] transition-colors`}>
                Buku Putih & Panduan Pengguna (User Manual)
              </h3>
              <p className={`text-xs ${c_text_body} mt-2 leading-relaxed`}>
                Panduan lengkap operasional harian seluruh modul aplikasi FMSP Lintasarta. 
                Ditujukan bagi tim General Affairs, Manager FMS, Admin Pusat/Regional/Lokasi, Teknisi, dan Security.
              </p>
            </div>

            {/* Sections with icons */}
            <div className={`pt-3 border-t border-dashed ${c_border} space-y-3`}>
              <p className={`text-[10px] ${c_text_desc} font-bold tracking-wider uppercase`}>Cakupan Modul:</p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#3370FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Manajemen Aset & Perizinan</p>
                    <p className={`text-[10px] ${c_text_body}`}>Registrasi aset fisik, mutasi lokasi, QR Code, upload foto, dan Print Label</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#3370FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Dokumen Legalitas</p>
                    <p className={`text-[10px] ${c_text_body}`}>PBG/IMB, SLF, Sertifikat, Asuransi, PBB, PKB — Auto-reminder H-30</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Wrench className="w-3.5 h-3.5 text-[#3370FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Preventive Maintenance</p>
                    <p className={`text-[10px] ${c_text_body}`}>Jadwal PM berkala, penugasan teknisi, notifikasi H-7, tandai selesai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-[#3370FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>HRD, Security, Inventory & SMK3</p>
                    <p className={`text-[10px] ${c_text_body}`}>Karyawan, shift security (Gada/KTA), stok gudang, checklist K3</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#3370FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Keuangan, Work Order & Analytics</p>
                    <p className={`text-[10px] ${c_text_body}`}>Jurnal transaksi, RAB, tiket WO & approval, dashboard analytics & grafik</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bot className="w-3.5 h-3.5 text-[#3370FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>AI Copilot & Konfigurasi Admin</p>
                    <p className={`text-[10px] ${c_text_body}`}>Chatbot AI Ollama, master data, pengaturan SMTP, manajemen pengguna & role</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <a
              href="/docs/Buku_Putih_User_Manual_FMSP_Lintasarta.pdf"
              download="Buku_Putih_User_Manual_FMSP_Lintasarta.pdf"
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#3370FF] hover:bg-[#3370FF]/90 active:scale-[0.98] shadow-lg shadow-[#3370FF]/15 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh Buku Putih (.pdf)
            </a>
            <a
              href="/docs/Buku_Putih_User_Manual_FMSP_Lintasarta.docx"
              download="Buku_Putih_User_Manual_FMSP_Lintasarta.docx"
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold border ${isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'} active:scale-[0.98] transition-all cursor-pointer`}
            >
              <FileOutput className="w-4 h-4" />
              Unduh Versi Editable (.docx)
            </a>
          </div>
        </div>

        {/* Card 2: Maintenance Manual */}
        <div className={`flex flex-col justify-between p-5 rounded-xl border ${c_card} transition-all duration-300 group`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
                <Settings className="w-6 h-6" />
              </div>
              <div className="flex gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/15 text-violet-400`}>
                  PDF
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 ${c_text_body}`}>
                  DOCX
                </span>
              </div>
            </div>

            <div>
              <h3 className={`text-base font-bold ${c_text_title} group-hover:text-violet-500 transition-colors`}>
                Manual Pemeliharaan Sistem (Maintenance Manual)
              </h3>
              <p className={`text-xs ${c_text_body} mt-2 leading-relaxed`}>
                Dokumentasi teknis mendalam mengenai arsitektur sistem, infrastruktur deployment, 
                prosedur backup/restore database, dan panduan pemeliharaan server produksi.
              </p>
            </div>

            {/* Sections with icons */}
            <div className={`pt-3 border-t border-dashed ${c_border} space-y-3`}>
              <p className={`text-[10px] ${c_text_desc} font-bold tracking-wider uppercase`}>Cakupan Teknis:</p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Layers className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Arsitektur & Tech Stack</p>
                    <p className={`text-[10px] ${c_text_body}`}>Next.js 16 (App Router), React 19, Prisma ORM, PostgreSQL, Tailwind CSS</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Server className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Deployment & Infrastruktur</p>
                    <p className={`text-[10px] ${c_text_body}`}>Fly.io (Region Singapore), Docker, fly.toml, health check, auto-scaling</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Keamanan & Autentikasi</p>
                    <p className={`text-[10px] ${c_text_body}`}>Google SSO OAuth, JWT, RBAC 6-tier, rate limiting, XSS protection, CORS</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Database className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Database & Backup/Restore</p>
                    <p className={`text-[10px] ${c_text_body}`}>Skema 22 tabel, Prisma migrate, pg_dump/pg_restore, ERD relasi & foreign keys</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Settings className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Environment & Konfigurasi</p>
                    <p className={`text-[10px] ${c_text_body}`}>Variabel .env (JWT_SECRET, CRON_SECRET, SMTP, Google Client ID), Fly secrets</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Wrench className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold ${c_text_title}`}>Integrasi & Servis Pendukung</p>
                    <p className={`text-[10px] ${c_text_body}`}>SMTP Nodemailer, Web Push, Cron scheduler, Ollama AI, QR Code generator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <a
              href="/docs/Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.pdf"
              download="Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.pdf"
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-600/90 active:scale-[0.98] shadow-lg shadow-violet-600/15 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh Maintenance Manual (.pdf)
            </a>
            <a
              href="/docs/Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.docx"
              download="Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.docx"
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold border ${isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'} active:scale-[0.98] transition-all cursor-pointer`}
            >
              <FileOutput className="w-4 h-4" />
              Unduh Versi Editable (.docx)
            </a>
          </div>
        </div>
      </div>

      {/* Technical Footnote */}
      <div className={`p-4 rounded-xl border ${c_card} text-center space-y-1.5`}>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-500">
          <Server className="w-4 h-4 text-[#3370FF]" />
          Spesifikasi Dokumen Pendukung
        </div>
        <p className={`text-[11px] ${c_text_body} max-w-xl mx-auto`}>
          Kedua dokumen dikompilasi menggunakan standar format Lintasarta Blue & Corporate layout.
          Dilengkapi penomoran otomatis, daftar tabel relasi, diagram ERD, dan rincian parameter konfigurasi sistem.
        </p>
      </div>
    </div>
  );
}
