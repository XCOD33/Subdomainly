const { PrismaClient } = require('@prisma/client');

console.log('prismaClient.js');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

module.exports = prisma;
