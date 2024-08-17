const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudflareHelper = require('../helpers/cloudflareHelper');
const cuid = require('cuid');
const Joi = require('joi');

// utility functions to validate IP address is public
function isPublicIP(ip) {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))|::|([0-9a-fA-F]{1,4}:){1,7}:$/;

  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);

    if (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254)
    ) {
      return false;
    }
    return true;
  } else if (ipv6Regex.test(ip)) {
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80') || ip === '::1') {
      return false;
    }
    return true;
  }
  return false;
}

// utility function to generate random security code
function generateRandomSecurityCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Joi schema for searching subdomain
const searchSubdomainSchema = Joi.object({
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .required(),
});

// Joi schema for creating subdomain
const createSubdomainSchema = Joi.object({
  domain: Joi.string().required(),
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .required(),
  content: Joi.string()
    .custom((value, helpers) => {
      if (!isPublicIP(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required(),
  type: Joi.string().valid('A', 'AAAA', 'CNAME').required(),
});

// Joi schema for updating subdomain
const updateSubdomainSchema = Joi.object({
  prevSubdomain: Joi.string().required(),
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .optional(),
  content: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (!isPublicIP(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  type: Joi.string().valid('A', 'AAAA', 'CNAME').optional(),
  securityCode: Joi.string().required(),
});

// Joi schema for deleting subdomain
const deleteSubdomainSchema = Joi.object({
  prevSubdomain: Joi.string().required(),
  securityCode: Joi.string().required(),
});

// Joi schema for adding domain
const addDomainSchema = Joi.object({
  domain: Joi.string().required(),
  zoneId: Joi.string().required(),
});

// middleware to validate request body
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
}

// search subdomain
exports.search = [
  validateRequest(searchSubdomainSchema),
  async (req, res) => {
    try {
      const { name } = req.body;

      const domains = await prisma.Domain.findMany();
      const results = await Promise.all(
        domains.map(async (domain) => {
          const subdomain = await prisma.Subdomain.findFirst({
            where: {
              domainId: domain.id,
              name: {
                contains: name,
              },
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

      return res.status(200).json({
        success: true,
        message: 'Subdomain status fetched successfully.',
        data: results,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  },
];

// create subdomain
exports.create = [
  validateRequest(createSubdomainSchema),
  async (req, res) => {
    try {
      const { domain, name, content, type } = req.body;

      const domainExists = await prisma.Domain.findFirst({
        where: { domain },
      });
      if (!domainExists) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found.',
        });
      }

      const subdomain = await prisma.Subdomain.findMany({
        where: {
          domainId: domainExists.id,
          name: {
            contains: name,
          },
        },
      });

      if (subdomain.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain already exists.',
        });
      }

      recordId = cuid();
      const cloudFlare = await cloudflareHelper.addDnsRecord(
        domainExists.zoneId,
        content,
        name,
        type,
        recordId
      );
      if (cloudFlare.errors) {
        return res.status(400).json({
          success: false,
          message: cloudFlare.errors[0].message,
        });
      }

      const securityCode = generateRandomSecurityCode();
      const newSubdomain = await prisma.Subdomain.create({
        data: {
          id: cloudFlare.id,
          name: cloudFlare.name,
          domainId: domainExists.id,
          content: cloudFlare.content,
          type: cloudFlare.type,
          securityCode: securityCode,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Subdomain created.',
        data: newSubdomain,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  },
];

exports.update = [
  validateRequest(updateSubdomainSchema),
  async (req, res) => {
    try {
      const { prevSubdomain, name, content, type, securityCode } = req.body;

      const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)*([a-z0-9-]+\.[a-z]{2,})$/;
      const match = prevSubdomain.match(domainRegex);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Invalid domain format.',
        });
      }

      const subdomain = match[1] ? match[1].slice(0, -1) : '';
      const domain = match[2];

      const domainExists = await prisma.Domain.findFirst({
        where: {
          domain: domain,
        },
      });
      if (!domainExists) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found.',
        });
      }

      const subdomainExist = await prisma.Subdomain.findFirst({
        where: {
          domainId: domainExists.id,
          name: `${subdomain}.${domain}`,
          securityCode: securityCode,
        },
      });
      if (!subdomainExist) {
        return res.status(404).json({
          success: false,
          message: 'Subdomain not found or invalid security code.',
        });
      }

      const cloudFlare = await cloudflareHelper.updateDnsRecord(
        domainExists.zoneId,
        content || subdomainExist.content,
        name || subdomainExist.name,
        type || subdomainExist.type,
        subdomainExist.id
      );
      if (cloudFlare.errors) {
        return res.status(400).json({
          success: false,
          message: cloudFlare.errors[0].message,
        });
      }

      const updatedSubdomain = await prisma.Subdomain.update({
        where: {
          id: subdomainExist.id,
        },
        data: {
          name: name ? cloudFlare.name : subdomainExist.name,
          content: content ? cloudFlare.content : subdomainExist.content,
          type: type ? cloudFlare.type : subdomainExist.type,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Subdomain updated.',
        data: updatedSubdomain,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  },
];

exports.delete = [
  validateRequest(deleteSubdomainSchema),
  async (req, res) => {
    try {
      const { prevSubdomain, securityCode } = req.body;

      const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)*([a-z0-9-]+\.[a-z]{2,})$/;
      const match = prevSubdomain.match(domainRegex);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Invalid domain format.',
        });
      }

      const subdomain = match[1] ? match[1].slice(0, -1) : '';
      const domain = match[2];

      const domainExists = await prisma.Domain.findFirst({
        where: { domain },
      });
      if (!domainExists) {
        return res.status(404).json({
          success: false,
          message: 'Domain not found.',
        });
      }

      const subdomainExist = await prisma.Subdomain.findFirst({
        where: {
          domainId: domainExists.id,
          name: `${subdomain}.${domain}`,
          securityCode,
        },
      });
      if (!subdomainExist) {
        return res.status(404).json({
          success: false,
          message: 'Subdomain not found or invalid security code.',
        });
      }

      const cloudFlare = await cloudflareHelper.deleteDnsRecord(
        domainExists.zoneId,
        subdomainExist.id
      );
      if (cloudFlare.errors) {
        return res.status(400).json({
          success: false,
          message: cloudFlare.errors[0].message,
        });
      }

      await prisma.Subdomain.delete({
        where: {
          id: subdomainExist.id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Subdomain deleted.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  },
];

exports.addDomain = [
  validateRequest(addDomainSchema),
  async (req, res) => {
    try {
      const { domain, zoneId } = req.body;

      const domainExists = await prisma.Domain.findFirst({
        where: { domain },
      });
      if (domainExists) {
        return res.status(400).json({
          success: false,
          message: 'Domain already exists.',
        });
      }

      const listDnsRecords = await cloudflareHelper.listDnsRecords(zoneId);
      if (listDnsRecords.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'ZoneId is invalid.',
        });
      }

      const isCorrectZone = listDnsRecords.some((record) => record.zone_name === domain);
      if (!isCorrectZone) {
        return res.status(400).json({
          success: false,
          message: 'Domain not found in the zone.',
        });
      }

      const newDomain = await prisma.Domain.create({
        data: {
          domain,
          zoneId,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Domain created.',
        data: newDomain,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  },
];
