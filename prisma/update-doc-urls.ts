import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TYPE_TO_PDF: Record<string, string> = {
  slf: '/api/docs/legal/slf_jatiluhur_2026.pdf',
  tax_vehicle: '/api/docs/legal/pkb_hilux_2026.pdf',
  insurance: '/api/docs/legal/ins_genset_cat_a.pdf',
  pbg_imb: '/api/docs/legal/pbg_jatiluhur_2020.pdf',
  fire_protection: '/api/docs/legal/fire_protection_dc.pdf',
};

async function main() {
  const docs = await prisma.legalDocument.findMany();
  console.log(`Found ${docs.length} legal documents`);
  for (const doc of docs) {
    const newUrl = TYPE_TO_PDF[doc.documentType] || '/api/docs/legal/slf_jatiluhur_2026.pdf';
    if (doc.documentUrl !== newUrl) {
      await prisma.legalDocument.update({ where: { id: doc.id }, data: { documentUrl: newUrl } });
      console.log(`✅ ${doc.title} → ${newUrl}`);
    } else {
      console.log(`⏭️  ${doc.title} — already correct`);
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
