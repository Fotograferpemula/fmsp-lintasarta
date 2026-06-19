import os
import subprocess

def generate_user_manual_html():
    html_content = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Buku Putih & User Manual FMSP Lintasarta</title>
    <style>
        @page {
            size: A4;
            margin: 2.5cm;
        }
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #334155;
            margin: 0;
            padding: 0;
        }
        h1, h2, h3 {
            color: #1769FF;
            font-weight: bold;
            page-break-after: avoid;
        }
        h1 {
            font-size: 20pt;
            border-bottom: 2px solid #1769FF;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        h2 {
            font-size: 14pt;
            color: #0D4FCB;
            margin-top: 25px;
        }
        h3 {
            font-size: 12pt;
            color: #475569;
            margin-top: 20px;
            font-style: italic;
        }
        p {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-bottom: 15px;
            padding-left: 20px;
        }
        li {
            margin-bottom: 6px;
        }
        .page-break {
            page-break-before: always;
        }
        .cover {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            padding: 2cm 0;
            box-sizing: border-box;
            page-break-after: always;
        }
        .cover-header {
            margin-top: 10%;
        }
        .cover-logo {
            max-width: 250px;
            margin: 0 auto 50px auto;
            display: block;
        }
        .cover-title {
            font-size: 26pt;
            font-weight: bold;
            color: #1769FF;
            margin: 0;
            line-height: 1.2;
        }
        .cover-subtitle {
            font-size: 14pt;
            font-weight: bold;
            color: #64748B;
            margin-top: 15px;
            text-transform: uppercase;
        }
        .cover-divider {
            width: 150px;
            height: 4px;
            background-color: #1769FF;
            margin: 30px auto;
        }
        .cover-meta {
            font-size: 11pt;
            color: #94A3B8;
            margin-top: 50px;
        }
        .cover-footer {
            margin-bottom: 5%;
            font-size: 12pt;
            font-weight: bold;
            color: #1769FF;
            line-height: 1.5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9.5pt;
        }
        th, td {
            border: 1px solid #CBD5E1;
            padding: 10px 12px;
            text-align: left;
        }
        th {
            background-color: #1769FF;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #F8FAFC;
        }
        .img-container {
            text-align: center;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .img-container img {
            max-width: 90%;
            height: auto;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .img-caption {
            font-size: 8.5pt;
            font-style: italic;
            color: #64748B;
            margin-top: 8px;
        }
    </style>
</head>
<body>

    <!-- COVER PAGE -->
    <div class="cover">
        <div class="cover-header">
            <img class="cover-logo" src="screenshots/logo.png" alt="Lintasarta Logo">
            <h1 class="cover-title" style="border:none; margin:0; padding:0;">BUKU PUTIH & USER MANUAL</h1>
            <div class="cover-subtitle">FACILITY MANAGEMENT SERVICE PLATFORM (FMSP) LINTASARTA</div>
            <div class="cover-divider"></div>
            <div class="cover-meta">
                Versi 2.0 (Edisi Pembaruan AI & Dokumentasi Halaman Lengkap)<br>
                Juni 2026
            </div>
        </div>
        <div class="cover-footer">
            PT Aplikanusa Lintasarta<br>
            Divisi Facility Management & Keamanan Informasi
        </div>
    </div>

    <!-- TABLE OF CONTENTS -->
    <div class="page-break">
        <h1>Daftar Isi</h1>
        <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
            <li><strong>1. Pendahuluan & Gambaran Umum</strong></li>
            <li style="padding-left: 20px;">1.1 Latar Belakang Masalah</li>
            <li style="padding-left: 20px;">1.2 Tujuan Platform</li>
            <li><strong>2. Keamanan Sistem & Arsitektur</strong></li>
            <li style="padding-left: 20px;">2.1 Autentikasi Single Sign-On (SSO) & MFA</li>
            <li style="padding-left: 20px;">2.2 Role-Based Access Control (RBAC) & Filter Region</li>
            <li style="padding-left: 20px;">2.3 Manajemen Brute Force & Audit Logging</li>
            <li style="padding-left: 20px;">2.4 Manajemen Pengguna & Reset Password</li>
            <li style="padding-left: 20px;">2.5 Pengaturan Data Master (Master Data Configuration)</li>
            <li style="padding-left: 20px;">2.6 Log Audit Sistem (System Audit Log)</li>
            <li><strong>3. Panduan Operasional Modul Fase 1</strong></li>
            <li style="padding-left: 20px;">3.1 Dashboard (Overview)</li>
            <li style="padding-left: 20px;">3.2 Manajemen Aset Fisik & Cetak QR Code</li>
            <li style="padding-left: 20px;">3.3 Dokumen Legalitas Aset</li>
            <li style="padding-left: 20px;">3.4 Kotak Pengingat & Alerts (Reminder & Alerts)</li>
            <li style="padding-left: 20px;">3.5 Pemeliharaan Preventif (Preventive Maintenance - PM)</li>
            <li style="padding-left: 20px;">3.6 Inventaris Gudang & Safety Stock</li>
            <li style="padding-left: 20px;">3.7 Sistem Manajemen K3 (SMK3 Safety & Insiden)</li>
            <li style="padding-left: 20px;">3.8 Vendor & Manajemen Kontrak</li>
            <li><strong>4. Panduan Operasional Modul Fase 2 (Advance Menu)</strong></li>
            <li style="padding-left: 20px;">4.1 HRD & Security Shift</li>
            <li style="padding-left: 20px;">4.2 Manajemen Keuangan & RAB Terintegrasi</li>
            <li style="padding-left: 20px;">4.3 Modul Work Order (WO) & Approval Alur Kerusakan</li>
            <li style="padding-left: 20px;">4.4 Analytics & Visualisasi Data</li>
            <li><strong>5. Sistem Asisten AI & Bantuan Kontekstual</strong></li>
            <li style="padding-left: 20px;">5.1 Bantuan Kontekstual Drawer (Help Guide)</li>
            <li style="padding-left: 20px;">5.2 Asisten AI Copilot Lokal (Ollama Integration)</li>
            <li style="padding-left: 20px;">5.3 Menu Konfigurasi AI & Uji Konektivitas</li>
            <li><strong>6. Peningkatan Kapasitas & Standar Upload</strong></li>
            <li style="padding-left: 20px;">6.1 Batas Ukuran 100MB per Dokumen</li>
            <li style="padding-left: 20px;">6.2 Antarmuka Tombol Unggah Langsung</li>
            <li style="padding-left: 20px;">6.3 Menu Unduh Dokumen Pendukung & Buku Manual</li>
        </ul>
    </div>

    <!-- CONTENT -->
    <div class="page-break">
        <h1>1. Pendahuluan & Gambaran Umum</h1>
        <p>Facility Management Service Platform (FMSP) Lintasarta adalah platform berbasis web terintegrasi yang dirancang untuk mengelola seluruh aspek pemeliharaan fasilitas fisik, aset kantor, dokumen legalitas, sistem inventaris gudang, program SMK3, hingga pengelolaan anggaran tahunan (RAB) dan ketenagakerjaan teknisi serta personil keamanan secara terpusat.</p>
        
        <h2>1.1 Latar Belakang Masalah</h2>
        <p>Sebelum diimplementasikannya FMSP, pengelolaan fasilitas di PT Aplikanusa Lintasarta dilakukan secara manual atau terfragmentasi melalui berbagai aplikasi spreadsheet yang terpisah. Hal ini menimbulkan beberapa masalah kritis:</p>
        <ol>
            <li><strong>Keterlambatan Perpanjangan Dokumen:</strong> Dokumen perizinan gedung (seperti IMB, SLF, asuransi, PBB) seringkali terlambat diperpanjang karena tidak adanya sistem pengingat otomatis.</li>
            <li><strong>Kerusakan Aset Tidak Terlacak:</strong> Tidak adanya pelaporan tiket kerusakan yang sistematis (Work Order) mengakibatkan penundaan perbaikan fasilitas vital (seperti AC Presisi di Ruang Server, Genset Backup, Panel Listrik).</li>
            <li><strong>Over-budget Anggaran:</strong> Pihak General Affairs (GA) dan Maintenance mengalami kesulitan melacak penggunaan anggaran operasional secara riil dibandingkan pagu Rencana Anggaran Biaya (RAB) tahunan.</li>
        </ol>

        <h2>1.2 Tujuan Platform</h2>
        <p>FMSP Lintasarta hadir untuk memecahkan masalah tersebut dengan menyediakan:</p>
        <ul>
            <li><strong>Sistem Pengingat Dokumen (Reminder Alert):</strong> Mengirimkan alert notifikasi email otomatis H-30 sebelum masa berlaku dokumen habis.</li>
            <li><strong>Modul Preventive Maintenance (PM) & Work Order:</strong> Mengotomatisasi jadwal perawatan AC, Genset, Panel Listrik, dan menyediakan alur approval tiket kerusakan yang terstruktur.</li>
            <li><strong>Kontrol Inventaris yang Akurat:</strong> Alert otomatis berwarna merah jika stok sparepart vital di gudang berada di bawah Stok Minimum.</li>
            <li><strong>Real-time Budget Tracking:</strong> Pengeluaran keuangan terhubung langsung ke pos RAB tahunan dan memotong alokasi plafon secara otomatis.</li>
        </ul>
    </div>

    <div class="page-break">
        <h1>2. Keamanan Sistem & Arsitektur</h1>
        <p>Aplikasi FMSP Lintasarta dibangun dengan arsitektur modern Next.js (App Router), PostgreSQL sebagai database utama, Prisma ORM sebagai data mapping layer, dan Ollama AI sebagai copilot kecerdasan buatan lokal yang aman.</p>

        <h2>2.1 Autentikasi Single Sign-On (SSO) & MFA</h2>
        <p>Akses masuk ke aplikasi FMSP Lintasarta dikendalikan secara ketat melalui integrasi Corporate SSO Gateway Lintasarta. Setelah pengguna memasukkan email korporat (@lintasarta.co.id) dan kata sandi, sistem secara otomatis meminta verifikasi 2-Factor Authentication (2FA) melalui aplikasi Microsoft Authenticator pada perangkat telepon seluler pengguna sebelum memberikan token otorisasi JWT.</p>

        <h2>2.2 Role-Based Access Control (RBAC) & Filter Region</h2>
        <p>Sistem menerapkan Role-Based Access Control (RBAC) yang sangat ketat untuk membedakan hak akses berdasarkan peran masing-masing karyawan. Peran yang tersedia meliputi SuperAdmin, Manager FMS, Admin Pusat, Admin Regional, Admin Lokasi, dan User/Teknisi.</p>

        <table>
            <thead>
                <tr>
                    <th>Role</th>
                    <th>Manajemen Aset</th>
                    <th>Work Order</th>
                    <th>Budget & RAB</th>
                    <th>Admin Master</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>SuperAdmin</strong></td>
                    <td>Full CRUD (Semua)</td>
                    <td>Full CRUD + Approve</td>
                    <td>Full CRUD</td>
                    <td>Ya (Akses Penuh)</td>
                </tr>
                <tr>
                    <td><strong>Manager FMS</strong></td>
                    <td>Read Only (Semua)</td>
                    <td>Approve Selesai</td>
                    <td>Approve & Read</td>
                    <td>Tidak</td>
                </tr>
                <tr>
                    <td><strong>Admin Pusat</strong></td>
                    <td>Full CRUD (Semua)</td>
                    <td>Create, Update, Assign</td>
                    <td>Read Only</td>
                    <td>Tidak</td>
                </tr>
                <tr>
                    <td><strong>Admin Regional</strong></td>
                    <td>CRUD Region Terkait</td>
                    <td>Create, Update, Assign</td>
                    <td>Read Only</td>
                    <td>Tidak</td>
                </tr>
                <tr>
                    <td><strong>Teknisi / User</strong></td>
                    <td>Read Only</td>
                    <td>Update Status Tugas</td>
                    <td>Tidak Ada Akses</td>
                    <td>Tidak</td>
                </tr>
            </tbody>
        </table>

        <h2>2.3 Manajemen Brute Force & Audit Logging</h2>
        <p>Untuk mencegah serangan brute force, akun pengguna dikunci selama 15 menit jika terdeteksi 5 kali gagal login berturut-turut. Setiap operasi penambahan, pengubahan, penghapusan data, pengunggahan berkas, serta login ke sistem akan dicatat secara otomatis ke dalam database untuk mendukung audit trail infosec.</p>

        <h2>2.4 Manajemen Pengguna & Reset Password</h2>
        <p>Halaman <strong>Manajemen Pengguna</strong> (tab <code>users</code> di sidebar) digunakan oleh SuperAdmin/Admin untuk menambah staf baru, mengatur kata sandi default staf, memberikan penugasan peran (role), dan menetapkan wilayah kerja (region scope). Tim Admin dapat menyetujui atau menyetel ulang (reset) sandi staf secara manual dari menu ini apabila staf mengalami kegagalan masuk.</p>

        <div class="img-container">
            <img src="screenshots/approval.png" alt="User Management Screenshot">
            <div class="img-caption">Gambar 2.1: Menu Manajemen Pengguna & Hak Akses Hirarki</div>
        </div>

        <h2>2.5 Pengaturan Data Master (Master Data Configuration)</h2>
        <p>Pada halaman <strong>Admin Master Data</strong> (tab <code>admin</code> di sidebar), SuperAdmin dapat mengelola dropdown dan opsi dinamis di seluruh aplikasi. Hal ini mencakup penambahan gedung baru (seperti Gedung TB Simatupang, Kantor Regional), kategori vendor, jenis dokumen legalitas, jenis pemeliharaan preventif, dan divisi internal departemen. Modifikasi pada menu ini langsung terefleksi di form pengisian data tanpa memerlukan pembaruan kode program.</p>

        <h2>2.6 Log Audit Sistem (System Audit Log)</h2>
        <p>Halaman <strong>Audit Log</strong> (tab <code>auditlog</code> di sidebar) menampilkan daftar aktivitas operasional secara komprehensif. Setiap baris mencatat identitas pengguna, tipe aktivitas (LOGIN, CREATE, UPDATE, DELETE, UPLOAD), modul yang diakses, alamat IP asal, serta penanda waktu presisi. Admin FMS dapat melakukan pencarian berbasis nama user atau memfilter tipe operasi untuk melacak sejarah perubahan data penting.</p>
    </div>

    <div class="page-break">
        <h1>3. Panduan Operasional Modul Fase 1</h1>
        
        <h2>3.1 Dashboard (Overview)</h2>
        <p>Halaman <strong>Overview</strong> (tab <code>overview</code> di sidebar) bertindak sebagai pusat informasi utama (Dashboard). Halaman ini menampilkan metrik utama secara real-time termasuk total aset fisik terdaftar, nilai buku aset, tingkat persentase kepatuhan dokumen legalitas (dokumen aktif vs kadaluarsa), sisa pagu RAB FMS, dan grafik performa kondisi kelayakan fasilitas.</p>

        <div class="img-container">
            <img src="screenshots/login.png" alt="Dashboard Screenshot">
            <div class="img-caption">Gambar 3.1: Halaman Dashboard & Ringkasan Portofolio Aset FMSP Lintasarta</div>
        </div>

        <h2>3.2 Manajemen Aset Fisik & Cetak QR Code</h2>
        <p>Menu utama <strong>Aset & Perizinan</strong> dengan sub-tab <strong>Aset</strong> digunakan untuk mencatat dan memantau semua aset fisik Lintasarta. Pengguna dapat memasukkan nama aset, kategori, lokasi gedung, region, tanggal pembelian, nilai buku, dan kondisi aset. Sistem secara otomatis membuat QR Code unik untuk setiap aset baru. Pengguna dapat mengeklik tombol 'Print Label' pada tabel untuk mengunduh label QR siap cetak berlogo resmi Lintasarta untuk mempermudah scanning inventaris lapangan.</p>

        <h2>3.3 Dokumen Legalitas Aset</h2>
        <p>Pada menu <strong>Aset & Perizinan</strong> dengan sub-tab <strong>Dokumen Legalitas</strong>, tim FMS mengelola izin-izin gedung operasional (seperti Sertifikat Layak Fungsi - SLF, IMB, Polis Asuransi Kebakaran, Pajak PBB). Di sini pengguna dapat mengunggah pindaian dokumen (mendukung berkas hingga 100MB), mencatat tanggal berakhirnya masa berlaku, serta melihat hitungan mundur hari tersisa menuju tanggal kedaluwarsa secara visual.</p>

        <h2>3.4 Kotak Pengingat & Alerts (Reminder & Alerts)</h2>
        <p>Halaman <strong>Reminder & Alerts</strong> (tab <code>notifications</code> di sidebar) menyajikan peringatan status dokumen legalitas, status inspeksi SMK3, kontrak vendor yang akan habis, dan limit persediaan gudang. Sistem secara berkala menjalankan serverless cron dan mengirim email peringatan H-30 sebelum masa berlaku habis ke email PIC Lintasarta yang bertanggung jawab. Admin juga dapat menyetel status notifikasi menjadi 'Resolved' setelah perpanjangan selesai diproses.</p>

        <h2>3.5 Pemeliharaan Preventif (Preventive Maintenance - PM)</h2>
        <p>Halaman <strong>Preventive Maintenance</strong> (tab <code>maintenance</code> di sidebar) digunakan untuk menjadwalkan pemeriksaan berkala untuk fasilitas kritis Lintasarta seperti AC Presisi Ruang Server, Genset Backup, Panel Listrik Utama (MDP), Lift, dan APAR. Pengguna dapat mengisi interval hari pemeriksaan. Setelah status inspeksi diubah menjadi 'Selesai', sistem secara otomatis mengkalkulasi dan menjadwalkan ulang tanggal jatuh tempo pemeliharaan preventif berikutnya.</p>

        <h2>3.6 Inventaris Gudang & Safety Stock</h2>
        <p>Halaman <strong>Inventory</strong> (tab <code>inventory</code> di sidebar) melacak stok suku cadang (spareparts), APD, lampu, filter AC, dan perlengkapan pemeliharaan gedung. Setiap barang memiliki nilai batas minimum (Safety Stock). Jika jumlah stok riil berkurang di bawah batas stok minimum, sistem otomatis memberikan penanda warna merah menyala pada baris tabel serta memicu alert notifikasi agar tim logistik segera melakukan pemesanan ulang (restocking).</p>

        <h2>3.7 Sistem Manajemen K3 (SMK3 Safety & Insiden)</h2>
        <p>Halaman <strong>SMK3 Safety</strong> (tab <code>smk3</code> di sidebar) mendukung program Keselamatan dan Kesehatan Kerja. Halaman ini terbagi menjadi dua bagian:<br>
        1. Checklist Kelayakan Alat K3: Pemantauan kelayakan kotak P3K, tabung APAR, sistem deteksi asap (smoke detector), dan hidran.<br>
        2. Laporan Kecelakaan Kerja & Insiden: Form pencatatan kecelakaan kerja, deskripsi kronologi, klasifikasi keparahan (minor/major), serta tindakan korektif yang wajib diisi dan diunggah bukti fotonya oleh penanggung jawab keselamatan di lokasi.</p>

        <h2>3.8 Vendor & Manajemen Kontrak</h2>
        <p>Halaman <strong>Vendor & Contract</strong> (tab <code>vendor</code> di sidebar) mencatat identitas rekanan pihak ketiga (kontraktor AC, penyedia lift, outsourcing security) serta dokumen kontrak kerja sama. Kolom pencatatan mencakup nilai kontrak, nama PIC, tanggal mulai, dan tanggal berakhir. Fitur reminder otomatis akan mengirim email alert H-30 sebelum masa kerja sama berakhir untuk mempersiapkan proses review kinerja vendor atau adendum kontrak baru.</p>
    </div>

    <div class="page-break">
        <h1>4. Panduan Operasional Modul Fase 2 (Advance Menu)</h1>
        
        <h2>4.1 HRD & Security Shift</h2>
        <p>Menu <strong>HRD & Security</strong> (tab <code>hrd</code> di sidebar) memfasilitasi General Affairs dalam mengelola staf pendukung. Menu ini terbagi atas:<br>
        1. Sub-tab FMS Staff / Karyawan: Mengelola data karyawan teknisi sipil, kelistrikan, tata udara, lengkap dengan info sertifikasi kompetensi.<br>
        2. Sub-tab Security Shift: Mengatur jadwal piket satpam (pagi, siang, malam), menetapkan pembagian pos jaga (Lobby Utama, Pintu Gerbang Timur, Patroli Area Parkir), serta memantau absensi harian satpam secara terintegrasi.</p>

        <h2>4.2 Manajemen Keuangan & RAB Terintegrasi</h2>
        <p>Menu <strong>Keuangan</strong> (tab <code>accounting</code> di sidebar) mengendalikan pemakaian anggaran FMS agar tidak melampaui pagu tahunan. Terbagi menjadi:<br>
        1. Sub-tab Keuangan / Transaksi: Pencatatan debet/kredit pengeluaran operasional (seperti pembelian freon AC, sparepart APAR, perbaikan pipa).<br>
        2. Sub-tab Rencana Anggaran Biaya (RAB): Daftar alokasi pos anggaran tahunan FMS Lintasarta. Setiap transaksi keuangan yang diinput akan memotong sisa saldo pagu RAB bersangkutan secara real-time. Jika transaksi melebihi pagu tersisa, sistem otomatis menolak input transaksi (over-budget lock).</p>

        <h2>4.3 Modul Work Order (WO) & Approval Alur Kerusakan</h2>
        <p>Menu <strong>Work Order / Ticket</strong> (tab <code>workorder</code> di sidebar) mengelola penanganan komplain kerusakan fasilitas. Alur penanganan kerusakan diatur sistematis:</p>
        <ol>
            <li><strong>Laporan Kerusakan (Open):</strong> User menginput tiket laporan kerusakan, menautkan aset terganggu, dan memilih tingkat prioritas (Low, Medium, High, Critical).</li>
            <li><strong>Penugasan Teknisi (On Progress):</strong> Admin menugaskan teknisi pelaksana. Status berubah menjadi On Progress.</li>
            <li><strong>Laporan Selesai (Resolved):</strong> Teknisi mengunggah foto perbaikan dan menandai status resolved.</li>
            <li><strong>Verifikasi & Approval (Closed):</strong> Tiket resolved harus disetujui (Approve) secara resmi oleh Manager FMS atau SuperAdmin di dashboard agar status berubah menjadi Closed. Jika hasil perbaikan belum memuaskan, Manager dapat me-reject dan mengembalikan tiket ke teknisi.</li>
        </ol>

        <div class="img-container">
            <img src="screenshots/work_order.png" alt="Work Order Screenshot">
            <div class="img-caption">Gambar 4.1: Antarmuka Modul Work Order & Tiket Kerusakan</div>
        </div>

        <h2>4.4 Analytics & Visualisasi Data</h2>
        <p>Menu <strong>Analytics & Charts</strong> (tab <code>analytics</code> di sidebar) menyediakan visualisasi grafik interaktif (ditenagai Recharts) untuk pengambilan keputusan manajemen. Grafik yang disajikan mencakup perbandingan alokasi pengeluaran OPEX vs CAPEX bulanan, tingkat penyelesaian tiket Work Order per teknisi, persentase kepatuhan sertifikat kelayakan SMK3 per regional, serta grafik pergerakan stok suku cadang gudang.</p>

        <div class="img-container">
            <img src="screenshots/analytics.png" alt="Analytics Screenshot">
            <div class="img-caption">Gambar 4.2: Visualisasi Charts & Grafik Analisis Keuangan FMSP</div>
        </div>
    </div>

    <div class="page-break">
        <h1>5. Sistem Asisten AI & Bantuan Kontekstual</h1>
        
        <h2>5.1 Bantuan Kontekstual Drawer (Help Guide)</h2>
        <p>Mengeklik tombol ikon bantuan 'HelpCircle' pada form dialog akan membuka Drawer Bantuan Kontekstual di sisi kanan layar yang memandu pengisian form secara rinci tanpa mengganggu input yang sedang berjalan.</p>

        <h2>5.2 Asisten AI Copilot Lokal (Ollama Integration)</h2>
        <p>Obrolan interaktif AI melayang di pojok kanan bawah menggunakan model Ollama lokal (Qwen 2.5) untuk menjaga keamanan data. Memiliki fitur fallback offline instan ke Keyword Search jika server AI tidak merespons dalam 1.2 detik.</p>

        <h2>5.3 Menu Konfigurasi AI & Uji Konektivitas</h2>
        <p>Menu khusus admin di Phase 2 (<strong>AI Configuration</strong>, tab <code>aiconfig</code> di sidebar) memungkinkan SuperAdmin mengaktifkan atau menonaktifkan fitur chat widget melayang secara real-time nasional. Selain itu, menu ini menyediakan tombol interaktif 'Uji Koneksi' untuk menguji latensi ping server Ollama lokal.</p>
    </div>

    <div class="page-break">
        <h1>6. Peningkatan Kapasitas & Standar Upload</h1>
        
        <h2>6.1 Batas Ukuran 100MB per Dokumen</h2>
        <p>Kapasitas unggahan berkas ditingkatkan secara signifikan dari 10MB menjadi 100MB per dokumen pada endpoint <code>/api/upload</code> untuk memfasilitasi file scan resolusi tinggi, dokumen IMB tebal, dan file CAD cetak biru fasilitas.</p>

        <h2>6.2 Antarmuka Tombol Unggah Langsung</h2>
        <p>Menambahkan tombol 'Upload' fisik di samping field URL pada dialog Dokumen Legalitas Aset untuk mempermudah pemilihan berkas secara lokal dari perangkat pengguna, yang otomatis mengisi kolom URL setelah proses unggah selesai.</p>

        <h2>6.3 Menu Unduh Dokumen Pendukung & Buku Manual</h2>
        <p>Halaman <strong>Dokumen & Manual</strong> (tab <code>docs</code> di sidebar) memfasilitasi administrator untuk mengunduh versi cetak (.pdf) maupun versi dapat diedit (.docx) dari Buku Putih Panduan Pengguna dan Manual Pemeliharaan Teknis FMSP Lintasarta kapan saja secara mandiri.</p>
    </div>

</body>
</html>
"""
    os.makedirs("public/docs", exist_ok=True)
    with open("public/docs/Buku_Putih_User_Manual_FMSP_Lintasarta.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print("User Manual HTML generated successfully.")

def generate_maintenance_manual_html():
    html_content = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Manual Pemeliharaan Sistem FMSP Lintasarta</title>
    <style>
        @page {
            size: A4;
            margin: 2.5cm;
        }
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #334155;
            margin: 0;
            padding: 0;
        }
        h1, h2, h3 {
            color: #7C3AED; /* Violet for tech manual */
            font-weight: bold;
            page-break-after: avoid;
        }
        h1 {
            font-size: 20pt;
            border-bottom: 2px solid #7C3AED;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        h2 {
            font-size: 14pt;
            color: #5B21B6;
            margin-top: 25px;
        }
        h3 {
            font-size: 12pt;
            color: #475569;
            margin-top: 20px;
            font-style: italic;
        }
        p {
            margin-bottom: 12px;
            text-align: justify;
        }
        ul, ol {
            margin-bottom: 15px;
            padding-left: 20px;
        }
        li {
            margin-bottom: 6px;
        }
        .page-break {
            page-break-before: always;
        }
        .cover {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
            padding: 2cm 0;
            box-sizing: border-box;
            page-break-after: always;
        }
        .cover-header {
            margin-top: 10%;
        }
        .cover-logo {
            max-width: 250px;
            margin: 0 auto 50px auto;
            display: block;
        }
        .cover-title {
            font-size: 24pt;
            font-weight: bold;
            color: #7C3AED;
            margin: 0;
            line-height: 1.2;
        }
        .cover-subtitle {
            font-size: 13pt;
            font-weight: bold;
            color: #64748B;
            margin-top: 15px;
            text-transform: uppercase;
        }
        .cover-divider {
            width: 150px;
            height: 4px;
            background-color: #7C3AED;
            margin: 30px auto;
        }
        .cover-meta {
            font-size: 11pt;
            color: #94A3B8;
            margin-top: 50px;
        }
        .cover-footer {
            margin-bottom: 5%;
            font-size: 12pt;
            font-weight: bold;
            color: #7C3AED;
            line-height: 1.5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9.5pt;
        }
        th, td {
            border: 1px solid #CBD5E1;
            padding: 10px 12px;
            text-align: left;
        }
        th {
            background-color: #7C3AED;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #F8FAFC;
        }
        .img-container {
            text-align: center;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .img-container img {
            max-width: 95%;
            height: auto;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .img-caption {
            font-size: 8.5pt;
            font-style: italic;
            color: #64748B;
            margin-top: 8px;
        }
    </style>
</head>
<body>

    <!-- COVER PAGE -->
    <div class="cover">
        <div class="cover-header">
            <img class="cover-logo" src="screenshots/logo.png" alt="Lintasarta Logo">
            <h1 class="cover-title" style="border:none; margin:0; padding:0;">MANUAL PEMELIHARAAN SISTEM<br>(MAINTENANCE MANUAL)</h1>
            <div class="cover-subtitle">FACILITY MANAGEMENT SERVICE PLATFORM (FMSP) LINTASARTA</div>
            <div class="cover-divider"></div>
            <div class="cover-meta">
                Dokumentasi Teknis, Konfigurasi, Migrasi, & Backup<br>
                Versi 2.0 - Juni 2026
            </div>
        </div>
        <div class="cover-footer">
            PT Aplikanusa Lintasarta<br>
            Divisi IT Infrastructure & DevOps
        </div>
    </div>

    <!-- TABLE OF CONTENTS -->
    <div class="page-break">
        <h1>Daftar Isi</h1>
        <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
            <li><strong>1. Pendahuluan & Lingkup Sistem</strong></li>
            <li><strong>2. Struktur File & Komponen Terkait</strong></li>
            <li style="padding-left: 20px;">2.1 Struktur Proyek Next.js</li>
            <li style="padding-left: 20px;">2.2 Komponen Keamanan Utama</li>
            <li><strong>3. Konfigurasi Sistem (System Settings)</strong></li>
            <li style="padding-left: 20px;">3.1 Variabel Lingkungan (.env)</li>
            <li style="padding-left: 20px;">3.2 Integrasi Asisten AI (Ollama)</li>
            <li><strong>4. Manajemen Database & Migrasi</strong></li>
            <li style="padding-left: 20px;">4.1 Prisma Schema & Client Generation</li>
            <li style="padding-left: 20px;">4.2 Proses Migrasi Schema</li>
            <li><strong>5. Prosedur Backup & Pemulihan (Backup & Restore)</strong></li>
            <li style="padding-left: 20px;">5.1 Prosedur Manual Backup (pg_dump)</li>
            <li style="padding-left: 20px;">5.2 Prosedur Manual Restore (pg_restore)</li>
            <li style="padding-left: 20px;">5.3 Backup Otomatis & Pemeliharaan Rutin</li>
            <li><strong>6. Dokumentasi Relasi Tabel Database</strong></li>
            <li style="padding-left: 20px;">6.1 Skema Hubungan Entitas (ERD)</li>
            <li style="padding-left: 20px;">6.2 Detail Tabel & Foreign Keys</li>
        </ul>
    </div>

    <!-- CONTENT -->
    <div class="page-break">
        <h1>1. Pendahuluan & Lingkup Sistem</h1>
        <p>Buku Panduan Pemeliharaan ini dibuat khusus untuk administrator sistem, tim IT Infrastructure, dan DevOps PT Aplikanusa Lintasarta. Buku ini berisi instruksi teknis yang diperlukan untuk mengelola, mengonfigurasi, melakukan pencadangan data (backup), melakukan migrasi skema database, serta memelihara infrastruktur aplikasi Facility Management Service Platform (FMSP) Lintasarta agar tetap berjalan optimal dengan tingkat ketersediaan tinggi.</p>

        <h1>2. Struktur File & Komponen Terkait</h1>
        <p>Aplikasi FMSP Lintasarta menggunakan struktur standar Next.js App Router (TypeScript). Berikut adalah berkas dan direktori penting terkait pemeliharaan sistem:</p>

        <table>
            <thead>
                <tr>
                    <th>File / Direktori</th>
                    <th>Fungsi & Deskripsi Teknis</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>prisma/schema.prisma</strong></td>
                    <td>Definisi skema database PostgreSQL dan konfigurasi Prisma client ORM.</td>
                </tr>
                <tr>
                    <td><strong>src/lib/db.ts</strong></td>
                    <td>Inisialisasi koneksi Prisma Client global (mencegah kehabisan pool koneksi di dev).</td>
                </tr>
                <tr>
                    <td><strong>src/lib/auth-middleware.ts</strong></td>
                    <td>Middleware verifikasi token JWT dan proteksi autentikasi global.</td>
                </tr>
                <tr>
                    <td><strong>src/lib/rbac.ts</strong></td>
                    <td>Definisi matriks peran (ROLES) dan perizinan hak akses fitur (PERMISSIONS).</td>
                </tr>
                <tr>
                    <td><strong>src/app/api/</strong></td>
                    <td>Semua endpoint REST API (backend Next.js serverless functions).</td>
                </tr>
                <tr>
                    <td><strong>fly.toml & Dockerfile</strong></td>
                    <td>Konfigurasi rilis infrastruktur containerization untuk deployment ke Fly.io.</td>
                </tr>
                <tr>
                    <td><strong>public/docs/</strong></td>
                    <td>Direktori penyimpanan berkas panduan Buku Putih dan Manual Pemeliharaan (.docx / .pdf).</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="page-break">
        <h1>3. Konfigurasi Sistem (System Settings)</h1>
        
        <h2>3.1 Variabel Lingkungan (.env)</h2>
        <p>Aplikasi membutuhkan konfigurasi variabel lingkungan yang wajib didefinisikan baik pada file `.env` lokal maupun pada tab Secrets di Fly.io console:</p>
        <ul>
            <li><strong>DATABASE_URL:</strong> URL koneksi PostgreSQL utama (format: postgresql://user:password@host:port/db?schema=public).</li>
            <li><strong>JWT_SECRET:</strong> Kunci enkripsi untuk menandatangani token sesi JWT (wajib diset unik dan kuat di produksi).</li>
            <li><strong>CRON_SECRET:</strong> Kunci autentikasi untuk mengamankan endpoint cron reminder dan maintenance dari eksekusi luar.</li>
            <li><strong>APP_BASE_URL:</strong> URL root aplikasi (misalnya https://fmsp-lintasarta.fly.dev) untuk tautan reminder email.</li>
            <li><strong>SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS:</strong> Detail server mail relay Outlook Lintasarta untuk pengiriman notifikasi.</li>
        </ul>

        <h2>3.2 Integrasi Asisten AI (Ollama)</h2>
        <p>Konfigurasi AI Copilot diatur melalui:</p>
        <ul>
            <li><strong>OLLAMA_BASE_URL:</strong> Default http://localhost:11434 (alamat server Ollama lokal).</li>
            <li><strong>OLLAMA_MODEL:</strong> Default qwen2.5:1.5b atau qwen2.5:3b.</li>
        </ul>
        <p>Pengaturan bot asisten ini dapat dimatikan/dinyalakan secara dinamis melalui dashboard admin, dan nilainya disimpan pada tabel 'AppSetting' dengan key 'ai_bot_enabled'.</p>

        <h1>4. Manajemen Database & Migrasi</h1>
        
        <h2>4.1 Prisma Schema & Client Generation</h2>
        <p>Apabila ada perubahan struktur tabel pada `prisma/schema.prisma`, tim maintenance wajib melakukan generate ulang client SDK dengan menjalankan perintah berikut pada CLI:</p>
        <pre style="background-color: #F1F5F9; padding: 10px; border-radius: 6px;">npx prisma generate</pre>

        <h2>4.2 Proses Migrasi Schema</h2>
        <p>Untuk menerapkan perubahan skema ke database secara aman tanpa menghapus data yang ada:</p>
        <ol>
            <li><strong>Di Lingkungan Pengembangan (Development):</strong><br>
                <pre style="background-color: #F1F5F9; padding: 6px; border-radius: 4px; display: inline-block; margin: 5px 0;">npx prisma migrate dev --name nama_migrasi</pre>
            </li>
            <li><strong>Di Lingkungan Produksi (Fly.io/VPS):</strong><br>
                <pre style="background-color: #F1F5F9; padding: 6px; border-radius: 4px; display: inline-block; margin: 5px 0;">npx prisma db push --accept-data-loss</pre>
            </li>
        </ol>
        <p>Catatan: File fly.toml telah dikonfigurasi dengan perintah rilis otomatis `release_command = "npx prisma@6.19.3 db push --accept-data-loss"` sehingga setiap deployment rilis baru akan otomatis menjalankan sinkronisasi skema database.</p>
    </div>

    <div class="page-break">
        <h1>5. Prosedur Backup & Pemulihan (Backup & Restore)</h1>
        
        <h2>5.1 Prosedur Manual Backup (pg_dump)</h2>
        <p>Pencadangan database PostgreSQL dilakukan secara manual dengan utilitas `pg_dump`. Jalankan perintah berikut pada terminal yang memiliki akses jaringan ke server database:</p>
        <pre style="background-color: #F1F5F9; padding: 10px; border-radius: 6px; font-size: 9.5pt; overflow-x: auto;">pg_dump -h &lt;host_db&gt; -U &lt;user_db&gt; -d &lt;nama_db&gt; -F c -b -v -f /path/backup/fmsp_backup_$(date +%Y%m%d_%H%M%S).dump</pre>
        <p>Untuk database yang berjalan di Fly.io, Anda dapat melakukan port-forward proxy postgres lokal terlebih dahulu:</p>
        <pre style="background-color: #F1F5F9; padding: 10px; border-radius: 6px; font-size: 9.5pt;">fly proxy 5432 -a fmsp-lintasarta-db</pre>
        <p>Lalu jalankan pg_dump menggunakan host `localhost` dan port `5432`.</p>

        <h2>5.2 Prosedur Manual Restore (pg_restore)</h2>
        <p>Untuk memulihkan data dari berkas cadangan (.dump) ke database target:</p>
        <pre style="background-color: #F1F5F9; padding: 10px; border-radius: 6px; font-size: 9.5pt; overflow-x: auto;">pg_restore -v -h &lt;host_db&gt; -U &lt;user_db&gt; -d &lt;nama_db&gt; --clean --no-owner /path/backup/fmsp_backup_file.dump</pre>
        <p>Pilihan `--clean` akan menghapus tabel lama terlebih dahulu sebelum menimpa dengan data backup.</p>

        <h2>5.3 Backup Otomatis & Pemeliharaan Rutin</h2>
        <p>Sistem direkomendasikan untuk memasang cron job terjadwal pada VM Server Database Lintasarta setiap pukul 01:00 WIB dini hari untuk melakukan backup otomatis ke media cold storage eksternal menggunakan script <code>scripts/backup-db.sh</code>.</p>
        <pre style="background-color: #F1F5F9; padding: 10px; border-radius: 6px; font-size: 9.5pt;">0 1 * * * /app/scripts/backup-db.sh &gt;&gt; /var/log/db_backup.log 2&gt;&amp;1</pre>
    </div>

    <div class="page-break">
        <h1>6. Dokumentasi Relasi Tabel Database</h1>
        
        <h2>6.1 Skema Hubungan Entitas (ERD)</h2>
        <p>Berikut adalah visualisasi diagram hubungan entitas (ERD) dari database PostgreSQL FMSP Lintasarta yang menggambarkan keterkaitan kunci utama (Primary Key) dan kunci tamu (Foreign Key) antar tabel:</p>

        <div class="img-container">
            <img src="erd_diagram.png" alt="ERD Diagram">
            <div class="img-caption">Gambar 6.1: Diagram Hubungan Entitas (ERD) Database FMSP Lintasarta</div>
        </div>
    </div>

    <div class="page-break">
        <p><strong>Deskripsi Hubungan Entitas Utama:</strong></p>
        <ol>
            <li><strong>Relasi Aset Fisik & Dokumen Legalitas (1-to-Many):</strong><br>
                Tabel `Asset` dihubungkan ke tabel `LegalDocument` melalui relasi satu-ke-banyak. Hubungan didefinisikan oleh `LegalDocument.assetId` yang merujuk pada `Asset.id` (dengan aturan ON DELETE CASCADE).
            </li>
            <li><strong>Relasi Aset Fisik & Preventive Maintenance (1-to-Many):</strong><br>
                Tabel `Asset` berelasi satu-ke-banyak dengan `MaintenanceSchedule`. Kunci relasi didefinisikan oleh `MaintenanceSchedule.assetId` yang merujuk pada `Asset.id`.
            </li>
            <li><strong>Relasi Aset Fisik & Tiket Kerusakan (1-to-Many):</strong><br>
                Setiap tiket laporan kerusakan (`WorkOrder`) wajib ditautkan dengan aset fisik yang terganggu melalui relasi `WorkOrder.assetId` -> `Asset.id`.
            </li>
            <li><strong>Relasi Transaksi Keuangan & Plafon Anggaran (Many-to-1):</strong><br>
                Setiap transaksi pengeluaran keuangan (`AccountingTransaction`) harus merujuk ke salah satu pos plafon anggaran tahunan (`RabBudget`) melalui foreign key `AccountingTransaction.rabBudgetId` -> `RabBudget.id`.
            </li>
        </ol>

        <h2>6.2 Detail Tabel & Kolom Kunci</h2>
        <table>
            <thead>
                <tr>
                    <th>Tabel Asal</th>
                    <th>Kolom FK (Foreign Key)</th>
                    <th>Tabel Referensi</th>
                    <th>Jenis Kardinalitas</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>LegalDocument</strong></td>
                    <td>assetId</td>
                    <td>Asset</td>
                    <td>Many-to-One (N:1)</td>
                </tr>
                <tr>
                    <td><strong>MaintenanceSchedule</strong></td>
                    <td>assetId</td>
                    <td>Asset</td>
                    <td>Many-to-One (N:1)</td>
                </tr>
                <tr>
                    <td><strong>WorkOrder</strong></td>
                    <td>assetId</td>
                    <td>Asset</td>
                    <td>Many-to-One (N:1)</td>
                </tr>
                <tr>
                    <td><strong>AccountingTransaction</strong></td>
                    <td>rabBudgetId</td>
                    <td>RabBudget</td>
                    <td>Many-to-One (N:1)</td>
                </tr>
                <tr>
                    <td><strong>AuditLog</strong></td>
                    <td>userId</td>
                    <td>User</td>
                    <td>Many-to-One (N:1)</td>
                </tr>
                <tr>
                    <td><strong>Notification</strong></td>
                    <td>userId</td>
                    <td>User</td>
                    <td>Many-to-One (N:1)</td>
                </tr>
            </tbody>
        </table>
    </div>

</body>
</html>
"""
    os.makedirs("public/docs", exist_ok=True)
    with open("public/docs/Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print("Maintenance Manual HTML generated successfully.")

def convert_html_to_pdf():
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    
    # User Manual
    cmd_user = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--print-to-pdf=public/docs/Buku_Putih_User_Manual_FMSP_Lintasarta.pdf",
        "public/docs/Buku_Putih_User_Manual_FMSP_Lintasarta.html"
    ]
    
    # Maintenance Manual
    cmd_maint = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--print-to-pdf=public/docs/Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.pdf",
        "public/docs/Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.html"
    ]
    
    print("Converting User Manual HTML to PDF...")
    subprocess.run(cmd_user, check=True)
    print("User Manual PDF generated successfully.")
    
    print("Converting Maintenance Manual HTML to PDF...")
    subprocess.run(cmd_maint, check=True)
    print("Maintenance Manual PDF generated successfully.")

if __name__ == "__main__":
    generate_user_manual_html()
    generate_maintenance_manual_html()
    convert_html_to_pdf()
