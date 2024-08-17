const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudflareHelper = require('../helpers/cloudflareHelper');
const cuid = require('cuid');

exports.searchSubdomains = async (name) => {
  const domains = await prisma.Domain.findMany();
  return Promise.all(
    domains.map(async (domain) => {
      const subdomain = await prisma.Subdomain.findFirst({
        where: {
          domainId: domain.id,
          name: name,
        },
      });
      return {
        domain: domain.domain,
        subdomain: name,
        longName: `${name}.${domain.domain}`,
        status: subdomain ? 'taken' : 'available',
      };
    })
  );
};

exports.countSubdomains = async () => {
  return prisma.Subdomain.count();
};

exports.listSubdomains = async (limit, offset) => {
  return prisma.Subdomain.findMany({
    skip: offset,
    take: limit,
    include: {
      domain: true,
    },
    orderBy: {
      created: 'desc',
    },
  });
};

exports.createSubdomain = async (domain, name, content, type) => {
  const domainExists = await prisma.Domain.findFirst({ where: { domain } });
  if (!domainExists) {
    return { success: false, status: 404, message: 'Domain not found.' };
  }

  const subdomain = await prisma.Subdomain.findMany({
    where: { domainId: domainExists.id, name },
  });

  if (subdomain.length > 0) {
    return { success: false, status: 400, message: 'Subdomain already exists.' };
  }

  const recordId = cuid();
  const cloudFlare = await cloudflareHelper.addDnsRecord(
    domainExists.zoneId,
    content,
    name,
    type,
    recordId
  );
  if (cloudFlare.errors) {
    return { success: false, status: 400, message: cloudFlare.errors[0].message };
  }

  const securityCode = require('../helpers/utilities').generateRandomSecurityCode();
  const newSubdomain = await prisma.Subdomain.create({
    data: {
      id: cloudFlare.id,
      name: cloudFlare.name,
      domainId: domainExists.id,
      content: cloudFlare.content,
      type: cloudFlare.type,
      securityCode,
    },
  });

  return { success: true, data: newSubdomain };
};

exports.updateSubdomain = async (prevSubdomain, name, content, type, securityCode) => {
  const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)*([a-z0-9-]+\.[a-z]{2,})$/;
  const match = prevSubdomain.match(domainRegex);
  if (!match) {
    return { success: false, status: 400, message: 'Invalid domain format.' };
  }

  const subdomain = match[1] ? match[1].slice(0, -1) : '';
  const domain = match[2];

  const domainExists = await prisma.Domain.findFirst({
    where: { domain },
  });
  if (!domainExists) {
    return { success: false, status: 404, message: 'Domain not found.' };
  }

  const subdomainExist = await prisma.Subdomain.findFirst({
    where: {
      domainId: domainExists.id,
      name: `${subdomain}.${domain}`,
      securityCode,
    },
  });
  if (!subdomainExist) {
    return {
      success: false,
      status: 404,
      message: 'Subdomain not found or invalid security code.',
    };
  }

  const cloudFlare = await cloudflareHelper.updateDnsRecord(
    domainExists.zoneId,
    content || subdomainExist.content,
    name || subdomainExist.name,
    type || subdomainExist.type,
    subdomainExist.id
  );
  if (cloudFlare.errors) {
    return { success: false, status: 400, message: cloudFlare.errors[0].message };
  }

  const updatedSubdomain = await prisma.Subdomain.update({
    where: { id: subdomainExist.id },
    data: {
      name: name ? cloudFlare.name : subdomainExist.name,
      content: content ? cloudFlare.content : subdomainExist.content,
      type: type ? cloudFlare.type : subdomainExist.type,
    },
  });

  return { success: true, data: updatedSubdomain };
};

exports.deleteSubdomain = async (prevSubdomain, securityCode) => {
  const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)*([a-z0-9-]+\.[a-z]{2,})$/;
  const match = prevSubdomain.match(domainRegex);
  if (!match) {
    return { success: false, status: 400, message: 'Invalid domain format.' };
  }

  const subdomain = match[1] ? match[1].slice(0, -1) : '';
  const domain = match[2];

  const domainExists = await prisma.Domain.findFirst({
    where: { domain },
  });
  if (!domainExists) {
    return { success: false, status: 404, message: 'Domain not found.' };
  }

  const subdomainExist = await prisma.Subdomain.findFirst({
    where: {
      domainId: domainExists.id,
      name: `${subdomain}.${domain}`,
      securityCode,
    },
  });
  if (!subdomainExist) {
    return {
      success: false,
      status: 404,
      message: 'Subdomain not found or invalid security code.',
    };
  }

  const cloudFlare = await cloudflareHelper.deleteDnsRecord(domainExists.zoneId, subdomainExist.id);
  if (cloudFlare.errors) {
    return { success: false, status: 400, message: cloudFlare.errors[0].message };
  }

  await prisma.Subdomain.delete({
    where: { id: subdomainExist.id },
  });

  return { success: true };
};

exports.getSubdomainById = async (id) => {
  return prisma.Subdomain.findUnique({
    where: { id },
  });
};

exports.getSubdomainByIdAndSecurityCode = async (id, securityCode) => {
  return prisma.Subdomain.findFirst({
    where: {
      id,
      securityCode,
    },
    include: {
      domain: true,
    },
  });
};

exports.deleteSubdomainById = async (id) => {
  return prisma.Subdomain.delete({
    where: { id },
  });
};
