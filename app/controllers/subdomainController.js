const prisma = require('../models/subdomain');

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
