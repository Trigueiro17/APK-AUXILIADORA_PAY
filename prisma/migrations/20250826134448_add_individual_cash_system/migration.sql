/*
  Warnings:

  - Added the required column `cashSessionId` to the `cash_registers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `cash_registers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CashSessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CONSOLIDATED');

-- AlterTable
ALTER TABLE "public"."cash_registers" ADD COLUMN     "cashSessionId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."cash_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "closingAmount" DECIMAL(10,2),
    "status" "public"."CashSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isConsolidated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consolidated_data" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSales" DECIMAL(10,2) NOT NULL,
    "totalCash" DECIMAL(10,2) NOT NULL,
    "totalCard" DECIMAL(10,2) NOT NULL,
    "totalPix" DECIMAL(10,2) NOT NULL,
    "salesCount" INTEGER NOT NULL,
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "closingAmount" DECIMAL(10,2) NOT NULL,
    "consolidatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidated_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consolidated_data_cashSessionId_key" ON "public"."consolidated_data"("cashSessionId");

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_registers" ADD CONSTRAINT "cash_registers_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consolidated_data" ADD CONSTRAINT "consolidated_data_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "public"."cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consolidated_data" ADD CONSTRAINT "consolidated_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
