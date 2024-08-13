/*
  Warnings:

  - You are about to drop the column `priority` on the `Subdomain` table. All the data in the column will be lost.
  - You are about to drop the column `ttl` on the `Subdomain` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subdomain" DROP COLUMN "priority",
DROP COLUMN "ttl";
