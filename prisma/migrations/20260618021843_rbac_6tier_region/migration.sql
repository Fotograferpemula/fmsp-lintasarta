-- AlterTable
ALTER TABLE "users" ADD COLUMN     "region" TEXT,
ALTER COLUMN "role" SET DEFAULT 'user';
