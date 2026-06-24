import { NextRequest, NextResponse } from "next/server";
import { getAppSetting } from "@/lib/app-settings";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";

const SYSTEM_INSTRUCTION = `
Anda adalah Asisten Pintar FMSP Lintasarta, sebuah bot help center yang dirancang khusus untuk memandu pengguna aplikasi Facility Management Service Platform (FMSP) Lintasarta dan membantu para teknisi pemeliharaan (maintenance technicians) di lapangan.

Karakteristik Anda:
1. Menjawab dalam Bahasa Indonesia yang formal, sopan, jelas, dan profesional.
2. Membantu dengan petunjuk operasional sistem (cara menggunakan menu aplikasi).
3. Memberikan panduan teknis pemeliharaan fasilitas (maintenance) yang presisi dan aman sesuai prosedur standar.

Berikut adalah BASIS PENGETAHUAN FMSP Lintasarta yang harus Anda gunakan untuk menjawab pertanyaan:

1. MODUL & MENU APLIKASI FMSP LINTASARTA:
   - Dashboard (Overview): Menampilkan statistik portofolio aset, grafik tren kondisi, dokumen legal expired, dan jadwal maintenance yang akan datang.
   - Manajemen Aset: Untuk mendaftarkan aset fisik baru (tanah, gedung, fasilitas kantor, kendaraan) beserta nilai buku, spesifikasi teknis, dan foto aset (maksimal 10MB per file). Di sini juga dilakukan perpindahan aset secara resmi ("Mutasi Lokasi") serta cetak Label & QR Code Aset untuk penempelan fisik.
   - Dokumen Legalitas: Mengelola sertifikasi, IMB, SLF, asuransi, PBB, dan PKB. Sistem akan mengirim email reminder otomatis H-30 sebelum masa berlaku dokumen habis. Tanggal jatuh tempo diperbarui melalui tombol "Perpanjang".
   - Work Order (WO): Menu tiket pelaporan masalah/kerusakan. Teknisi/Admin dapat membuat tiket baru dengan prioritas (Low, Medium, High, Critical) dan kategori pekerjaan (HVAC, Electrical, Plumbing, Structural, Safety) serta melampirkan foto. Tiket "Critical" memicu alert prioritas tinggi. WO harus melalui proses verifikasi dan approval oleh Manager/SuperAdmin setelah teknisi menyatakan selesai.
   - Preventive Maintenance (PM): Mengelola jadwal perawatan rutin preventif per aset. Interval pengulangan diisi dalam hitungan hari. Tanggal jatuh tempo berikutnya otomatis dihitung ulang dari tanggal terakhir perawatan selesai.
   - Inventory: Mengelola stok sparepart/material di gudang. Memiliki pengaman stok "Stok Minimum" (safety stock) dan "Stok Maksimum". Item dengan stok <= minimal akan otomatis ditandai warna merah sebagai alert restock.
   - Keuangan & RAB: Pencatatan jurnal transaksi keuangan operasional (debet/kredit) dan alokasi pagu Rencana Anggaran Biaya (RAB) tahunan per departemen. Pencatatan pengeluaran yang dihubungkan dengan pos RAB akan memotong alokasi plafon secara real-time.
   - SMK3 Safety: Inspeksi K3 rutin di area gedung. Meliputi pencatatan status kepatuhan alat keselamatan (Aman/Warning/Bahaya) dan pelaporan insiden kecelakaan kerja.
   - HRD & Security: Daftar karyawan, spesialisasi keahlian teknisi, shift jaga security, serta data sertifikasi Gada Pratama/Madya/Utama dan nomor KTA satpam.
   - Admin Master & SMTP: Mengonfigurasi master kategori aset/lokasi dan pengaturan server mail SMTP (Host, Port, User, Password, Test Email) untuk reminder otomatis.

2. PANDUAN TEKNIS PEMELIHARAAN OPERASIONAL:
   - HVAC / AC Presisi (Air Conditioning):
     - Bersihkan filter udara setiap 30 hari untuk menjaga sirkulasi udara bersih.
     - Periksa tekanan freon R410a: Suction normal 120-130 PSI, Discharge normal 350-400 PSI.
     - Cek arus kompresor dengan tang amperemeter (pastikan sesuai nameplate unit).
     - Bersihkan koil kondensor outdoor dengan air bertekanan sedang agar pembuangan panas optimal.
   - Genset (Generator Set):
     - Cek level oli mesin menggunakan dipstick (pastikan di antara tanda Min dan Max) sebelum start.
     - Periksa volume air radiator (coolant) dan air aki untuk starter.
     - Lakukan pemanasan (warming up) genset tanpa beban selama 10-15 menit seminggu sekali.
     - Kuras separator air pada sistem bahan bakar solar dari endapan air/lumpur.
   - Kelistrikan (MDP & Panel):
     - Pemindaian termal (thermal scan) infra merah pada breaker dan sambungan kabel secara rutin. Suhu normal wajib di bawah 60°C.
     - Kencangkan sekrup terminal kabel secara berkala (harus dalam kondisi sumber listrik OFF/Padam).
     - Cek fungsionalitas lampu indikator fasa (R, S, T) dan voltase meter.
   - Pemadam Kebakaran / APAR:
     - Cek jarum indikator tekanan (wajib di area hijau, sekitar 15 bar).
     - Pastikan pin pengunci dan segel pengaman plastik dalam kondisi utuh.
     - Cek tanggal expired tabung (masa kadaluarsa powder biasanya 5 tahun).
     - Balikkan tabung APAR powder secara perlahan 3-5 kali setiap 6 bulan agar serbuk kimia di dalamnya tidak menggumpal atau mengeras.

Jika pertanyaan user tidak berhubungan dengan aplikasi atau pemeliharaan gedung, ingatkan mereka secara sopan bahwa Anda hanya bertugas membantu dalam lingkup aplikasi FMSP Lintasarta dan pemeliharaan fasilitas.
`;

