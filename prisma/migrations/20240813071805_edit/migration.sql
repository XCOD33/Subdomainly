/*
  Warnings:

  - A unique constraint covering the columns `[security_code]` on the table `Subdomain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `security_code` to the `Subdomain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subdomain" ADD COLUMN     "security_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subdomain_security_code_key" ON "Subdomain"("security_code");
