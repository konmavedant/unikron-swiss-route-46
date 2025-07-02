/*
  Warnings:

  - The primary key for the `FeeSplit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `settledAt` on the `FeeSplit` table. All the data in the column will be lost.
  - The `id` column on the `FeeSplit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TradeIntent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `TradeIntent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `intentId` on the `FeeSplit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `intentId` on the `SwapCommit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `intentId` on the `SwapReveal` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "FeeSplit" DROP CONSTRAINT "FeeSplit_intentId_fkey";

-- DropForeignKey
ALTER TABLE "SwapCommit" DROP CONSTRAINT "SwapCommit_intentId_fkey";

-- DropForeignKey
ALTER TABLE "SwapReveal" DROP CONSTRAINT "SwapReveal_intentId_fkey";

-- AlterTable
ALTER TABLE "FeeSplit" DROP CONSTRAINT "FeeSplit_pkey",
DROP COLUMN "settledAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "intentId",
ADD COLUMN     "intentId" INTEGER NOT NULL,
ADD CONSTRAINT "FeeSplit_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SwapCommit" DROP COLUMN "intentId",
ADD COLUMN     "intentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SwapReveal" DROP COLUMN "intentId",
ADD COLUMN     "intentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TradeIntent" DROP CONSTRAINT "TradeIntent_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "TradeIntent_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeSplit_intentId_key" ON "FeeSplit"("intentId");

-- CreateIndex
CREATE UNIQUE INDEX "SwapCommit_intentId_key" ON "SwapCommit"("intentId");

-- CreateIndex
CREATE UNIQUE INDEX "SwapReveal_intentId_key" ON "SwapReveal"("intentId");

-- AddForeignKey
ALTER TABLE "SwapCommit" ADD CONSTRAINT "SwapCommit_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "TradeIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapReveal" ADD CONSTRAINT "SwapReveal_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "TradeIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSplit" ADD CONSTRAINT "FeeSplit_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "TradeIntent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
