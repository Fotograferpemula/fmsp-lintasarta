'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Lightbulb, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';

export interface HelpStep {
  icon: string;
  title: string;
  desc: string;
}

export interface HelpContent {
  title: string;
  intro: string;
  steps: HelpStep[];
  tips?: string[];
}

// ─── Panduan Komprehensif untuk Halaman Utama & Sub-Menu Input ───
// Diperbarui: mencakup struktur 4 regional (Jakarta Pusat, Medan, Bandung, Surabaya)
export const HELP_DATA: Record<string, HelpContent> = {
  overview: {
    title: 'Dashboard — Ringkasan Portofolio Aset',
    intro: 'Pusat komando FMSP: pantau seluruh portofolio aset, status kepatuhan dokumen legal, jadwal perawatan, dan alert operasional dalam satu tampilan real-time. Data yang ditampilkan otomatis disesuaikan dengan regional login Anda (Medan/Bandung/Surabaya), sedangkan Admin Pusat dan Manager FMS melihat data seluruh Indonesia.',
    steps: [
      { icon: '📊', title: 'Kartu KPI (Key Performance Indicator)', desc: 'Empat kartu utama di bagian atas: Total Aset Aktif, Dokumen Valid/Warning/Expired, Work Order Open, dan Jadwal PM Overdue. Angka berwarna merah menandakan butuh tindakan segera.' },
      { icon: '📋', title: 'Tabel Status Dokumen Legal', desc: 'Indikator warna otomatis: 🟢 Hijau = valid (berlaku > 30 hari), 🟡 Kuning = segera expired (≤ 30 hari), 🔴 Merah = sudah expired. Klik baris untuk membuka detail.' },
      { icon: '📈', title: 'Grafik Distribusi Aset', desc: 'Chart interaktif menampilkan breakdown aset per tipe (Gedung, Kendaraan, Fasilitas) dan per lokasi regional. Hover untuk melihat detail nilai investasi.' },
      { icon: '🔔', title: 'Notifikasi & Alert Terbaru', desc: 'Feed notifikasi real-time: pengingat dokumen expired, jadwal PM overdue, dan work order critical. Notifikasi juga dikirim via email ke PIC terkait.' },
      { icon: '🌍', title: 'Filter Regional Otomatis', desc: 'Admin Regional Medan hanya melihat aset & dokumen Medan. Admin Bandung melihat Bandung + Jatiluhur. SuperAdmin dan Manager FMS melihat data seluruh Indonesia.' },
    ],
    tips: [
      'Dashboard otomatis refresh setiap kali halaman dibuka — tidak perlu menekan tombol refresh.',
      'Klik angka pada kartu KPI untuk langsung menuju halaman terkait (misal: klik "3 Expired" untuk ke daftar dokumen expired).',
      'Jika Anda login sebagai Admin Regional, data yang muncul hanya milik regional Anda — ini bukan bug, melainkan fitur keamanan data.',
    ],
  },

  assets: {
    title: 'Manajemen Aset & Perizinan',
    intro: 'Kelola seluruh aset fisik perusahaan — dari gedung kantor, fasilitas MEP, kendaraan operasional, hingga dokumen legalitas dan perizinan yang terkait. Setiap aset dilacak secara lifecycle dari pengadaan hingga pensiun, lengkap dengan QR Code unik untuk pelacakan lapangan.',
    steps: [
      { icon: '📦', title: 'Daftar Aset Fisik (Tab Utama)', desc: 'Tabel berisi semua aset terdaftar dengan kolom: Nama, Tipe, Lokasi, Kondisi, dan Nilai Buku. Gunakan search bar dan filter tipe untuk menemukan aset dengan cepat. Klik header kolom untuk mengurutkan.' },
      { icon: '➕', title: 'Tambah Aset Baru', desc: 'Klik tombol biru "Tambah Aset Fisik Baru" di pojok kanan atas. Isi form lengkap termasuk foto, spesifikasi teknis, dan nilai perolehan. Lokasi HARUS mengandung nama regional (contoh: "Kantor Medan" atau "Jatiluhur — Regional Bandung").' },
      { icon: '📄', title: 'Dokumen Legal (Tab Kedua)', desc: 'Tab "Dokumen Legal" menampilkan semua sertifikat dan perizinan: IMB/PBG, SLF, Asuransi, Pajak Kendaraan, Proteksi Kebakaran, dan AMDAL. Status ditandai warna otomatis berdasarkan tanggal expired.' },
      { icon: '👁️', title: 'Detail Aset (Klik Baris)', desc: 'Klik satu baris aset untuk membuka panel detail: spesifikasi teknis (JSON), foto galeri, QR Code, riwayat mutasi lokasi, dan dokumen legal terkait.' },
      { icon: '🔄', title: 'Mutasi Lokasi', desc: 'Pindahkan aset antar gedung/regional secara resmi. Riwayat mutasi tersimpan permanen untuk audit trail dan pelacakan historis.' },
      { icon: '🔍', title: 'QR Code & Label', desc: 'Setiap aset otomatis memiliki QR Code unik. Download PNG atau cetak label untuk ditempel pada fisik aset di lapangan. Scan dengan kamera HP untuk akses detail instan.' },
    ],
    tips: [
      'Pastikan kolom "Lokasi" selalu mengandung nama kota regional (Medan, Bandung, Surabaya, Jakarta) agar filter regional bekerja dengan benar.',
      'Aset dengan kondisi "Warning" atau "Rusak" otomatis muncul di notifikasi untuk ditindaklanjuti.',
      'Upload foto saat mendaftarkan aset — ini sangat membantu untuk verifikasi kondisi lapangan di kemudian hari.',
    ],
  },

  assets_add_asset: {
    title: 'Form Tambah Aset Fisik Baru',
    intro: 'Daftarkan aset fisik baru ke sistem FMSP untuk pemantauan lifecycle, perizinan, dan jadwal perawatan. Pastikan semua field bertanda (*) terisi lengkap.',
    steps: [
      { icon: '📝', title: 'Nama Aset *', desc: 'Berikan nama yang spesifik dan deskriptif. ✅ Benar: "Genset Perkins 500 kVA Surabaya" atau "AC Precision Daikin VRV Server Room Medan". ❌ Salah: "Genset 1" atau "AC".' },
      { icon: '🏢', title: 'Tipe Aset *', desc: 'Pilih dari dropdown: Tanah, Gedung/Kantor, Fasilitas MEP (AC, Genset, UPS, Panel), atau Kendaraan Operasional. Tipe ini menentukan kategori pelaporan.' },
      { icon: '📍', title: 'Lokasi Fisik *', desc: 'Tulis lokasi penempatan yang MENGANDUNG nama regional. Contoh: "Jl. Gatot Subroto No. 212, Medan" atau "Data Center Room A, Jatiluhur — Regional Bandung". Ini penting untuk filter regional!' },
      { icon: '⚡', title: 'Kondisi Awal *', desc: 'Pilih: Baik (hijau) = berfungsi normal, Warning (kuning) = perlu monitoring, Rusak (merah) = butuh perbaikan segera.' },
      { icon: '💰', title: 'Nilai Buku (Rupiah)', desc: 'Masukkan harga perolehan dalam angka tanpa titik/koma. Contoh: ketik 750000000 untuk Rp 750.000.000. Sistem otomatis format ke Rupiah.' },
      { icon: '🔧', title: 'Spesifikasi Teknis', desc: 'Detail teknis: Brand/Merek, Kapasitas (kW/kVA), Model, Serial Number, Tahun Pembelian. Diisi format JSON otomatis.' },
      { icon: '📷', title: 'Foto Aset', desc: 'Seret file atau klik area upload untuk mengunggah foto kondisi aset. Format: PNG/JPG, maksimal 10MB per file. Disarankan foto dari 2-3 sudut.' },
      { icon: '📅', title: 'Data Lifecycle', desc: 'Tanggal Pembelian, Harga Perolehan, dan Estimasi Umur Ekonomis (tahun). Data ini digunakan untuk kalkulasi depresiasi aset.' },
    ],
    tips: [
      'Setelah disimpan, sistem otomatis generate QR Code unik — cetak dan tempel pada fisik aset.',
      'Lokasi yang tidak mengandung nama regional (Medan/Bandung/Surabaya/Jakarta) tidak akan terfilter oleh admin regional.',
      'Foto berkualitas baik sangat membantu saat klaim asuransi atau audit internal.',
    ],
  },

  assets_edit_asset: {
    title: 'Form Edit Aset Fisik',
    intro: 'Perbarui informasi aset yang sudah terdaftar — kondisi terkini, nilai buku setelah depresiasi, atau koreksi data administrasi. Setiap perubahan tercatat di Audit Log.',
    steps: [
      { icon: '✏️', title: 'Ubah Data', desc: 'Kolom yang bisa diubah: Nama, Tipe, Lokasi, Kondisi, Nilai Buku, dan Spesifikasi Teknis. Email pembuat dan ID aset tidak bisa diubah.' },
      { icon: '⚠️', title: 'Update Status Kondisi', desc: 'Selalu update status jika ada perubahan: Baik → Warning (saat ada gejala), Warning → Rusak (saat breakdown). Ini memicu notifikasi ke tim maintenance.' },
      { icon: '📍', title: 'Pindah Lokasi', desc: 'Untuk memindahkan aset ke lokasi lain secara resmi (dengan riwayat), gunakan tombol "Mutasi Lokasi" di detail aset — bukan edit lokasi di sini.' },
      { icon: '💾', title: 'Simpan Perubahan', desc: 'Klik "Simpan Perubahan" — data langsung update di database. Perubahan tercatat di Audit Log dengan timestamp dan user yang mengubah.' },
    ],
    tips: [
      'Perubahan kondisi dari "Baik" ke "Warning" otomatis memicu reminder ke email admin regional terkait.',
      'Jangan ubah lokasi di sini jika ingin ada riwayat mutasi — gunakan fitur Mutasi Lokasi.',
    ],
  },

  assets_transfer: {
    title: 'Form Mutasi Lokasi Aset',
    intro: 'Catat perpindahan fisik aset antar lokasi/gedung/regional secara resmi. Setiap mutasi tersimpan permanen sebagai audit trail dan bisa dilacak kapan saja.',
    steps: [
      { icon: '🔒', title: 'Info Aset (Read-Only)', desc: 'Nama aset dan lokasi asal ditampilkan otomatis dari database. Field ini tidak bisa diubah — hanya sebagai referensi.' },
      { icon: '📍', title: 'Lokasi Tujuan Baru *', desc: 'Masukkan lokasi baru yang spesifik. Contoh: "Kantor Regional Medan Lt. 2, Ruang Server" atau "Gudang MEP, Kantor Surabaya". Pastikan mengandung nama regional!' },
      { icon: '📝', title: 'Catatan Mutasi', desc: 'Tuliskan alasan pemindahan dan penanggung jawab. Contoh: "Relokasi genset cadangan dari Bandung ke Surabaya atas permintaan Manager FMS, PJ: Eko Wahyudi."' },
    ],
    tips: [
      'Setiap mutasi tersimpan permanen di tab "Riwayat Mutasi" pada detail aset — tidak bisa dihapus.',
      'Mutasi antar regional (misal Bandung → Surabaya) akan mengubah visibilitas aset bagi admin regional yang berbeda.',
      'Selalu koordinasi dengan admin regional tujuan sebelum memutasi aset.',
    ],
  },

  assets_add_doc: {
    title: 'Form Tambah Dokumen Legalitas',
    intro: 'Daftarkan dokumen perizinan, sertifikat, atau polis asuransi untuk memastikan kepatuhan hukum aset. Sistem akan otomatis mengirim email pengingat sebelum dokumen kedaluwarsa.',
    steps: [
      { icon: '🏢', title: 'Aset Terkait *', desc: 'Pilih aset fisik yang berhubungan dengan dokumen ini dari dropdown. Contoh: pilih "Kantor Regional Medan" untuk mendaftarkan SLF Medan.' },
      { icon: '📄', title: 'Nama Dokumen *', desc: 'Berikan nama jelas dan spesifik. ✅ Benar: "Sertifikat Laik Fungsi (SLF) Kantor Medan 2026". ❌ Salah: "SLF" atau "Dokumen 1".' },
      { icon: '📂', title: 'Tipe Dokumen *', desc: 'Pilih kategori: PBG/IMB (izin bangunan), SLF (laik fungsi), Sertifikat Tanah, Asuransi, PBB (pajak bangunan), PKB/STNK (pajak kendaraan), Proteksi Kebakaran, SIO Lift, atau Izin Drainase.' },
      { icon: '🔗', title: 'URL Berkas Dokumen', desc: 'Masukkan link penyimpanan PDF dokumen untuk akses online. Bisa berupa link Google Drive, SharePoint, atau path server internal.' },
      { icon: '📅', title: 'Tanggal Terbit *', desc: 'Tanggal resmi dokumen diterbitkan oleh instansi terkait. Format: pilih dari date picker.' },
      { icon: '📅', title: 'Tanggal Expired *', desc: 'Tanggal masa berlaku berakhir. Sistem akan otomatis menghitung status: Valid (> 30 hari), Warning (≤ 30 hari), atau Expired.' },
      { icon: '🏛️', title: 'No. Registrasi & Penerbit', desc: 'Opsional: nomor registrasi resmi dan nama instansi penerbit (contoh: "Dinas PUPR Kota Medan", "Dinas Damkar Surabaya").' },
    ],
    tips: [
      'Dokumen otomatis terfilter berdasarkan lokasi aset terkait — admin Medan hanya melihat dokumen untuk aset berlokasi Medan.',
      'Sistem otomatis mengirim email pengingat H-30 dan H-7 sebelum dokumen kedaluwarsa.',
      'Tanggal terbit HARUS lebih awal dari tanggal expired — jika terbalik, form akan menolak.',
    ],
  },

  assets_renew_doc: {
    title: 'Form Perpanjang Dokumen Legalitas',
    intro: 'Perbarui masa berlaku dokumen legalitas setelah proses perpanjangan resmi selesai di instansi terkait. Status akan otomatis kembali ke "Valid" (hijau).',
    steps: [
      { icon: '📄', title: 'Info Dokumen (Read-Only)', desc: 'Nama dokumen, tipe, dan tanggal jatuh tempo saat ini ditampilkan sebagai referensi — tidak bisa diubah.' },
      { icon: '📅', title: 'Tanggal Expired Baru *', desc: 'Masukkan tanggal kedaluwarsa baru sesuai dokumen perpanjangan terbaru dari instansi penerbit.' },
      { icon: '✅', title: 'Proses Perpanjangan', desc: 'Klik "Proses Perpanjangan" — status dokumen otomatis berubah dari "Expired" (merah) atau "Warning" (kuning) kembali ke "Valid" (hijau).' },
    ],
    tips: [
      'Pastikan Anda sudah menerima dokumen fisik/digital resmi sebelum melakukan perpanjangan di sistem.',
      'Setelah perpanjangan, upload scan dokumen baru ke URL Berkas agar selalu tersedia untuk verifikasi.',
    ],
  },

  assets_qr: {
    title: 'Label & QR Code Aset',
    intro: 'Setiap aset terdaftar otomatis memiliki QR Code unik untuk identifikasi dan pelacakan fisik di lapangan. QR Code mengarah langsung ke halaman detail aset di FMSP.',
    steps: [
      { icon: '⬇️', title: 'Download QR Code (PNG)', desc: 'Unduh gambar QR Code beresolusi tinggi (300 DPI) ke komputer Anda. File PNG dapat langsung digunakan untuk cetak label.' },
      { icon: '🖨️', title: 'Cetak Label Aset', desc: 'Klik "Print Label" untuk mencetak label standar berisi: Logo Lintasarta, Nama Aset, Lokasi, ID Unik, dan QR Code. Ukuran label: 6 × 4 cm.' },
      { icon: '📍', title: 'Penempelan di Lapangan', desc: 'Tempel label pada fisik aset di tempat yang mudah terlihat dan terlindung dari cuaca. Untuk outdoor, gunakan laminating.' },
      { icon: '📱', title: 'Scan dengan HP', desc: 'Buka kamera HP → arahkan ke QR Code → otomatis menuju halaman detail aset di browser. Tidak perlu install aplikasi khusus.' },
    ],
    tips: [
      'Pindai QR Code dengan kamera HP untuk langsung membuka detail aset — bisa dipakai oleh tim inspeksi lapangan.',
      'QR Code bersifat unik dan permanen — jika aset dihapus, QR Code akan menampilkan pesan "Aset tidak ditemukan".',
      'Untuk aset outdoor (genset, kendaraan), gunakan label anti-air dengan laminating.',
    ],
  },

  notifications: {
    title: 'Kotak Alerts & Reminder',
    intro: 'Pusat notifikasi sistem: pengingat otomatis dokumen mendekati/melewati masa berlaku, jadwal PM overdue, work order critical, dan alert operasional. Notifikasi dikirim via email dan ditampilkan di dalam aplikasi.',
    steps: [
      { icon: '🔔', title: 'Feed Notifikasi', desc: 'Semua notifikasi ditampilkan kronologis dari yang terbaru. Setiap notifikasi berisi: judul, isi pesan, penerima, tanggal dijadwalkan, dan status pengiriman.' },
      { icon: '📧', title: 'Simulasi Cron (Manual Trigger)', desc: 'Klik "Simulasi Cron" untuk menjalankan evaluasi dokumen expired secara manual. Sistem akan memeriksa semua dokumen dan mengirim email pengingat ke PIC terkait.' },
      { icon: '✅', title: 'Status Pengiriman', desc: 'Setiap notifikasi menampilkan status: 🟡 Pending (belum dikirim), 🟢 Sent (berhasil terkirim), 🔴 Failed (gagal — cek konfigurasi SMTP di Admin).' },
      { icon: '🌍', title: 'Regional Targeting', desc: 'Notifikasi dikirim ke PIC regional yang sesuai: alert aset Medan → email admin Medan, alert aset Surabaya → email admin Surabaya, dan seterusnya.' },
    ],
    tips: [
      'Email pengingat dikirim otomatis H-30 dan H-7 sebelum tanggal expired dokumen — pastikan SMTP sudah dikonfigurasi di menu Admin.',
      'Jika status "Failed", periksa pengaturan SMTP di menu Admin → Pengaturan Sistem.',
      'Notifikasi work order "Critical" memiliki prioritas tinggi dan dikirim segera setelah tiket dibuat.',
    ],
  },

  hrd: {
    title: 'HRD & Security Service',
    intro: 'Kelola database karyawan fasilitas (teknisi MEP, operator, admin) dan staf security/penjaga keamanan. Termasuk data kontrak, gaji, sertifikasi keahlian, dan khusus security: tingkat Gada dan masa berlaku KTA POLRI.',
    steps: [
      { icon: '👥', title: 'Daftar Seluruh Karyawan', desc: 'Tabel master semua karyawan: NIP, Nama, Jabatan, Departemen, Tipe Kontrak (PKWTT/PKWT/Outsource), Status Aktif, dan Gaji Pokok. NIP menggunakan prefix regional: LA-BDG (Bandung), LA-MDN (Medan), LA-SBY (Surabaya).' },
      { icon: '🛡️', title: 'Data Khusus Security', desc: 'Untuk staf security: informasi Gada (Pratama/Madya/Utama), Nomor KTA POLRI, dan Masa Berlaku KTA. KTA expired ditandai merah.' },
      { icon: '➕', title: 'Tambah Karyawan', desc: 'Klik "Tambah Karyawan" untuk mendaftarkan personel baru. Form mencakup biodata, jabatan, kontrak, gaji, keahlian, dan sertifikasi security.' },
      { icon: '✏️', title: 'Edit & Nonaktifkan', desc: 'Edit data karyawan atau ubah status menjadi non-aktif (resign/mutasi) tanpa menghapus riwayat dari database.' },
      { icon: '🔍', title: 'Search & Filter', desc: 'Cari berdasarkan nama, NIP, departemen, atau keahlian. Filter berdasarkan status aktif/non-aktif.' },
    ],
    tips: [
      'NIP prefix regional memudahkan identifikasi asal penempatan: LA-BDG = Bandung, LA-MDN = Medan, LA-SBY = Surabaya.',
      'KTA POLRI yang akan expired dalam 30 hari otomatis ditandai kuning sebagai peringatan untuk perpanjangan.',
      'Karyawan yang di-nonaktifkan tetap tersimpan di database untuk keperluan audit dan riwayat HR.',
    ],
  },

  hrd_add: {
    title: 'Form Tambah Data Karyawan',
    intro: 'Daftarkan profil karyawan baru — teknisi, operator, admin, atau petugas security. Untuk security, field sertifikasi Gada dan KTA wajib diisi.',
    steps: [
      { icon: '🔢', title: 'NIP (Nomor Induk Pegawai) *', desc: 'Format standar: LA-[REGIONAL]-[NOMOR]. Contoh: LA-MDN-003 (karyawan ke-3 regional Medan), LA-SBY-001 (karyawan ke-1 Surabaya).' },
      { icon: '👤', title: 'Biodata Lengkap *', desc: 'Nama Lengkap, Nomor Telepon aktif (format: 08xx-xxxx-xxxx), dan Email Lintasarta (format: nama@lintasarta.co.id).' },
      { icon: '💼', title: 'Jabatan & Departemen *', desc: 'Jabatan: teknisi_mep, operator_bas, security, admin, dsb. Departemen: Engineering, Security, IT, General Affairs.' },
      { icon: '📄', title: 'Data Kontrak *', desc: 'Tanggal Bergabung, Tipe Kontrak: Permanent (PKWTT), PKWT (kontrak), atau Outsource. Status: Active, Inactive, atau Terminated.' },
      { icon: '💰', title: 'Gaji Pokok (IDR) *', desc: 'Masukkan nominal gaji bulanan tanpa titik. Contoh: 7200000 untuk Rp 7.200.000/bulan.' },
      { icon: '🛠️', title: 'Keahlian Teknis', desc: 'Daftar skill yang dikuasai, pisahkan dengan koma. Contoh: "HVAC, Electrical, Chiller Presisi" atau "CCTV Monitoring, Access Control, First Aid".' },
      { icon: '🛡️', title: 'Sertifikasi Security', desc: 'WAJIB untuk jabatan Security: Tingkat Gada (Pratama/Madya/Utama), Nomor KTA POLRI, dan Tanggal Expired KTA.' },
    ],
    tips: [
      'Email harus unik — tidak boleh sama dengan karyawan lain yang sudah terdaftar.',
      'Tingkat Gada dan KTA POLRI wajib diisi jika jabatan = "security" — jika kosong, form akan menolak.',
      'Prefix NIP regional (LA-BDG, LA-MDN, LA-SBY) membantu identifikasi penempatan karyawan.',
    ],
  },

  hrd_shift: {
    title: 'Form Jadwal Shift Security',
    intro: 'Buat jadwal shift kerja security agar setiap pos penjagaan selalu terisi. Jadwal bisa dibuat harian atau mingguan.',
    steps: [
      { icon: '👤', title: 'Pilih Petugas Security *', desc: 'Pilih nama dari dropdown — hanya menampilkan karyawan dengan jabatan "security" yang berstatus aktif.' },
      { icon: '📅', title: 'Tanggal & Jenis Shift *', desc: 'Tentukan tanggal penugasan dan jenis shift: Pagi (06:00-14:00), Siang (14:00-22:00), atau Malam (22:00-06:00).' },
      { icon: '📍', title: 'Pos Penugasan *', desc: 'Lokasi penempatan shift. Contoh: "Pos Gerbang Utama — Jatiluhur", "Lobby Kantor Medan", "Patroli Area Parkir — Surabaya".' },
    ],
    tips: [
      'Hindari menugaskan petugas yang sama untuk 2 shift berturut-turut (double shift) tanpa istirahat 8 jam.',
      'Petugas security outsource biasanya sudah memiliki jadwal rotasi dari vendor — koordinasikan terlebih dahulu.',
    ],
  },

  inventory: {
    title: 'Inventory & Sparepart Gudang',
    intro: 'Kelola stok material, suku cadang, dan barang gudang untuk mendukung operasional fasilitas. Setiap regional (Medan, Bandung, Surabaya) memiliki gudang dan inventaris terpisah. SKU menggunakan prefix regional untuk identifikasi asal gudang.',
    steps: [
      { icon: '📦', title: 'Daftar Stok Gudang', desc: 'Tabel semua item: SKU (prefix BDG/MDN/SBY), Nama, Kategori, Jumlah, Min/Max, Lokasi Gudang, dan Harga Satuan. Item di bawah minimum ditandai merah.' },
      { icon: '➕', title: 'Tambah Item Baru', desc: 'Klik "Tambah Item" untuk memasukkan barang baru. Pastikan SKU menggunakan prefix regional: BDG- (Bandung/Jatiluhur), MDN- (Medan), SBY- (Surabaya).' },
      { icon: '⚠️', title: 'Alert Stok Rendah', desc: 'Item dengan stok di bawah "Stok Minimum" otomatis ditandai badge merah "LOW STOCK". Ini menandakan perlu segera dilakukan restock/pengadaan.' },
      { icon: '✏️', title: 'Update Stok', desc: 'Edit jumlah stok setelah penerimaan barang (bertambah) atau pemakaian (berkurang). Setiap perubahan tercatat di audit log.' },
      { icon: '🌍', title: 'Filter Regional', desc: 'Admin Medan hanya melihat item di gudang Medan. Admin Bandung melihat gudang Bandung + Jatiluhur. Admin Pusat melihat semua gudang.' },
    ],
    tips: [
      'SKU prefix memudahkan identifikasi: BDG-FILT-AHU-01 = Filter AHU di gudang Bandung, MDN-APAR-CO2 = APAR di gudang Medan.',
      'Pastikan stok sparepart untuk Preventive Maintenance (PM) selalu di atas minimum — PM tertunda karena stok kosong sangat merugikan.',
      'Lokasi gudang harus mengandung nama regional agar filter otomatis bekerja dengan benar.',
    ],
  },

  inventory_add: {
    title: 'Form Tambah Barang/Sparepart ke Gudang',
    intro: 'Daftarkan suku cadang, material, atau barang habis pakai baru ke inventaris gudang regional.',
    steps: [
      { icon: '🔢', title: 'SKU (Kode Barang) *', desc: 'Format: [REGIONAL]-[KATEGORI]-[KODE]. Contoh: BDG-FILT-AHU-01 (Filter AHU di Bandung), MDN-APAR-CO2 (APAR CO2 di Medan), SBY-EL-KABEL-NYM (Kabel NYM di Surabaya).' },
      { icon: '📦', title: 'Nama Item & Kategori *', desc: 'Nama deskriptif (contoh: "Filter Udara AHU Data Center") dan kategori: spare_part, electrical, safety_ppe, consumable, atau cleaning.' },
      { icon: '🔢', title: 'Jumlah & Satuan *', desc: 'Stok awal dan satuan pengukuran: pcs (buah), roll (gulungan), kg (kilogram), liter, unit, atau box.' },
      { icon: '⚠️', title: 'Safety Stock (Min/Max) *', desc: 'Stok Minimum = batas alert restock otomatis. Stok Maksimum = kapasitas penyimpanan gudang. Stok di bawah minimum ditandai merah.' },
      { icon: '📍', title: 'Lokasi Gudang *', desc: 'Posisi penyimpanan yang MENGANDUNG nama regional. Contoh: "Gudang MEP Lt. 1, Jatiluhur — Bandung" atau "Gudang HSE, Kantor Medan".' },
      { icon: '💰', title: 'Harga Satuan (IDR) *', desc: 'Harga beli per satuan tanpa titik. Contoh: 185000 untuk Rp 185.000/pcs. Digunakan untuk kalkulasi nilai inventaris.' },
    ],
    tips: [
      'Stok di bawah minimum otomatis ditandai merah "LOW STOCK" pada tabel utama — restock segera!',
      'Gunakan prefix SKU regional (BDG, MDN, SBY) secara konsisten agar pencarian dan filter berfungsi optimal.',
      'Kategori "safety_ppe" = Personal Protective Equipment (helm, sarung tangan, rompi, dll.).',
    ],
  },

  smk3: {
    title: 'SMK3 Safety & Checklist K3',
    intro: 'Kelola keselamatan kerja dan audit K3 (Keselamatan dan Kesehatan Kerja). Catat inspeksi APAR, grounding, hydrant, smoke detector, dan instalasi keselamatan lainnya di semua lokasi regional.',
    steps: [
      { icon: '📋', title: 'Checklist Inspeksi K3', desc: 'Tabel semua item K3 yang perlu diinspeksi: APAR, Hydrant, Smoke Detector, Grounding, Jalur Evakuasi. Status: ✅ Sesuai (OK), ⚠️ Perlu Tindakan (Warning), 🔴 Temuan Bahaya (Danger).' },
      { icon: '➕', title: 'Tambah Item Baru', desc: 'Daftarkan objek atau area baru untuk audit K3. Contoh: "APAR CO2 6kg — Lobby Kantor Medan" atau "Hydrant Box — Tangga Darurat Surabaya".' },
      { icon: '⚠️', title: 'Temuan & Tindak Lanjut', desc: 'Item dengan status "Warning" atau "Danger" memerlukan tindakan korektif segera. Catat tanggal penyelesaian setelah diperbaiki.' },
      { icon: '📊', title: 'Statistik K3 Regional', desc: 'Pantau tingkat kepatuhan K3 per lokasi: berapa item OK vs Warning vs Danger. Target: 100% status OK.' },
    ],
    tips: [
      'Lakukan inspeksi K3 secara rutin sesuai jadwal: APAR bulanan, Hydrant triwulanan, Smoke Detector semesteran.',
      'Pastikan setiap regional memiliki petugas K3 yang bertanggung jawab melakukan inspeksi berkala.',
      'Item K3 dengan status "Danger" harus ditangani dalam maksimal 24 jam kerja.',
    ],
  },

  smk3_add: {
    title: 'Form Tambah Item Inspeksi K3',
    intro: 'Tambahkan objek atau area pemeriksaan baru untuk audit keselamatan K3 di lokasi regional manapun.',
    steps: [
      { icon: '📋', title: 'Item Inspeksi *', desc: 'Nama objek K3 yang jelas. Contoh: "APAR CO2 6kg", "Smoke Detector Panel Zone A", "Hydrant Box Tipe Indoor", "Instalasi Grounding Genset".' },
      { icon: '📍', title: 'Lokasi *', desc: 'Lokasi spesifik yang MENGANDUNG nama regional. Contoh: "Koridor Lt. 1, Jatiluhur — Bandung", "Lobby Kantor Medan", "Tangga Darurat Lt. 2, Kantor Surabaya".' },
      { icon: '📅', title: 'Tanggal Inspeksi Terakhir *', desc: 'Tanggal terakhir objek ini diperiksa oleh petugas K3. Pilih dari date picker.' },
      { icon: '🛡️', title: 'Status Kepatuhan *', desc: 'Pilih hasil inspeksi: OK (✅ aman, sesuai standar), Warning (⚠️ perlu perhatian), atau Danger (🔴 temuan bahaya, tindakan segera).' },
      { icon: '👤', title: 'Nama Pemeriksa *', desc: 'Nama lengkap petugas yang melakukan inspeksi terakhir. Contoh: "Rudi Hartono" atau "Hendra Wijaya".' },
    ],
    tips: [
      'Status "OK" berarti item memenuhi standar SNI dan peraturan K3 yang berlaku.',
      'Status "Danger" akan muncul di dashboard sebagai alert merah — tindak lanjuti segera!',
      'Pastikan lokasi mengandung nama regional agar terfilter ke admin yang tepat.',
    ],
  },

  accounting: {
    title: 'Keuangan — Accounting & RAB',
    intro: 'Modul pencatatan keuangan operasional fasilitas dan perencanaan anggaran biaya (RAB). Setiap regional memiliki RAB anggaran terpisah: Engineering Bandung, Security Medan, dsb. Transaksi dihubungkan ke RAB untuk tracking realisasi pagu.',
    steps: [
      { icon: '💰', title: 'Tab Jurnal Transaksi', desc: 'Catat pemasukan dan pengeluaran operasional harian: pembelian sparepart, pembayaran listrik/air, gaji outsource, pendapatan sewa, dll. Setiap transaksi terhubung ke RAB.' },
      { icon: '📊', title: 'Tab RAB (Rencana Anggaran Biaya)', desc: 'Kelola alokasi pagu anggaran per departemen per regional. Contoh: "Engineering — Bandung: Rp 1,8M", "Security — Medan: Rp 280 Juta". Sisa pagu otomatis berkurang saat transaksi diinput.' },
      { icon: '📈', title: 'Grafik Realisasi', desc: 'Visualisasi perbandingan pagu anggaran vs realisasi pengeluaran per departemen dan per regional.' },
      { icon: '🌍', title: 'Pemisahan Regional', desc: 'RAB terpisah per regional — anggaran Engineering Bandung tidak tercampur dengan anggaran Engineering Medan. Monitoring bisa per regional maupun nasional.' },
    ],
    tips: [
      'Input transaksi secara berkala (idealnya harian) untuk akurasi laporan keuangan.',
      'Selalu hubungkan transaksi pengeluaran ke RAB yang sesuai — ini otomatis mengurangi sisa pagu anggaran.',
      'RAB yang sudah terpakai > 80% ditandai kuning, > 100% ditandai merah sebagai peringatan overbudget.',
    ],
  },

  accounting_add: {
    title: 'Form Jurnal Transaksi Keuangan',
    intro: 'Catat pengeluaran atau pemasukan operasional untuk laporan akuntansi. Hubungkan dengan RAB regional untuk tracking realisasi anggaran secara otomatis.',
    steps: [
      { icon: '📅', title: 'Tanggal Transaksi *', desc: 'Pilih tanggal aktual terjadinya transaksi. Tidak harus hari ini — bisa backdate untuk transaksi yang terlambat diinput.' },
      { icon: '📝', title: 'Keterangan/Deskripsi *', desc: 'Deskripsi jelas dan singkat. ✅ Benar: "Pembayaran Tagihan Listrik PLN Jatiluhur Bulan Juni" atau "Servis AC Daikin VRV Kantor Medan". ❌ Salah: "Bayar listrik" atau "Servis".' },
      { icon: '💰', title: 'Tipe & Nominal *', desc: 'Pilih tipe: Pemasukan (income) atau Pengeluaran (expense). Nominal dalam Rupiah tanpa titik/koma — contoh: 145000000 untuk Rp 145 Juta.' },
      { icon: '📂', title: 'Kategori *', desc: 'Klasifikasi: maintenance (perawatan), utility (listrik/air), salary (gaji), procurement (pengadaan), atau lainnya.' },
      { icon: '📊', title: 'Hubungkan ke RAB', desc: 'Pilih mata anggaran RAB yang sesuai. Contoh: "Engineering — Bandung (Opex)" atau "Security — Medan (Operasional)". Sisa pagu otomatis berkurang setelah disimpan.' },
    ],
    tips: [
      'Menghubungkan transaksi dengan RAB otomatis mengurangi sisa pagu anggaran dan memperbarui grafik realisasi.',
      'Transaksi tanpa RAB tetap tercatat di jurnal, tapi tidak tertrack dalam monitoring anggaran.',
      'Untuk transaksi berulang (listrik, gaji), buat template di catatan untuk mempercepat input bulan berikutnya.',
    ],
  },

  rab: {
    title: 'Rencana Anggaran Biaya (RAB)',
    intro: 'Kelola alokasi pagu anggaran tahunan per departemen per regional. Setiap regional memiliki RAB terpisah — anggaran Bandung tidak tercampur dengan Medan atau Surabaya.',
    steps: [
      { icon: '📊', title: 'Daftar Alokasi Pagu', desc: 'Tabel: Tahun, Departemen + Regional (contoh: "Engineering — Bandung"), Kategori (Opex/Operasional), Pagu Alokasi, Realisasi Terpakai, dan Sisa Anggaran.' },
      { icon: '📉', title: 'Progress Bar Realisasi', desc: 'Bar visual menunjukkan persentase pagu yang sudah terpakai. 🟢 Hijau (< 80%), 🟡 Kuning (80-100%), 🔴 Merah (> 100% = overbudget).' },
      { icon: '➕', title: 'Tambah Anggaran Baru', desc: 'Klik "Tambah Anggaran Baru" untuk mengalokasikan pagu dana baru per departemen per regional per tahun.' },
    ],
    tips: [
      'Buat RAB terpisah per regional: "Engineering — Bandung", "Engineering — Medan", "Security — Surabaya".',
      'Pagu anggaran ditetapkan di awal tahun dan realisasi terakumulasi dari transaksi jurnal.',
      'Anggaran overbudget (merah) memerlukan approval khusus dari Manager FMS.',
    ],
  },

  rab_add: {
    title: 'Form Alokasi Anggaran (RAB) Baru',
    intro: 'Tentukan pagu anggaran untuk departemen dan regional tertentu. Pagu ini menjadi batas atas pengeluaran yang dimonitor secara real-time.',
    steps: [
      { icon: '📅', title: 'Tahun Anggaran *', desc: 'Tahun periode berlakunya anggaran. Contoh: 2026. Satu departemen bisa memiliki RAB di tahun yang berbeda.' },
      { icon: '💼', title: 'Departemen + Regional *', desc: 'Format: "Nama Departemen — Regional". Contoh: "Engineering — Bandung", "Security — Medan", "General Affairs — Surabaya".' },
      { icon: '📂', title: 'Kategori Anggaran *', desc: 'Jenis alokasi: Opex (operasional), Capex (investasi), Operasional (rutin), atau kategori custom lainnya.' },
      { icon: '💰', title: 'Pagu Anggaran (IDR) *', desc: 'Batas nominal dalam Rupiah tanpa titik. Contoh: 1800000000 untuk Rp 1,8 Miliar. Realisasi pengeluaran akan dikurangi dari angka ini.' },
    ],
    tips: [
      'Satu departemen bisa memiliki beberapa RAB untuk kategori berbeda (Opex + Capex).',
      'Pagu Rp 0 berarti departemen tersebut tidak memiliki alokasi untuk kategori tersebut — jangan input Rp 0.',
      'Konsultasikan pagu dengan Finance sebelum input — angka yang sudah disetujui tidak mudah diubah.',
    ],
  },

  maintenance: {
    title: 'Preventive Maintenance (PM) Schedule',
    intro: 'Kelola jadwal pemeliharaan preventif (PM) untuk seluruh aset di semua regional. PM terjadwal mencegah kerusakan fatal dan menjaga keandalan operasional. Jadwal otomatis terfilter per regional.',
    steps: [
      { icon: '📋', title: 'Daftar Jadwal PM', desc: 'Tabel semua PM: Judul, Aset Sasaran, Interval (hari), Tanggal Terakhir, Tanggal Berikutnya, PJ Teknisi, dan Status. Warna: 🟢 Scheduled, 🟡 Mendekati, 🔴 Overdue.' },
      { icon: '➕', title: 'Buat Jadwal PM Baru', desc: 'Klik "Tambah Jadwal" untuk membuat PM baru. Tentukan aset, interval pengulangan, dan teknisi penanggung jawab.' },
      { icon: '👁️', title: 'Detail PM & Aset', desc: 'Klik ikon mata untuk melihat spesifikasi teknis aset, riwayat PM sebelumnya, dan catatan pekerjaan.' },
      { icon: '✅', title: 'Tandai PM Selesai', desc: 'Setelah PM dilakukan di lapangan, tandai "Selesai" — sistem otomatis menghitung jadwal berikutnya berdasarkan interval.' },
      { icon: '🌍', title: 'Multi-Regional', desc: 'PM di aset Medan hanya terlihat oleh admin Medan. PM di aset Bandung/Jatiluhur terlihat oleh admin Bandung. Admin Pusat melihat semua.' },
    ],
    tips: [
      'PM overdue (merah) memunculkan notifikasi otomatis ke email PIC dan admin regional.',
      'Pastikan sparepart untuk PM tersedia di gudang regional sebelum jadwal PM tiba — cek menu Inventory.',
      'Interval PM umum: 30 hari (bulanan), 90 hari (triwulan), 180 hari (semester), 365 hari (tahunan).',
    ],
  },

  maintenance_add: {
    title: 'Form Tambah Jadwal PM Baru',
    intro: 'Buat rencana perawatan berkala (Preventive Maintenance) untuk aset tertentu. PM teratur mencegah breakdown dan memperpanjang umur ekonomis aset.',
    steps: [
      { icon: '🏢', title: 'Aset Sasaran *', desc: 'Pilih aset dari dropdown — menampilkan semua aset terdaftar. Contoh: "AC Precision Server Room Medan", "Genset Perkins 500 kVA Surabaya".' },
      { icon: '📝', title: 'Judul Pekerjaan PM *', desc: 'Nama aktivitas perawatan yang spesifik. ✅ Benar: "Servis Berkala AC Server Room Medan" atau "Inspeksi Genset CAT 1500 kVA Jatiluhur". ❌ Salah: "Servis AC".' },
      { icon: '🔄', title: 'Interval Pengulangan (Hari) *', desc: 'Berapa hari sekali PM diulang. 30 = bulanan, 60 = dua bulan, 90 = triwulan, 180 = semester, 365 = tahunan. Sistem otomatis hitung jadwal berikutnya.' },
      { icon: '📅', title: 'Tanggal PM Terakhir *', desc: 'Tanggal terakhir kali PM ini dilakukan. Jika baru pertama kali, isi tanggal hari ini. Sistem hitung: tanggal ini + interval = jadwal berikutnya.' },
      { icon: '👤', title: 'PJ Teknisi / Vendor', desc: 'NIP teknisi internal (contoh: LA-BDG-001, LA-MDN-001) atau nama vendor. Opsional tapi sangat disarankan untuk akuntabilitas.' },
      { icon: '📓', title: 'Catatan & Checklist', desc: 'Instruksi khusus atau checklist pekerjaan. Contoh: "1. Periksa level refrigerant, 2. Bersihkan filter, 3. Cek temperatur output".' },
    ],
    tips: [
      'Sistem kirim email pengingat H-7 sebelum tanggal jatuh tempo PM kepada PJ teknisi dan admin regional.',
      'Untuk aset critical (genset, UPS), gunakan interval lebih pendek: 30 hari untuk inspeksi, 90 hari untuk servis penuh.',
      'PM yang tidak dilakukan tepat waktu (overdue) akan muncul sebagai alert merah di dashboard.',
    ],
  },

  vendor: {
    title: 'Vendor & Contract Management',
    intro: 'Kelola data vendor/rekanan dan kontrak kerja sama operasional. Setiap regional memiliki vendor lokal sendiri — vendor AC di Medan berbeda dengan vendor AC di Surabaya. PIC kontrak dihubungkan ke admin regional terkait.',
    steps: [
      { icon: '🏢', title: 'Daftar Vendor & Kontrak', desc: 'Tabel semua kontrak aktif: Nama Vendor, Judul Kontrak, Tipe, Masa Berlaku, Nilai (IDR), PIC, dan Status. Urutan berdasarkan tanggal berakhir terdekat.' },
      { icon: '➕', title: 'Tambah Vendor Baru', desc: 'Klik "Tambah Vendor" untuk mendaftarkan vendor dan kontrak baru. PIC harus diisi email admin regional yang bertanggung jawab.' },
      { icon: '⏰', title: 'Kontrak Mendekati Expired', desc: 'Status "Expiring" (kuning) ditampilkan untuk kontrak yang masa berlakunya tinggal ≤ 30 hari. Segera proses perpanjangan!' },
      { icon: '✏️', title: 'Edit & Perpanjang', desc: 'Edit data kontrak atau perpanjang masa berlaku setelah kesepakatan baru tercapai dengan vendor.' },
      { icon: '🌍', title: 'Kontrak per Regional', desc: 'Setiap regional punya vendor sendiri. PIC email menunjukkan regional: regional.medan@... = kontrak Medan, regional.bandung@... = kontrak Bandung.' },
    ],
    tips: [
      'Pantau kontrak dengan status "Expiring" secara rutin — perpanjangan yang terlambat bisa mengganggu operasional.',
      'Gunakan field "Notes" untuk mencatat kondisi khusus kontrak: klausa penalty, SLA vendor, dsb.',
      'Nilai kontrak harus mencerminkan total nilai selama periode kontrak, bukan per bulan.',
    ],
  },

  vendor_add: {
    title: 'Form Tambah Vendor & Kontrak Baru',
    intro: 'Simpan profil vendor/rekanan beserta detail kontrak kerja sama. Pastikan PIC diisi sesuai admin regional yang bertanggung jawab.',
    steps: [
      { icon: '🏢', title: 'Nama Vendor *', desc: 'Nama badan usaha lengkap dan resmi. Contoh: "PT Daikin Service Indonesia", "PT Carrier AC Indonesia", "PT Perkins Power Indonesia".' },
      { icon: '📄', title: 'Judul Kontrak *', desc: 'Nama proyek kerja sama. Contoh: "Kontrak Perawatan AC Presisi Jatiluhur 2026" atau "Outsource Security Kantor Medan".' },
      { icon: '📂', title: 'Tipe Kontrak *', desc: 'Klasifikasi: maintenance (perawatan rutin), service (jasa layanan), insurance (asuransi), lease (sewa ruangan), atau procurement (pengadaan barang).' },
      { icon: '📅', title: 'Masa Berlaku *', desc: 'Tanggal mulai dan tanggal berakhirnya kontrak. Sistem otomatis menghitung status: Active, Expiring (< 30 hari), atau Expired.' },
      { icon: '💰', title: 'Nilai Kontrak (IDR) *', desc: 'Total nominal selama masa kontrak dalam Rupiah tanpa titik. Contoh: 450000000 untuk Rp 450 Juta. Bukan nilai per bulan!' },
      { icon: '👤', title: 'PIC (Person in Charge) *', desc: 'Email admin yang bertanggung jawab. Harus sesuai regional: regional.medan@... untuk vendor Medan, regional.surabaya@... untuk vendor Surabaya.' },
      { icon: '📎', title: 'Berkas & Catatan', desc: 'URL dokumen kontrak (PDF/scan) dan catatan khusus: klausa penalty, kondisi pembayaran, nomor PO, dsb.' },
    ],
    tips: [
      'Gunakan tipe "maintenance" untuk kontrak perawatan rutin AC, genset, UPS, lift, dsb.',
      'Field "Notes" sangat berguna untuk mencatat: "Regional Bandung — Jatiluhur DC" atau "Regional Surabaya".',
      'Satu vendor bisa memiliki beberapa kontrak dengan tipe berbeda (maintenance + service + insurance).',
    ],
  },

  workorder: {
    title: 'Work Order & Ticket Management',
    intro: 'Buat dan kelola tiket permintaan pekerjaan: laporan kerusakan, permintaan perbaikan, atau penugasan teknisi. Setiap WO dilacak dari pembuatan hingga penyelesaian dengan alur approval formal.',
    steps: [
      { icon: '📝', title: 'Buat Work Order', desc: 'Klik "Buat Work Order" untuk membuat tiket baru. Isi judul, deskripsi kerusakan, prioritas, kategori, dan upload foto bukti. WO otomatis mendapat nomor tiket unik (WO-2026-XXXX).' },
      { icon: '⏳', title: 'Alur Status WO', desc: 'Lifecycle: Open (baru dibuat) → In Progress (sedang dikerjakan) → Waiting Approval (menunggu persetujuan atasan) → Completed (selesai). WO juga bisa di-Reject kembali ke Open.' },
      { icon: '⚡', title: 'Prioritas & SLA', desc: '4 tingkat prioritas: 🟢 Low (3 hari), 🟡 Medium (1 hari), 🟠 High (8 jam), 🔴 Critical (4 jam). SLA Deadline ditampilkan countdown timer.' },
      { icon: '✅', title: 'Approval & Close', desc: 'WO yang selesai dikerjakan butuh approval dari Manager/SuperAdmin sebelum ditutup permanen. Jika reject, teknisi harus perbaiki dan submit ulang.' },
      { icon: '🔍', title: 'Filter & Search', desc: 'Filter berdasarkan status (Open/In Progress/Completed), prioritas, kategori (HVAC/Electrical/Plumbing), atau search berdasarkan keyword.' },
      { icon: '📷', title: 'Dokumentasi Foto', desc: 'Upload foto sebelum (bukti kerusakan) dan sesudah (bukti perbaikan) untuk dokumentasi lengkap dan verifikasi approval.' },
    ],
    tips: [
      'WO "Critical" memicu alert email prioritas tinggi ke Manager FMS dan Admin Pusat — gunakan hanya untuk keadaan darurat.',
      'Selalu upload foto bukti kerusakan — ini mempercepat diagnosa dan persiapan sparepart oleh teknisi.',
      'SLA countdown yang merah menandakan deadline sudah terlewat — eskalasi ke atasan jika diperlukan.',
    ],
  },

  workorder_create: {
    title: 'Form Buat Work Order (Tiket Perbaikan)',
    intro: 'Laporkan kerusakan fasilitas atau buat permintaan perbaikan. Tiket akan diteruskan ke teknisi yang ditunjuk dan dilacak hingga selesai.',
    steps: [
      { icon: '📝', title: 'Judul Tiket *', desc: 'Ringkasan masalah dalam 1 kalimat. ✅ Benar: "AC Presisi Data Hall 1 Jatiluhur Overheat" atau "Genset Surabaya Gagal Start Otomatis". ❌ Salah: "AC rusak" atau "Genset mati".' },
      { icon: '📓', title: 'Deskripsi Detail *', desc: 'Jelaskan kronologi, gejala, dan dampak. Contoh: "Suhu Cold Aisle melebihi 27°C sejak pukul 09:00. AC Unit 3 tidak dingin optimal. Sudah dicoba restart manual tapi kembali overheat setelah 30 menit."' },
      { icon: '⚡', title: 'Prioritas *', desc: 'Low = tidak mendesak, Medium = perlu ditangani hari ini, High = dampak operasional signifikan, Critical = DARURAT — ancaman terhadap layanan/keselamatan.' },
      { icon: '📂', title: 'Kategori *', desc: 'Klasifikasi: HVAC (pendingin), Electrical (kelistrikan), Plumbing (perpipaan/air), Civil (bangunan), IT (jaringan/server), atau Safety (keselamatan).' },
      { icon: '🏢', title: 'Aset Terkait', desc: 'Opsional: pilih aset yang bermasalah dari dropdown. Ini membantu teknisi mengidentifikasi spesifikasi dan riwayat perawatan aset.' },
      { icon: '📅', title: 'SLA Deadline', desc: 'Batas waktu penyelesaian. Jika tidak diisi, sistem otomatis set berdasarkan prioritas: Critical = 4 jam, High = 8 jam, Medium = 24 jam, Low = 72 jam.' },
      { icon: '📷', title: 'Upload Foto Bukti', desc: 'Foto kondisi kerusakan dari 2-3 sudut. Format PNG/JPG, maks 10MB/file. Foto sangat membantu diagnosa remote oleh teknisi.' },
    ],
    tips: [
      'Tiket "Critical" memicu notifikasi email langsung ke Manager FMS + Admin Pusat — gunakan dengan bijak.',
      'Deskripsi yang detail = perbaikan yang lebih cepat. Sertakan: kapan mulai, gejala apa, sudah coba apa.',
      'Jika WO terkait aset, pilih aset dari dropdown — teknisi bisa langsung lihat spesifikasi teknis dan riwayat PM.',
    ],
  },

  workorder_approve: {
    title: 'Form Approval Work Order',
    intro: 'Evaluasi hasil pekerjaan perbaikan sebelum tiket ditutup secara permanen. Hanya Manager FMS dan SuperAdmin yang bisa melakukan approval.',
    steps: [
      { icon: '👁️', title: 'Review Hasil Pekerjaan', desc: 'Tinjau deskripsi pekerjaan yang dilakukan, foto bukti sebelum dan sesudah perbaikan, dan catatan teknisi. Pastikan masalah benar-benar teratasi.' },
      { icon: '✅', title: 'Approve (Setujui)', desc: 'Klik "Approve" jika hasil perbaikan memuaskan dan masalah sudah selesai. Status WO akan berubah ke "Completed" dan ditutup permanen.' },
      { icon: '❌', title: 'Reject (Tolak)', desc: 'Klik "Reject" jika hasil belum memuaskan. Status WO kembali ke "Open" agar teknisi bisa mengerjakan ulang. WAJIB tulis alasan penolakan.' },
      { icon: '📝', title: 'Alasan Penolakan', desc: 'Jika reject, tulis alasan jelas dan spesifik. Contoh: "AC masih overheat setelah 2 jam. Perlu pengecekan refrigerant leak, bukan hanya cleaning filter."' },
    ],
    tips: [
      'Approve hanya setelah Anda yakin masalah benar-benar teratasi — WO yang di-approve tidak bisa dibuka kembali.',
      'Jika ragu, minta teknisi upload foto bukti sesudah perbaikan sebelum melakukan approval.',
      'Alasan reject yang jelas membantu teknisi memahami apa yang perlu diperbaiki.',
    ],
  },

  auditlog: {
    title: 'Audit Log — Catatan Aktivitas Sistem',
    intro: 'Catatan komprehensif semua aktivitas pengguna di FMSP: login, CRUD data, approval, perubahan konfigurasi, dan aksi administratif. Data ini tidak bisa dihapus dan digunakan untuk keperluan audit internal, compliance, dan investigasi insiden.',
    steps: [
      { icon: '📋', title: 'Tabel Log Aktivitas', desc: 'Setiap baris berisi: Timestamp, User (email), Aksi (CREATE/UPDATE/DELETE/LOGIN), Resource (Aset/Dokumen/User/WO), Detail perubahan, dan IP Address.' },
      { icon: '🔍', title: 'Filter & Search', desc: 'Filter berdasarkan: user tertentu, jenis aksi, resource, atau rentang tanggal. Search bar untuk keyword pencarian cepat di kolom detail.' },
      { icon: '📥', title: 'Export CSV', desc: 'Unduh seluruh log audit dalam format CSV untuk analisis offline, lampiran laporan compliance, atau backup arsip digital.' },
      { icon: '🔒', title: 'Immutable (Tidak Bisa Diubah)', desc: 'Log audit bersifat append-only — tidak ada user, termasuk SuperAdmin, yang bisa mengedit atau menghapus catatan aktivitas.' },
    ],
    tips: [
      'Audit log adalah bukti digital untuk compliance ISO 27001 dan audit internal — pastikan selalu tersedia.',
      'Filter berdasarkan user + rentang tanggal untuk investigasi aktivitas mencurigakan.',
      'Export CSV secara berkala (bulanan) sebagai backup arsip digital.',
    ],
  },

  admin: {
    title: 'Admin — Master Data & Pengaturan Sistem',
    intro: 'Kelola data referensi (master data) dan konfigurasi global sistem FMSP. Master data mencakup kategori aset, tipe dokumen, daftar lokasi, daftar regional, departemen, dan referensi lainnya. Pengaturan sistem mengontrol konfigurasi SMTP email untuk notifikasi.',
    steps: [
      { icon: '📂', title: 'Master Data (9 Kategori)', desc: 'Kelola data referensi: Tipe Aset (7), Tipe Fasilitas (7), Region/Wilayah (4: Jakarta, Medan, Bandung, Surabaya), Lokasi (10), Tipe Dokumen (7), Status Aset (5), Departemen (5), Tipe Maintenance (4), Kategori Vendor (4).' },
      { icon: '🌍', title: 'Master Data Region (BARU)', desc: 'Kategori "region" berisi 4 wilayah kerja: Jakarta (Pusat), Medan (Sumatera Utara), Bandung (Jawa Barat + Jatiluhur), Surabaya (Jawa Timur). Region ini digunakan untuk filter akses data per user.' },
      { icon: '⚙️', title: 'Pengaturan Sistem SMTP', desc: 'Konfigurasi server email untuk pengiriman notifikasi otomatis: SMTP Host, Port, Username, Password, dan email pengirim (From).' },
      { icon: '📧', title: 'Test Email', desc: 'Kirim email percobaan untuk memvalidasi konfigurasi SMTP sudah benar. Masukkan alamat email tujuan lalu klik "Kirim Test Email".' },
      { icon: '➕', title: 'Tambah/Edit Master Data', desc: 'Klik "Tambah" untuk menambah entry baru, atau klik ikon edit pada baris yang ada. Setiap entry memiliki: Kode, Label, Deskripsi, Urutan, dan Status Aktif.' },
    ],
    tips: [
      'Jangan hapus Master Data yang sudah dipakai oleh data lain — ini bisa menyebabkan error. Cukup nonaktifkan (isActive = false).',
      'Kategori "region" dan "location" sangat penting untuk filter data — pastikan kode dan label konsisten.',
      'SMTP yang salah = seluruh sistem notifikasi email (reminder dokumen, alert WO, approval) tidak berfungsi!',
    ],
  },

  admin_settings: {
    title: 'Pengaturan SMTP Email Sistem',
    intro: 'Konfigurasikan server SMTP untuk pengiriman notifikasi email otomatis: reminder dokumen expired, alert work order, dan approval notification. Konfigurasi ini WAJIB benar agar sistem notifikasi berfungsi.',
    steps: [
      { icon: '🌐', title: 'SMTP Host & Port *', desc: 'Alamat server SMTP. Contoh: smtp.mailtrap.io (testing), smtp.gmail.com (Gmail), smtp.office365.com (Outlook). Port: 587 (TLS) atau 465 (SSL).' },
      { icon: '🔐', title: 'Username & Password SMTP *', desc: 'Kredensial autentikasi untuk server SMTP. Untuk Mailtrap: gunakan API credential dari dashboard Mailtrap. Untuk Gmail: gunakan App Password (bukan password akun).' },
      { icon: '📧', title: 'Email Pengirim (From) *', desc: 'Alamat email resmi yang muncul sebagai pengirim. Format: "FMSP Lintasarta <noreply@lintasarta.co.id>" atau email custom perusahaan.' },
      { icon: '🏢', title: 'Nama Perusahaan', desc: 'Nama yang muncul di header email dan template notifikasi. Default: "PT Aplikanusa Lintasarta".' },
      { icon: '🔗', title: 'URL Aplikasi', desc: 'URL publik FMSP (contoh: https://fmsp.lintasarta.co.id). Digunakan untuk link "Lihat Detail" di dalam email notifikasi.' },
      { icon: '🚀', title: 'Test Koneksi SMTP', desc: 'Masukkan email tujuan test, lalu klik "Kirim Test Email". Jika berhasil, Anda akan menerima email percobaan dalam 1-2 menit.' },
    ],
    tips: [
      'SMTP yang salah = SEMUA pengingat dokumen dan approval WO tidak terkirim. Test setelah setiap perubahan!',
      'Untuk Gmail: aktifkan "2-Step Verification" dulu, lalu buat "App Password" di Google Account → Security.',
      'Gunakan Mailtrap (mailtrap.io) untuk environment testing/development — gratis dan aman, tidak mengirim ke email sungguhan.',
    ],
  },

  users: {
    title: 'Manajemen Pengguna & Hak Akses',
    intro: 'Kelola akun pengguna, role/hak akses, dan pembatasan regional. FMSP menggunakan sistem RBAC 6 tingkat dengan 4 regional (Jakarta/Medan/Bandung/Surabaya). Setiap user hanya bisa melihat data sesuai role dan regional-nya.',
    steps: [
      { icon: '👥', title: 'Daftar Pengguna', desc: 'Tabel semua user terdaftar: Nama, Email, Role, Region, Departemen, dan Status Aktif. Badge warna menunjukkan tingkat role. Ikon gembok = akun terkunci.' },
      { icon: '➕', title: 'Tambah User Baru', desc: 'Klik "Tambah User" untuk membuat akun. Role dan region wajib dipilih. Password harus memenuhi kebijakan: min 8 karakter + huruf besar + kecil + angka + simbol.' },
      { icon: '🔐', title: 'Hirarki 6 Role', desc: '👑 SuperAdmin (akses penuh) > 📊 Manager FMS (nasional) > 🛡️ Admin Pusat (nasional) > 🌍 Admin Regional (1 region) > 📍 Admin Lokasi (1 lokasi) > 👤 User (read + input).' },
      { icon: '🌍', title: 'Filter Regional', desc: 'Gunakan dropdown "Semua Region" untuk memfilter user per regional: Jakarta, Medan, Bandung, Surabaya, atau Nasional (tanpa region).' },
      { icon: '🚫', title: 'Aktif/Nonaktifkan', desc: 'Toggle status aktif tanpa menghapus data. User non-aktif tidak bisa login tapi data audit-nya tetap tersimpan.' },
      { icon: '🔓', title: 'Unlock & Reset Password', desc: 'Akun terkunci (setelah 5x gagal login) bisa di-unlock oleh admin. Reset password melalui flow approval oleh atasan.' },
    ],
    tips: [
      'SuperAdmin, Manager FMS, dan Admin Pusat TIDAK memiliki region — mereka melihat data seluruh Indonesia.',
      'Admin Regional, Admin Lokasi, dan User WAJIB memiliki region — tanpa region, mereka tidak bisa melihat data apapun.',
      'User yang di-nonaktifkan tetap terlihat di daftar (dengan filter "Tampilkan non-aktif") untuk keperluan audit.',
    ],
  },

  users_add: {
    title: 'Form Tambah/Edit Pengguna',
    intro: 'Daftarkan pengguna baru atau edit data pengguna yang ada. Perhatikan pemilihan Role dan Region — ini menentukan apa yang bisa dilihat dan dilakukan user di dalam sistem.',
    steps: [
      { icon: '👤', title: 'Nama Lengkap *', desc: 'Nama sesuai identitas resmi. Contoh: "Ahmad Siregar", "Andi Prasetyo", "Eko Wahyudi".' },
      { icon: '📧', title: 'Email *', desc: 'Email Lintasarta yang valid (format: nama@lintasarta.co.id). Email tidak bisa diubah setelah akun dibuat. Email harus unik.' },
      { icon: '🔐', title: 'Role / Tingkat Akses *', desc: 'Pilih dari dropdown (sesuai kewenangan Anda). Masing-masing role memiliki hak akses berbeda — role lebih tinggi bisa mengelola role di bawahnya.' },
      { icon: '🌍', title: 'Region / Wilayah Kerja', desc: 'Pilih dari dropdown standar: Jakarta (Kantor Pusat), Medan (Sumut), Bandung (Jabar + Jatiluhur), atau Surabaya (Jatim). WAJIB untuk Admin Regional, Admin Lokasi, dan User. Kosong = Nasional (untuk SuperAdmin/Manager/Admin Pusat).' },
      { icon: '💼', title: 'Departemen & No. HP', desc: 'Departemen penempatan (FM, IT, HR, Engineering) dan nomor telepon aktif untuk koordinasi lapangan.' },
      { icon: '🔑', title: 'Password', desc: 'Minimal 8 karakter, HARUS mengandung: huruf besar (A-Z), huruf kecil (a-z), angka (0-9), dan simbol (@$!%*?&#). Contoh yang valid: "Admin@2026".' },
    ],
    tips: [
      'Region sekarang berupa dropdown standar (bukan ketik manual) — ini memastikan filter data bekerja dengan benar.',
      'Jika role = Admin Regional/Lokasi/User tapi region kosong → muncul peringatan merah "Region wajib diisi".',
      'Jika role = SuperAdmin/Manager/Admin Pusat tapi region terisi → muncul peringatan kuning "Region akan diabaikan".',
      'Akun baru dengan flag "mustChangePassword" akan diminta ganti password saat login pertama kali.',
    ],
  },

  analytics: {
    title: 'Analytics & Insights — Visualisasi Data',
    intro: 'Dashboard analitik interaktif untuk pengambilan keputusan strategis. Grafik dan chart real-time menampilkan distribusi aset, tren maintenance, performa operasional, dan compliance dokumen. Data otomatis difilter per regional untuk user dengan akses terbatas.',
    steps: [
      { icon: '📊', title: 'Chart Distribusi Aset', desc: 'Pie/bar chart menampilkan breakdown aset per tipe (Gedung/Kendaraan/Fasilitas), per lokasi regional, dan per kondisi (Baik/Warning/Rusak). Hover untuk detail angka.' },
      { icon: '📈', title: 'Tren Historis (12 Bulan)', desc: 'Line chart menunjukkan tren bulanan: jumlah dokumen yang expired, work order yang dibuat, dan PM yang diselesaikan selama 12 bulan terakhir.' },
      { icon: '💰', title: 'Ringkasan Nilai Investasi', desc: 'Total nilai buku seluruh aset per regional. Berguna untuk pelaporan keuangan dan valuasi portofolio fasilitas.' },
      { icon: '📋', title: 'Compliance Scorecard', desc: 'Persentase dokumen valid vs expired per regional. Target: 100% valid. Regional dengan compliance rendah ditandai merah.' },
      { icon: '🌍', title: 'Filter Regional Otomatis', desc: 'Admin Medan hanya melihat analytics data Medan. Admin Pusat dan Manager FMS melihat data gabungan seluruh Indonesia.' },
    ],
    tips: [
      'Data analytics di-refresh setiap kali halaman dibuka — tidak perlu tekan tombol refresh.',
      'Untuk laporan presentasi ke manajemen, gunakan fitur Export untuk mengunduh data dalam format yang bisa diolah.',
      'Compliance rate rendah di suatu regional = ada dokumen yang expired dan belum diperpanjang — cek menu Aset → Dokumen Legal.',
    ],
  },

  aiconfig: {
    title: 'Konfigurasi Asisten AI (Copilot)',
    intro: 'Konfigurasikan asisten kecerdasan buatan (AI Copilot) berbasis Ollama yang berjalan secara lokal dan privat. AI membantu menjawab pertanyaan operasional, menganalisis data maintenance, dan memberikan rekomendasi berdasarkan konteks FMSP.',
    steps: [
      { icon: '🔌', title: 'URL Server Ollama *', desc: 'Endpoint API server Ollama. Default: http://localhost:11434. Pastikan server Ollama sudah running sebelum testing koneksi. Untuk server remote: http://[IP_SERVER]:11434.' },
      { icon: '🤖', title: 'Pemilihan Model LLM *', desc: 'Pilih model AI dari daftar yang tersedia di server. Rekomendasi: qwen2.5:1.5b (ringan, cepat) atau qwen2.5:7b (lebih pintar, butuh RAM lebih banyak). Model harus sudah di-pull terlebih dahulu.' },
      { icon: '🌡️', title: 'Pengaturan Temperatur', desc: 'Kontrol kreativitas respons AI. 0.0 = jawaban sangat kaku dan faktual (cocok untuk data teknis), 0.5 = seimbang (default), 1.0 = jawaban lebih bervariasi dan kreatif.' },
      { icon: '⚡', title: 'Test Koneksi', desc: 'Klik "Test Connection" untuk memverifikasi: status online server, latency (ms), dan model yang tersedia. Jika gagal, periksa apakah Ollama sudah running.' },
      { icon: '💬', title: 'Cara Menggunakan', desc: 'Setelah konfigurasi berhasil, tombol Copilot muncul di kanan bawah semua halaman. Ketik pertanyaan dalam Bahasa Indonesia atau Inggris.' },
    ],
    tips: [
      'Pastikan Ollama sudah di-install dan model sudah di-pull di terminal: "ollama pull qwen2.5:1.5b".',
      'AI Copilot berjalan 100% lokal — tidak ada data yang dikirim ke cloud. Aman untuk data rahasia perusahaan.',
      'Untuk performa terbaik di laptop, gunakan model kecil (1.5b atau 3b). Model 7b+ butuh GPU atau RAM ≥ 16GB.',
    ],
  },

  docs: {
    title: 'Dokumen & Buku Manual FMSP Lintasarta',
    intro: 'Pusat unduhan berkas resmi: Buku Putih Panduan Pengguna (User Manual), Manual Pemeliharaan Teknis (Maintenance Manual), dan diagram arsitektur sistem. Tersedia dalam format PDF (untuk baca/cetak) dan DOCX (untuk editing).',
    steps: [
      { icon: '📘', title: 'Buku Putih User Manual (PDF)', desc: 'Panduan lengkap penggunaan FMSP dengan layout cetak A4 Lintasarta Blue Corporate. Mencakup: alur kerja setiap modul, penjelasan RBAC 6 tingkat, struktur regional, dan FAQ. Format terbaik untuk dibaca dan dicetak.' },
      { icon: '📝', title: 'Buku Putih User Manual (DOCX)', desc: 'Versi editable (Word) dari user manual. Gunakan jika perlu kustomisasi dokumen untuk diserahkan ke manajemen atau tim internal.' },
      { icon: '⚙️', title: 'Manual Pemeliharaan Teknis (PDF)', desc: 'Dokumentasi teknis mendalam untuk administrator IT: arsitektur sistem (Next.js + PostgreSQL + Prisma), deployment (Docker/Fly.io), backup & restore database, skema ERD, dan troubleshooting.' },
      { icon: '📊', title: 'ERD (Entity Relationship Diagram)', desc: 'Diagram relasi antar tabel database. Berguna untuk developer dan DBA dalam memahami struktur data FMSP.' },
      { icon: '🔒', title: 'Keamanan & Hak Cipta', desc: 'Dokumen bersifat RAHASIA PERUSAHAAN dan dilindungi hak cipta PT Aplikanusa Lintasarta. Distribusi terbatas untuk tim operasional dan administrator resmi.' },
    ],
    tips: [
      'Gunakan PDF untuk pembacaan terbaik — layout A4 dan formatting CSS cetak dipertahankan secara presisi.',
      'Format DOCX berguna jika Anda perlu menambahkan catatan khusus atau menyesuaikan konten untuk presentasi internal.',
      'Manual Pemeliharaan ditujukan untuk tim IT/DevOps — bukan untuk end-user operasional.',
    ],
  },
};

