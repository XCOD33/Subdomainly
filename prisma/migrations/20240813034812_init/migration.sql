-- CreateTable
CREATE TABLE "DNSRecords" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ttl" INTEGER NOT NULL,
    "priority" INTEGER,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DNSRecords_pkey" PRIMARY KEY ("id")
);
