const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const domainModel = require('../models/domain');
const subdomainModel = require('../models/subdomain');

exports.getAllDomain = async (req, res) => {
  try {
    const domains = await prisma.domain.findMany();
    res.status(200).json({
      status: 'success',
      data: {
        domains,
      },
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err,
    });
  }
};

exports.storeDomain = async (req, res) => {
  try {
    const { domain, zoneId } = req.body;
    const result = await domainModel.addDomain(domain, zoneId);
    if (!result.success) {
      console.log(result.message);
      throw new Error(result.message);
    }
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};

exports.deleteDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const result = await prisma.domain.findFirst({ where: { domain } });
    if (!result) {
      throw new Error('Domain not found');
    }
    await prisma.domain.delete({ where: { id: result.id } });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};

exports.getAllSubdomain = async (req, res) => {
  try {
    const subdomains = await prisma.subdomain.findMany();
    res.status(200).json({
      status: 'success',
      data: subdomains,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err,
    });
  }
};

exports.getSubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const result = await prisma.subdomain.findFirst({ where: { name: subdomain } });
    if (!result) {
      throw new Error('Subdomain not found');
    }
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};

exports.storeSubdomain = async (req, res) => {
  try {
    const { domain, subdomain, type, content } = req.body;
    const result = await subdomainModel.createSubdomain(domain, subdomain, content, type);
    if (!result.success) {
      throw new Error(result.message);
    }
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};

exports.updateSubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { type, content } = req.body;
    const result = await prisma.subdomain.findFirst({ where: { name: subdomain } });
    if (!result) {
      throw new Error('Subdomain not found');
    }
    const newResult = await subdomainModel.updateSubdomain(
      result.name,
      result.name,
      content,
      type,
      result.securityCode
    );

    res.status(200).json({
      success: true,
      data: newResult,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};

exports.deleteSubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const result = await prisma.subdomain.findFirst({ where: { name: subdomain } });
    if (!result) {
      throw new Error('Subdomain not found');
    }
    await subdomainModel.deleteSubdomain(result.name, result.securityCode);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};
