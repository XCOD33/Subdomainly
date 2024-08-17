const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudflareHelper = require('../helpers/cloudflareHelper');

exports.addDomain = async (domain, zoneId) => {
  const domainExists = await prisma.Domain.findFirst({ where: { domain } });
  if (domainExists) {
    return { success: false, status: 400, message: 'Domain already exists.' };
  }

  const listDnsRecords = await cloudflareHelper.listDnsRecords(zoneId);
  if (listDnsRecords.length === 0) {
    return { success: false, status: 400, message: 'ZoneId is invalid.' };
  }

  const isCorrectZone = listDnsRecords.some((record) => record.zone_name === domain);
  if (!isCorrectZone) {
    return { success: false, status: 400, message: 'Domain not found in the specified zone.' };
  }

  const newDomain = await prisma.Domain.create({
    data: { domain, zoneId },
  });

  return { success: true, data: newDomain };
};
