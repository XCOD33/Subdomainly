const prisma = require('../models/domain');
const cloudflareHelper = require('../helpers/cloudflareHelper');

exports.addDomain = async (req, res) => {
  try {
    const { domain, zoneId } = req.body;
    const newDomain = await prisma.addDomain(domain, zoneId);
    if (newDomain.success) {
      return res.status(201).json({
        success: true,
        message: 'Domain created.',
        data: newDomain.data,
      });
    } else {
      return res.status(newDomain.status).json({
        success: false,
        message: newDomain.message,
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
