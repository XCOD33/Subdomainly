/*
  Warnings:

  - You are about to drop the column `security_code` on the `Subdomain` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[securityCode]` on the table `Subdomain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `securityCode` to the `Subdomain` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subdomain_security_code_key";

-- AlterTable
ALTER TABLE "Subdomain" DROP COLUMN "security_code",
ADD COLUMN     "securityCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subdomain_securityCode_key" ON "Subdomain"("securityCode");
