import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime (needed for Buffer and PDF generation)
export const runtime = 'nodejs';

// Minimal PDF generator — no external dependencies
function generatePDF(title: string, lines: string[]): Uint8Array {
  const objects: string[] = [];
  let objCount = 0;

  function addObj(content: string): number {
    objCount++;
    objects.push(`${objCount} 0 obj\n${content}\nendobj\n`);
    return objCount;
  }

  // Font
  const fontId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  // Build page content stream
  const streamLines: string[] = [];
  streamLines.push('BT');
  streamLines.push('/F2 18 Tf');
  streamLines.push('50 780 Td');
  streamLines.push(`(${escPdf(title)}) Tj`);
  streamLines.push('/F1 10 Tf');
  streamLines.push('0 -30 Td');
  streamLines.push('(────────────────────────────────────────────) Tj');
  
  for (const line of lines) {
    streamLines.push('0 -18 Td');
    streamLines.push(`(${escPdf(line)}) Tj`);
  }
  streamLines.push('ET');
  const streamContent = streamLines.join('\n');

  const streamId = addObj(`<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`);

  // Page
  const pageId = addObj(`<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 612 842] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >> >> >>`);

  // Pages
  const pagesId = addObj(`<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`);

  // Fix parent ref
  objects[pageId - 1] = objects[pageId - 1].replace('PAGES_REF', `${pagesId} 0 R`);

  // Catalog
  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  // Build PDF
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += 'trailer\n';
  pdf += `<< /Size ${objCount + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF\n';

  // Convert to bytes
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i);
  }
  return bytes;
}

function escPdf(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// Document templates
const DOCUMENTS: Record<string, { title: string; lines: string[] }> = {
  'slf_jatiluhur_2026': {
    title: 'SERTIFIKAT LAIK FUNGSI (SLF)',
    lines: [
      '',
      'Nomor Registrasi: SLF-32.02.1928-001',
      'Tanggal Terbit: 18 Juni 2025',
      'Masa Berlaku: 5 Tahun (s/d 18 Juni 2030)',
      '',
      'Nama Bangunan    : Gedung Technopark Lintasarta Jatiluhur',
      'Pemilik          : PT Aplikanusa Lintasarta',
      'Alamat           : Jl. Waduk Jatiluhur, Purwakarta, Jawa Barat 41152',
      'Fungsi           : Data Center (Tier III) dan Kantor Operasional',
      'Luas Bangunan    : 2.850 m2',
      'Jumlah Lantai    : 3 Lantai + Rooftop',
      '',
      'HASIL PEMERIKSAAN TEKNIS',
      '',
      'Struktur Bangunan        : LAIK (SNI 2847:2019)',
      'Proteksi Kebakaran       : LAIK (Fire alarm, sprinkler, APAR aktif)',
      'Instalasi Listrik        : LAIK (2.000 kVA, PUIL 2011)',
      'Instalasi Sanitasi       : LAIK (IPAL memenuhi baku mutu)',
      'Aksesibilitas            : LAIK (Ramp, guiding block tersedia)',
      'Sistem HVAC              : LAIK (Precision cooling N+1)',
      'Sistem UPS dan Genset    : LAIK (UPS 500 kVA + Genset CAT 1500 kVA)',
      '',
      'Penerbit: Kemen PUPR - Dinas Cipta Karya, Kab. Purwakarta',
      'Kepala Dinas: Ir. H. Bambang Suryadi, M.T.',
      '',
      'STATUS: VALID',
    ],
  },
  'pkb_hilux_2026': {
    title: 'PAJAK KENDARAAN BERMOTOR (PKB)',
    lines: [
      '',
      'Nomor Polisi: B 9102 SQA',
      '',
      'Merek / Tipe     : Toyota Hilux Double Cabin 2.4L',
      'Tahun Pembuatan  : 2022',
      'Nomor Rangka     : MHFCB8GS5N0123456',
      'Nomor Mesin      : 2GD-8901234',
      'Warna            : Putih Metalik',
      'Bahan Bakar      : Solar',
      'Pemilik          : PT Aplikanusa Lintasarta',
      'Penggunaan       : Operasional Data Center',
      '',
      'RINCIAN PAJAK',
      '',
      'PKB (Pajak Kendaraan Bermotor)       : Rp 7.560.000',
      'SWDKLLJ                              : Rp   143.000',
      'Biaya Administrasi STNK              : Rp   200.000',
      'Biaya Pengesahan STNK                : Rp    50.000',
      'TOTAL                                : Rp 7.953.000',
      '',
      'Masa Berlaku Pajak : 7 Juli 2025 - 7 Juli 2026',
      'Masa Berlaku STNK  : 12 Maret 2022 - 12 Maret 2027',
      '',
      'Samsat Jakarta Selatan',
      'STATUS: WARNING - Jatuh tempo dalam 20 hari',
    ],
  },
  'ins_genset_cat_a': {
    title: 'POLIS ASURANSI PROPERTI DAN MESIN',
    lines: [
      '',
      'Nomor Polis: IAR/KRP/2024/00182',
      'Perusahaan Asuransi: PT Asuransi Sinar Mas',
      '',
      'Tertanggung       : PT Aplikanusa Lintasarta',
      'Objek              : Genset Caterpillar C50 1500 kVA (Backup A)',
      'Serial Number      : CAT-C50-2019-A001',
      'Lokasi             : Gedung Technopark Lintasarta, Jatiluhur',
      'Periode            : 3 Juni 2024 - 3 Juni 2025',
      'Nilai Pertanggungan: Rp 3.200.000.000',
      '',
      'CAKUPAN PERTANGGUNGAN',
      '',
      'Kebakaran dan Ledakan         : Rp 3.200.000.000',
      'Kerusakan Mekanis             : Rp 1.500.000.000',
      'Banjir dan Bencana Alam       : Rp   500.000.000',
      'Business Interruption         : Rp   250.000.000',
      '',
      'Total Premi Tahunan           : Rp 28.800.000',
      '',
      'Broker: PT Marsh Indonesia',
      '',
      'STATUS: EXPIRED - Polis telah berakhir',
    ],
  },
  'pbg_jatiluhur_2020': {
    title: 'PERSETUJUAN BANGUNAN GEDUNG (PBG)',
    lines: [
      '',
      'Nomor PBG: PBG-32.02.1522-004',
      'Pengganti Izin Mendirikan Bangunan (IMB)',
      '',
      'Pemilik          : PT Aplikanusa Lintasarta',
      'Nama Bangunan    : Gedung Technopark Lintasarta Jatiluhur',
      'Lokasi           : Jl. Waduk Jatiluhur, Purwakarta 41152',
      'Fungsi           : Bangunan Komersial - Data Center dan Kantor',
      'Luas Tanah       : 5.200 m2 (SHM No. 1522)',
      'Luas Bangunan    : 2.850 m2 (3 Lantai + Rooftop)',
      'Tanggal Terbit   : 12 April 2020',
      'Masa Berlaku     : 20 Tahun (s/d 12 April 2040)',
      '',
      'DASAR HUKUM',
      '',
      '1. UU No. 28/2002 tentang Bangunan Gedung',
      '2. PP No. 16/2021 tentang Pelaksanaan UU Bangunan Gedung',
      '3. Perda Kab. Purwakarta No. 12/2019 tentang Retribusi IMB',
      '',
      'Penerbit: Pemkab Purwakarta',
      'Bupati: H. Anne Ratna Mustika, S.E., M.M.',
      '',
      'STATUS: VALID',
    ],
  },
  'fire_protection_dc': {
    title: 'IZIN PROTEKSI KEBAKARAN',
    lines: [
      '',
      'Nomor Surat: IPK-32.02-2024-018',
      'Penerbit: Dinas Damkar Purwakarta',
      '',
      'Nama Bangunan    : Gedung Technopark Lintasarta Jatiluhur',
      'Pemilik          : PT Aplikanusa Lintasarta',
      'Klasifikasi      : Risiko Tinggi (Data Center Tier III)',
      'Kapasitas        : Maks. 150 orang',
      'Tanggal Inspeksi : 15 Januari 2024',
      'Masa Berlaku     : 3 Tahun (s/d 14 Januari 2027)',
      '',
      'CHECKLIST INSPEKSI',
      '',
      'Fire Alarm (Addressable)  : 1 Panel + 86 Detektor    LAIK',
      'Sprinkler System          : 128 Head (Wet System)     LAIK',
      'APAR (CO2 dan ABC)        : 24 unit                  LAIK',
      'Hydrant Box Indoor        : 8 unit                   LAIK',
      'Hydrant Pilar Outdoor     : 2 unit                   LAIK',
      'FM-200 Gas Suppression    : 2 zona (Server Room)     LAIK',
      'Emergency Exit            : 12 titik                 LAIK',
      'Tangga Darurat            : 2 unit                   LAIK',
      '',
      'Kepala Dinas Damkar: H. Asep Kurniawan, S.T., M.M.',
      '',
      'STATUS: VALID',
    ],
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const fileName = slug.join('/');

  // Extract document key from path like "legal/slf_jatiluhur_2026.pdf"
  const match = fileName.match(/^legal\/(.+)\.pdf$/);
  if (!match) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const docKey = match[1];
  const doc = DOCUMENTS[docKey];
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const pdfBytes = generatePDF(doc.title, doc.lines);

  return new Response(pdfBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${docKey}.pdf"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