export default function HelpGuide({ activeTab, isDark }: { activeTab: string; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const [overrideKey, setOverrideKey] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenHelp = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail && customEvent.detail.key) {
        setOverrideKey(customEvent.detail.key);
        setOpen(true);
      }
    };
    window.addEventListener('open-help', handleOpenHelp);
    return () => window.removeEventListener('open-help', handleOpenHelp);
  }, []);

  useEffect(() => {
    if (!open) {
      setOverrideKey(null);
      setExpandedStep(null);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  const currentKey = overrideKey || activeTab;
  const help = HELP_DATA[currentKey] || HELP_DATA[activeTab] || HELP_DATA.overview;

  // Colors based on theme
  const bg = isDark ? 'bg-[#0B1222]' : 'bg-white';
  const borderClr = isDark ? 'border-[#373C43]' : 'border-zinc-200';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textSub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const textBody = isDark ? 'text-zinc-300' : 'text-zinc-600';
  const cardBg = isDark ? 'bg-[#0F1929]' : 'bg-zinc-50';
  const cardBgHover = isDark ? 'hover:bg-[#131F33]' : 'hover:bg-zinc-100';
  const accentBg = isDark ? 'bg-[#3370FF]/8' : 'bg-[#3370FF]/5';

  // Portal target — mount overlay + drawer at body level
  // This avoids CSS containment from parent sticky/backdrop-filter headers
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      {/* ── Help Trigger Button (stays inline in header) ── */}
      <button
        onClick={() => setOpen(true)}
        className={`px-3 py-1.5 rounded-xl border transition-all duration-200 group flex items-center gap-1.5 ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-[#5B8EFF] hover:border-[#3370FF]/30 hover:bg-[#3370FF]/5'
            : 'bg-white border-zinc-200 text-zinc-500 hover:text-[#3370FF] hover:border-[#3370FF]/30 hover:bg-[#3370FF]/5 shadow-sm'
        }`}
        title="Panduan Halaman"
        aria-label="Buka panduan penggunaan halaman ini"
      >
        <HelpCircle className="w-4 h-4 text-zinc-500 group-hover:text-[#3370FF] dark:text-zinc-400 dark:group-hover:text-[#5B8EFF]" />
        <span className="text-xs font-semibold hidden md:inline">Bantuan</span>
      </button>

      {/* ── Portal: Overlay + Drawer rendered at body level ── */}
      {portalTarget && createPortal(
      <>
      {/* ── Backdrop Overlay ── */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      {/* ── Slide-In Drawer ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Panduan Penggunaan"
        className={`fixed top-0 right-0 z-[101] h-full w-full max-w-[420px] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        } ${bg} border-l ${borderClr}`}
      >
        {/* ─── Header ─── */}
        <div className={`flex-shrink-0 px-5 py-4 border-b ${borderClr}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl ${accentBg} border border-[#3370FF]/15 flex items-center justify-center flex-shrink-0`}>
                <BookOpen className="w-4.5 h-4.5 text-[#5B8EFF]" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-sm font-bold truncate ${textTitle}`}>{help.title}</h3>
                <p className={`text-[10px] font-medium ${textSub}`}>Panduan Halaman Ini</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'
              }`}
              aria-label="Tutup panduan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Scrollable Content ─── */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Intro Section */}
          <div className={`px-5 py-4 border-b ${borderClr}`}>
            <p className={`text-[13px] leading-relaxed ${textBody}`}>
              {help.intro}
            </p>
          </div>

          {/* Steps — Accordion Style */}
          <div className="px-5 py-4">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textSub}`}>
              Panduan Langkah
            </p>
            <div className="space-y-1.5">
              {help.steps.map((step, idx) => {
                const isExpanded = expandedStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setExpandedStep(isExpanded ? null : idx)}
                    className={`w-full text-left rounded-xl border transition-all duration-200 ${
                      isExpanded
                        ? `${isDark ? 'bg-[#111D30] border-[#3370FF]/20' : 'bg-blue-50/50 border-[#3370FF]/15'}`
                        : `${cardBg} ${cardBgHover} ${borderClr}`
                    }`}
                  >
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      <span className="text-base flex-shrink-0 w-7 h-7 flex items-center justify-center">{step.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-[#5B8EFF]/60' : 'text-[#3370FF]/50'}`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h4 className={`text-xs font-semibold ${textTitle}`}>{step.title}</h4>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-[#5B8EFF]' : isDark ? 'text-zinc-600' : 'text-zinc-300'
                        }`}
                      />
                    </div>
                    {/* Expanded description */}
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className={`px-3.5 pb-3 pl-[3.25rem] text-[12px] leading-relaxed ${textBody}`}>
                        {step.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips Section */}
          {help.tips && help.tips.length > 0 && (
            <div className="px-5 pb-5">
              <div className={`rounded-xl border p-4 ${
                isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50/80 border-amber-200/50'
              }`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Tips</p>
                </div>
                <ul className="space-y-2">
                  {help.tips.map((tip, idx) => (
                    <li key={idx} className={`text-[12px] leading-relaxed flex items-start gap-2 ${isDark ? 'text-amber-300/80' : 'text-amber-800'}`}>
                      <span className="text-amber-500 mt-0.5 text-[8px]">●</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className={`flex-shrink-0 px-5 py-3 border-t ${borderClr} flex items-center justify-between`}>
          <p className={`text-[10px] ${textSub}`}>
            Tekan <kbd className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}>Esc</kbd> untuk menutup
          </p>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3370FF] hover:bg-[#5B8EFF] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Mengerti
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      </>
      , portalTarget)}
    </>
  );
}