// Fungsi Fallback Offline berbasis Pencocokan Kata Kunci (Keyword Matching Engine)
function getLocalFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  // 1. Salam / Greetings
  if (
    q.includes("halo") ||
    q.includes("hai") ||
    q.includes("pagi") ||
    q.includes("siang") ||
    q.includes("sore") ||
    q.includes("malam") ||
    q.includes("assalamu")
  ) {
    return `Halo! Saya adalah Asisten FMSP Lintasarta (Mode Offline). Saya dapat membantu Anda memandu operasional menu aplikasi atau memberikan panduan teknis pemeliharaan fasilitas (AC, Genset, Panel Listrik, APAR, dll.).

Silakan ketik pertanyaan Anda atau pilih tombol saran di bawah! 😊`;
  }

  // 2. HVAC / AC
  if (
    q.includes("ac") ||
    q.includes("hvac") ||
    q.includes("presisi") ||
    q.includes("dingin") ||
    q.includes("freon") ||
    q.includes("kondensor")
  ) {
    return `### 🔧 Panduan Pemeliharaan AC Presisi & HVAC
Berikut checklist pemeliharaan teknis rutin untuk unit pendingin ruangan (AC):
1. **Pembersihan Filter**: Wajib dibersihkan minimal **30 hari sekali** untuk mencegah penyumbatan debu.
2. **Tekanan Freon R410a**:
   - Batas normal sisi rendah (*Suction*): **120 - 130 PSI**
   - Batas normal sisi tinggi (*Discharge*): **350 - 400 PSI**
3. **Arus Listrik Kompresor**: Ukur menggunakan tang amperemeter, bandingkan dengan data nameplate unit untuk mendeteksi beban berlebih (*overload*).
4. **Pembersihan Kondensor**: Semprot koil kondensor outdoor dengan air bertekanan sedang tiap 3-6 bulan untuk mengoptimalkan pelepasan panas.`;
  }

  // 3. Genset / Diesel
  if (
    q.includes("genset") ||
    q.includes("generator") ||
    q.includes("diesel") ||
    q.includes("solar") ||
    q.includes("aki") ||
    q.includes("radiator")
  ) {
    return `### ⚡ Panduan Pemeliharaan Generator Set (Genset)
Sebelum menghidupkan dan merawat Genset, lakukan pemeriksaan berikut:
1. **Level Oli**: Tarik *dipstick* oli mesin, bersihkan, masukkan kembali, dan pastikan level oli berada di antara garis Min dan Max.
2. **Pemanasan Rutin**: Genset wajib dipanaskan (*warming up*) tanpa beban selama **10-15 menit sekali seminggu** untuk menjaga sirkulasi oli dan pengisian aki.
3. **Pendingin & Elektrikal**: Cek ketinggian air radiator (coolant) dan bersihkan terminal aki dari korosi.
4. **Sistem Solar**: Kuras air pada *water separator* solar untuk mencegah air masuk ke ruang bakar.`;
  }

  // 4. Panel Listrik / Kelistrikan
  if (
    q.includes("listrik") ||
    q.includes("panel") ||
    q.includes("kabel") ||
    q.includes("mcb") ||
    q.includes("breaker") ||
    q.includes("fasa")
  ) {
    return `### ⚡ Panduan Pemeliharaan Panel Distribusi Listrik (MDP)
Langkah-langkah keselamatan dan pengecekan panel listrik:
1. **Pemindaian Suhu (Thermal Scan)**: Gunakan thermal gun infra merah pada breaker dan terminal kabel. Suhu operasi aman adalah **di bawah 60°C**. Jika di atas itu, ada indikasi sambungan longgar (*loose connection*).
2. **Perawatan Fisik**: Kencangkan baut terminal secara periodik. **PERINGATAN**: Pastikan sumber aliran listrik utama dalam posisi **OFF (Padam)** sebelum menyentuh komponen panel.
3. **Lampu Indikator**: Periksa lampu fasa R-S-T harus menyala semua untuk memastikan keseimbangan daya masuk.`;
  }

  // 5. APAR / Pemadam
  if (
    q.includes("apar") ||
    q.includes("pemadam") ||
    q.includes("kebakaran") ||
    q.includes("tabung") ||
    q.includes("powder") ||
    q.includes("segel")
  ) {
    return `### 🛡️ Panduan Inspeksi Alat Pemadam Api Ringan (APAR)
Lakukan pengecekan fisik APAR secara rutin setiap bulan:
1. **Tekanan Gas**: Pastikan jarum indikator tekanan (pressure gauge) berada di **area hijau** (sekitar 15 bar).
2. **Segel & Pin**: Pastikan segel plastik pengaman dan pin penarik pelatuk dalam keadaan utuh dan tidak terlepas.
3. **Kondisi Powder**: Balikkan tabung APAR secara perlahan (posisi kepala di bawah, kaki di atas) sebanyak **3-5 kali setiap 6 bulan** agar bubuk kimia kering (*dry chemical powder*) di dalamnya tidak menggumpal/mengeras.
4. **Fisik & Selang**: Pastikan selang karet tidak retak/pecah dan tabung bebas dari karat berat.`;
  }

  // 6. Work Order / Tiket Kerusakan
  if (
    q.includes("work order") ||
    q.includes("wo") ||
    q.includes("tiket") ||
    q.includes("lapor") ||
    q.includes("kerusakan") ||
    q.includes("tugas")
  ) {
    return `### 📝 Panduan Operasional Tiket Work Order (WO)
Berikut adalah alur penggunaan modul Work Order di aplikasi FMSP Lintasarta:
1. **Buat Tiket Baru**: Masuk ke menu **Work Order** -> klik **Buat Work Order**.
2. **Pengisian Form**:
   - Isi **Judul** yang jelas (contoh: "AC Presisi Server Room Bocor").
   - Deskripsikan detail masalah dan assign teknisi penanggung jawab.
   - Tentukan **Prioritas** (Low, Medium, High, Critical) serta batas waktu SLA.
   - Unggah foto kerusakan sebagai bukti dokumentasi awal.
3. **SLA & Escalation**: Tiket bertanda *Critical* akan ditandai warna merah mencolok dan memicu alert prioritas tinggi ke email manajemen.
4. **Approval Selesai**: Tiket yang telah dikerjakan oleh teknisi memerlukan peninjauan (*verification*) dan persetujuan (*approval*) dari Manager atau SuperAdmin untuk ditutup secara resmi.`;
  }

  // 7. Tambah Aset / Mutasi / QR Code
  if (
    q.includes("aset") ||
    q.includes("asset") ||
    q.includes("tambah aset") ||
    q.includes("mutasi") ||
    q.includes("qr") ||
    q.includes("perizinan") ||
    q.includes("legal")
  ) {
    return `### 🏢 Panduan Manajemen Aset & Dokumen Legalitas
Cara mengelola aset fisik dan dokumen legalitas di FMSP:
1. **Tambah Aset**: Klik **Tambah Aset Fisik Baru** di pojok kanan atas tab Aset. Isi nama, tipe, lokasi, spesifikasi teknis, nilai buku, dan lampirkan foto fisik aset.
2. **Mutasi Aset**: Untuk memindahkan aset antar gedung/ruangan secara resmi, klik aset -> pilih **Mutasi Lokasi** di bagian detail. Ini akan mencatat riwayat pemindahan secara kronologis.
3. **QR Code**: Setiap aset otomatis memiliki kode QR. Anda dapat mengunduh gambar QR atau mengeklik **Print Label** untuk dicetak dan ditempel pada fisik aset.
4. **Dokumen Legalitas**: Tab ini mengelola IMB, SLF, asuransi, dll. Sistem akan mengirim email pengingat H-30 sebelum dokumen kadaluarsa. Tekan **Perpanjang** jika dokumen telah diperbarui.`;
  }

  // 8. Karyawan / Shift / Security
  if (
    q.includes("karyawan") ||
    q.includes("hrd") ||
    q.includes("security") ||
    q.includes("shift") ||
    q.includes("satpam") ||
    q.includes("jaga")
  ) {
    return `### 👤 Panduan HRD & Jadwal Shift Security
Cara mengelola personil operasional fasilitas:
1. **Tambah Karyawan**: Di menu HRD -> klik **Tambah Karyawan**. Masukkan biodata, departemen, dan gaji pokok. Jika peran adalah *Security*, masukkan detail level Gada (Pratama/Madya/Utama) beserta masa berlaku KTA.
2. **Shift Security**: Tab *Security* digunakan untuk menjadwalkan shift (Pagi/Siang/Malam) dan penugasan pos jaga (Lobby, Gerbang, Patroli) agar penjagaan gedung selalu terisi 24/7.`;
  }

  // 9. Gudang / Inventory / Stok
  if (
    q.includes("gudang") ||
    q.includes("inventory") ||
    q.includes("stok") ||
    q.includes("restock") ||
    q.includes("barang") ||
    q.includes("sparepart")
  ) {
    return `### 📦 Panduan Pengelolaan Stok Inventaris Gudang
Cara mengontrol sparepart operasional:
1. **Tambah Item**: Di menu *Inventory* -> klik **Tambah Barang**. Isi nama, kategori, unit satuan (pcs, roll, dll.), stok awal, dan lokasi rak simpan.
2. **Safety Stock (Batas Minimum)**: Tentukan batas minimum stok. Ketika jumlah barang riil <= stok minimum, item tersebut akan ditandai dengan **warna merah** di tabel sebagai alert segera lakukan pengadaan ulang (*restock*).
3. **Harga Unit**: Masukkan harga beli satuan untuk menghitung otomatis total valuasi aset di gudang.`;
  }

  // 10. Anggaran / RAB / Keuangan / Accounting
  if (
    q.includes("anggaran") ||
    q.includes("rab") ||
    q.includes("keuangan") ||
    q.includes("accounting") ||
    q.includes("transaksi") ||
    q.includes("biaya")
  ) {
    return `### 💰 Panduan Keuangan & Rencana Anggaran (RAB)
Cara melacak anggaran operasional agar tidak over-budget:
1. **Rencana Anggaran (RAB)**: Masuk ke tab *RAB* -> klik **Tambah Anggaran Baru**. Tentukan tahun anggaran, departemen (GA, HRD, Maintenance, dll.), kategori pengeluaran, dan plafon dana.
2. **Jurnal Transaksi (Accounting)**: Catat setiap pemasukan/pengeluaran kas operasional. Hubungkan pengeluaran tersebut dengan pos RAB terkait agar sisa anggaran pagu otomatis terpotong secara real-time.`;
  }

  // 11. SMK3 / K3 / Inspeksi
  if (
    q.includes("k3") ||
    q.includes("smk3") ||
    q.includes("inspeksi") ||
    q.includes("kecelakaan") ||
    q.includes("insiden") ||
    q.includes("safety")
  ) {
    return `### 📋 Panduan SMK3 & Checklist K3 Gedung
Untuk menjaga standar keselamatan kerja di lingkungan Lintasarta:
1. **Poin Inspeksi**: Tambahkan objek inspeksi K3 baru (seperti hidran, peta evakuasi, perlengkapan P3K) beserta lokasinya.
2. **Status Inspeksi**: Berikan status Kepatuhan (Aman / Perlu Tindakan / Bahaya). Lakukan pengecekan rutin sesuai tanggal cek terakhir.
3. **Lapor Insiden**: Catat dan laporkan kejadian kecelakaan kerja secara detail (kronologi, foto, tindakan korektif) untuk keperluan audit HSE (*Health, Safety, and Environment*).`;
  }

  // 12. SMTP / Setting / Konfigurasi
  if (
    q.includes("smtp") ||
    q.includes("setting") ||
    q.includes("pengaturan") ||
    q.includes("email") ||
    q.includes("cron")
  ) {
    return `### ⚙️ Panduan Pengaturan SMTP & Notifikasi Email
Cara memastikan email reminder terkirim dengan lancar:
1. **Konfigurasi SMTP**: Masuk ke menu **Admin** -> klik tab **Pengaturan Sistem** -> cari bagian SMTP. Isi data Server Host, Port (587 / 2525), Email Pengirim (Sender), Username, dan Password SMTP.
2. **Tes SMTP**: Masukkan alamat email tujuan di kolom tes, lalu klik **Kirim Test Email** untuk menguji konektivitas server email.
3. **Cron Job**: Jalankan cron job manual di menu *Reminder* untuk memeriksa dokumen legalitas expired atau jadwal PM overdue dan langsung mengirim notifikasi email.`;
  }

  // Fallback Umum
  return `Saya adalah Asisten FMSP Lintasarta (Mode Offline). Saya memahami pertanyaan Anda mengenai sistem FMSP Lintasarta, namun untuk memberikan jawaban yang lebih detail, saya sarankan menanyakan seputar topik-topik berikut:
- **Teknis Maintenance**: AC Presisi (HVAC), Genset Solar, Panel Kelistrikan, Inspeksi APAR.
- **Operasional Aplikasi**: Buat Work Order, Tambah Aset, Perpanjang Dokumen Legal, Mengatur Stok Inventory, Catat Transaksi Keuangan, Penjadwalan PM, SMK3, atau Pengaturan SMTP.

Silakan coba ketik dengan kata kunci di atas!`;
}

