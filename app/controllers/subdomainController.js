const prisma = require('../models/subdomain');
const jwt = require('jsonwebtoken');
const cloudflareHelper = require('../helpers/cloudflareHelper');

exports.search = async (req, res) => {
  try {
    const { name } = req.body;
    const results = await prisma.searchSubdomains(name);
    res.status(200).json({
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

exports.list = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 15;
    const offset = (page - 1) * limit;

    const totalSubdomains = await prisma.countSubdomains();
    const subdomains = await prisma.listSubdomains(limit, offset);

    const results = subdomains.map((subdomain) => ({
      id: subdomain.id,
      name: subdomain.name,
      domain: subdomain.domain.domain,
    }));

    return res.status(200).json({
      success: true,
      message: 'List of subdomains fetched successfully.',
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSubdomains / limit),
        totalItems: totalSubdomains,
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

exports.create = async (req, res) => {
  try {
    const { domain, name, content, type } = req.body;
    const newSubdomain = await prisma.createSubdomain(domain, name, content, type);
    if (newSubdomain.success) {
      return res.status(201).json({
        success: true,
        message: 'Subdomain created.',
        data: newSubdomain.data,
      });
    } else {
      return res.status(newSubdomain.status).json({
        success: false,
        message: newSubdomain.message,
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

exports.update = async (req, res) => {
  try {
    const { prevSubdomain, name, content, type, securityCode } = req.body;
    const updatedSubdomain = await prisma.updateSubdomain(
      prevSubdomain,
      name,
      content,
      type,
      securityCode
    );
    if (updatedSubdomain.success) {
      return res.status(200).json({
        success: true,
        message: 'Subdomain updated.',
        data: updatedSubdomain.data,
      });
    } else {
      return res.status(updatedSubdomain.status).json({
        success: false,
        message: updatedSubdomain.message,
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

exports.delete = async (req, res) => {
  try {
    const { prevSubdomain, securityCode } = req.body;
    const deletionResult = await prisma.deleteSubdomain(prevSubdomain, securityCode);
    if (deletionResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Subdomain deleted.',
      });
    } else {
      return res.status(deletionResult.status).json({
        success: false,
        message: deletionResult.message,
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

exports.report = async (req, res) => {
  try {
    const { id, reason } = req.body;

    const subdomain = await prisma.getSubdomainById(id);
    if (!subdomain) {
      return res.status(404).json({
        success: false,
        message: 'Subdomain not found.',
      });
    }

    const secret = jwt.sign(
      {
        id: subdomain.id,
        securityCode: subdomain.securityCode,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    console.log(`Subdomain ${subdomain.name} reported: ${reason} - Secret: ${secret}`);

    return res.status(200).json({
      success: true,
      message: 'Subdomain reported successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

exports.deleteWithSecret = async (req, res) => {
  try {
    const { secret } = req.body;
    if (!secret) {
      return res.status(400).json({
        success: false,
        message: 'Secret is required.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(secret, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired secret.',
      });
    }

    const { id, securityCode } = decoded;

    const subdomain = await prisma.getSubdomainByIdAndSecurityCode(id, securityCode);
    if (!subdomain) {
      return res.status(404).json({
        success: false,
        message: 'Subdomain not found or invalid security code.',
      });
    }

    const cloudFlare = await cloudflareHelper.deleteDnsRecord(
      subdomain.domain.zoneId,
      subdomain.id
    );
    if (cloudFlare.errors) {
      return res.status(400).json({
        success: false,
        message: cloudFlare.errors[0].message,
      });
    }

    await prisma.deleteSubdomainById(subdomain.id);

    return res.status(200).json({
      success: true,
      message: 'Subdomain deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
