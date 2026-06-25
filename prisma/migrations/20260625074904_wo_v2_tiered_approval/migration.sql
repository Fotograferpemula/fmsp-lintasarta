/*
  Warnings:

  - You are about to drop the column `approvalStatus` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `work_orders` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `work_orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "work_orders_approvalStatus_idx";

-- AlterTable
ALTER TABLE "work_orders" DROP COLUMN "approvalStatus",
DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
ADD COLUMN     "actualCost" DOUBLE PRECISION,
ADD COLUMN     "approvalLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "approvedL1At" TIMESTAMP(3),
ADD COLUMN     "approvedL1By" TEXT,
ADD COLUMN     "approvedL2At" TIMESTAMP(3),
ADD COLUMN     "approvedL2By" TEXT,
ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "escalationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "parentWoId" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "wo_approval_configs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requireL1" BOOLEAN NOT NULL DEFAULT true,
    "l1Roles" TEXT[] DEFAULT ARRAY['admin_lokasi', 'admin_regional']::TEXT[],
    "requireL2" BOOLEAN NOT NULL DEFAULT false,
    "l2Roles" TEXT[] DEFAULT ARRAY['manager_fms', 'admin_pusat']::TEXT[],
    "l2Priorities" TEXT[] DEFAULT ARRAY['critical', 'high']::TEXT[],
    "autoApproveBelow" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wo_approval_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wo_sla_configs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "responseMinutes" INTEGER NOT NULL,
    "resolveMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wo_sla_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wo_approval_configs_category_key" ON "wo_approval_configs"("category");

-- CreateIndex
CREATE UNIQUE INDEX "wo_sla_configs_category_region_priority_key" ON "wo_sla_configs"("category", "region", "priority");

-- CreateIndex
CREATE INDEX "work_orders_category_idx" ON "work_orders"("category");

-- CreateIndex
CREATE INDEX "work_orders_approvalLevel_idx" ON "work_orders"("approvalLevel");

-- CreateIndex
CREATE INDEX "work_orders_parentWoId_idx" ON "work_orders"("parentWoId");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_parentWoId_fkey" FOREIGN KEY ("parentWoId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
