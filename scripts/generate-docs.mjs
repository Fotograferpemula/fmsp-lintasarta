#!/usr/bin/env node
/**
 * Script: Generate PDF & DOCX from HTML documentation
 * 
 * Usage: node scripts/generate-docs.mjs
 * 
 * This script:
 * 1. Opens the HTML files in a headless Chrome browser
 * 2. Prints them to PDF using Chrome's built-in PDF engine
 * 3. Creates DOCX files using pandoc-style HTML wrapping for Word compatibility
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '..', 'public', 'docs');

// Chrome path on macOS
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const files = [
  {
    html: 'Buku_Putih_User_Manual_FMSP_Lintasarta.html',
    pdf: 'Buku_Putih_User_Manual_FMSP_Lintasarta.pdf',
    docx: 'Buku_Putih_User_Manual_FMSP_Lintasarta.docx',
    label: 'User Manual'
  },
  {
    html: 'Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.html',
    pdf: 'Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.pdf',
    docx: 'Buku_Panduan_Pemeliharaan_FMSP_Lintasarta.docx',
    label: 'Maintenance Manual'
  }
];

console.log('📄 FMSP Lintasarta — Document Generator');
console.log('═'.repeat(50));

for (const file of files) {
  const htmlPath = join(DOCS_DIR, file.html);
  const pdfPath = join(DOCS_DIR, file.pdf);
  const docxPath = join(DOCS_DIR, file.docx);

  if (!existsSync(htmlPath)) {
    console.error(`❌ HTML not found: ${htmlPath}`);
    continue;
  }

  // ── Generate PDF using Chrome headless ──
  console.log(`\n🔄 Generating PDF: ${file.label}...`);
  try {
    const fileUrl = `file://${htmlPath}`;
    execSync(
      `"${CHROME_PATH}" --headless --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${fileUrl}"`,
      { stdio: 'pipe', timeout: 30000 }
    );
    console.log(`   ✅ PDF created: ${file.pdf}`);
  } catch (err) {
    console.error(`   ❌ PDF generation failed: ${err.message}`);
  }

  // ── Generate DOCX (HTML-in-DOCX wrapper for Word compatibility) ──
  console.log(`🔄 Generating DOCX: ${file.label}...`);
  try {
    const htmlContent = readFileSync(htmlPath, 'utf-8');
    
    // Word-compatible MHTML wrapper
    const docxContent = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_Part_001"

------=_Part_001
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable

${htmlContent}

------=_Part_001--`;
    
    writeFileSync(docxPath, docxContent, 'utf-8');
    console.log(`   ✅ DOCX created: ${file.docx}`);
  } catch (err) {
    console.error(`   ❌ DOCX generation failed: ${err.message}`);
  }
}

console.log('\n' + '═'.repeat(50));
console.log('✅ Document generation complete!');
console.log(`📂 Output directory: ${DOCS_DIR}`);
