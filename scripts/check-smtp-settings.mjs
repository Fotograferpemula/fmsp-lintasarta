import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.appSetting.findMany({
    where: { key: { startsWith: 'smtp_' } }
  });
  console.log('SMTP DB Settings:', settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
