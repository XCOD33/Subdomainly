const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudflareHelper = require('../helpers/cloudflareHelper');
const cuid = require('cuid');

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

function generateRandomSecurityCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

exports.search = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Domain and name are required.',
      });
    }

    const nameRegex = /^(?!-)[a-z0-9-]+(?<!-)$/;

    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name format. Only lowercase a-z, 0-9, and hyphen are allowed.',
      });
    }

    if (name.length > 256) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain too long.',
      });
    }

    const domains = await prisma.Domain.findMany();
    const results = [];
    for (const domain of domains) {
      const subdomain = await prisma.Subdomain.findFirst({
        where: {
          domainId: domain.id,
          name: name,
        },
      });

      if (subdomain) {
        results.push({
          domain: domain.domain,
          subdomain: name,
          longName: `${name}.${domain.domain}`,
          status: 'taken',
        });
      } else {
        results.push({
          domain: domain.domain,
          subdomain: name,
          longName: `${name}.${domain.domain}`,
          status: 'available',
        });
      }
    }

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
};

exports.create = async (req, res) => {
  try {
    const { domain, name, content, type } = req.body;

    if (!domain || !name || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Domain, name, content, and type are required.',
      });
    }

    const nameRegex = /^(?!-)[a-z0-9-]+(?<!-)$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name format. Only lowercase a-z, 0-9, and hyphen are allowed.',
      });
    }
    if (name.length > 256) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain too long.',
      });
    }
    if (!isPublicIP(content)) {
      return res.status(400).json({
        success: false,
        message: 'Content must be a valid IP address.',
      });
    }
    if (type !== 'A' && type !== 'AAAA' && type !== 'CNAME') {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Only A, AAAA, and CNAME are allowed.',
      });
    }

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
};

exports.update = async (req, res) => {
  try {
    const { prevSubdomain, name, content, type, securityCode } = req.body;
    if (!prevSubdomain || !securityCode) {
      return res.status(400).json({
        success: false,
        message: 'prevSubdomain and securityCode are required.',
      });
    }

    let newName = null;
    if (name) {
      const nameRegex = /^(?!-)[a-z0-9-]+(?<!-)$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid name format. Only lowercase a-z, 0-9, and hyphen are allowed.',
        });
      }
      if (name.length > 256) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain too long.',
        });
      }
      newName = name;
    }
    let newContent = null;
    if (content) {
      if (!isPublicIP(content)) {
        return res.status(400).json({
          success: false,
          message: 'Content must be a valid IP address.',
        });
      }
      newContent = content;
    }
    let newType = null;
    if (type) {
      if (type !== 'A' && type !== 'AAAA' && type !== 'CNAME') {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Only A, AAAA, and CNAME are allowed.',
        });
      }
      newType = type;
    }

    const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)*([a-z0-9-]+\.[a-z]{2,})$/;
    const match = prevSubdomain.match(domainRegex);
    let subdomain = null;
    let domain = null;
    if (match) {
      subdomain = match[1] ? match[1].slice(0, -1) : '';
      domain = match[2];
    } else {
      throw new Error('Invalid domain format.');
    }
    console.log(subdomain, domain);

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
      newContent,
      newName,
      newType,
      subdomainExist.id
    );
    if (cloudFlare.errors) {
      return res.status(400).json({
        success: false,
        message: cloudFlare.errors[0].message,
      });
    }
    const newSubdomain = await prisma.Subdomain.update({
      where: {
        id: subdomainExist.id,
      },
      data: {
        name: newName ? cloudFlare.name : `${subdomain}.${domain}`,
        content: newContent ? cloudFlare.content : subdomainExist.content,
        type: newType ? cloudFlare.type : subdomainExist.type,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Subdomain updated.',
      data: {
        name: newSubdomain.name,
        content: newSubdomain.content,
        type: newSubdomain.type,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { prevSubdomain, securityCode } = req.body;
    if (!prevSubdomain || !securityCode) {
      return res.status(400).json({
        success: false,
        message: 'prevSubdomain and securityCode are required.',
      });
    }

    const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)*([a-z0-9-]+\.[a-z]{2,})$/;
    const match = prevSubdomain.match(domainRegex);
    let subdomain = null;
    let domain = null;
    if (match) {
      subdomain = match[1] ? match[1].slice(0, -1) : '';
      domain = match[2];
    } else {
      throw new Error('Invalid domain format.');
    }

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
};

exports.addDomain = async (req, res) => {
  try {
    const { domain, zoneId } = req.body;

    if (!domain || !zoneId) {
      return res.status(400).json({
        success: false,
        message: 'Domain and zoneId is required.',
      });
    }

    const domainExists = await prisma.Domain.findFirst({
      where: {
        domain: domain,
      },
    });

    if (domainExists) {
      return res.status(400).json({
        success: false,
        message: 'Domain already exists.',
      });
    }

    const listDnsRecords = await cloudflareHelper.listDnsRecords(zoneId);
    if (listDnsRecords.length < 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch DNS records.',
      });
    } else if (listDnsRecords.length > 0) {
      is_correct_zone = false;
      for (const record of listDnsRecords) {
        if (record.zone_name === domain) {
          is_correct_zone = true;
        }
      }
      if (is_correct_zone) {
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
      } else {
        return res.status(400).json({
          success: false,
          message: 'Domain not found in the specified zone.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'ZoneId is invalid.',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
