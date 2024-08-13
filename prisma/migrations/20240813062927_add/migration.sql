/*
  Warnings:

  - You are about to drop the `DNSRecords` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DNSRecords";

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subdomain" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ttl" INTEGER NOT NULL,
    "priority" INTEGER,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subdomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subdomain_domainId_key" ON "Subdomain"("domainId");

-- AddForeignKey
ALTER TABLE "Subdomain" ADD CONSTRAINT "Subdomain_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