// ── SSRF Protection: Only allow Ollama on localhost/private IPs ──
const ALLOWED_OLLAMA_HOSTS = ["127.0.0.1", "localhost", "0.0.0.0", "::1"];

function isOllamaUrlSafe(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return ALLOWED_OLLAMA_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const isBotEnabled = await getAppSetting("ai_bot_enabled", "true");
    if (isBotEnabled !== "true") {
      return NextResponse.json(
        {
          success: false,
          error: "Asisten AI dinonaktifkan oleh administrator.",
        },
        { status: 403 },
      );
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pesan chat kosong." },
        { status: 400 },
      );
    }

    const latestMessage = messages[messages.length - 1];
    const userQuery = latestMessage.content || "";

    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

    // SECURITY: Validate Ollama URL against allowlist to prevent SSRF
    if (!isOllamaUrlSafe(ollamaUrl)) {
      console.error(
        `[CHAT SECURITY] SSRF blocked: OLLAMA_BASE_URL "${ollamaUrl}" is not in allowlist.`,
      );
      const fallbackReply = getLocalFallbackResponse(userQuery);
      return NextResponse.json({
        success: true,
        reply: fallbackReply,
        source: "Local Knowledge Base (Offline Fallback)",
      });
    }

    let isOllamaOnline = false;
    try {
      const pingController = new AbortController();
      const pingTimeout = setTimeout(() => pingController.abort(), 1200);
      const pingResponse = await fetch(ollamaUrl, {
        method: "GET",
        signal: pingController.signal,
      });
      clearTimeout(pingTimeout);
      if (pingResponse.ok || pingResponse.status === 200) {
        isOllamaOnline = true;
      }
    } catch {
      // Ollama offline
    }

    if (isOllamaOnline) {
      try {
        const chatController = new AbortController();
        const chatTimeout = setTimeout(() => chatController.abort(), 30000);

        const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            messages: [
              { role: "system", content: SYSTEM_INSTRUCTION },
              ...messages.map((m: any) => ({
                role: m.role === "user" ? "user" : "assistant",
                content:
                  typeof m.content === "string" ? m.content.slice(0, 4000) : "", // Limit input size
              })),
            ],
            temperature: 0.7,
          }),
          signal: chatController.signal,
        });

        clearTimeout(chatTimeout);

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              source: `Ollama (${ollamaModel})`,
            });
          }
        }
      } catch {
        // Ollama generation failed or timed out — fall through to fallback
      }
    }

    const fallbackReply = getLocalFallbackResponse(userQuery);
    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      source: "Local Knowledge Base (Offline Fallback)",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memproses chat." },
      { status: 500 },
    );
  }
}

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const isBotEnabled = await getAppSetting("ai_bot_enabled", "true");
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

    let isOllamaOnline = false;
    if (isOllamaUrlSafe(ollamaUrl)) {
      try {
        const pingController = new AbortController();
        const pingTimeout = setTimeout(() => pingController.abort(), 1200);
        const pingResponse = await fetch(ollamaUrl, {
          method: "GET",
          signal: pingController.signal,
        });
        clearTimeout(pingTimeout);
        if (pingResponse.ok) isOllamaOnline = true;
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      enabled: isBotEnabled === "true",
      ollamaOnline: isOllamaOnline,
      // SECURITY: Don't expose internal Ollama URL to client
      model: ollamaModel,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}

export const POST = withAuth(withPermission("chat_use", handlePost));
export const GET = withAuth(withPermission("chat_use", handleGet));
