const blockedNameModel = require('../models/blockedname');
const jwt = require('jsonwebtoken');

exports.lists = async (req, res) => {
  // get from file blockedSubdomains.json
  try {
    const blockedSubdomains = await blockedNameModel.getAll();
    return res.status(200).json({
      success: true,
      message: 'Blocked subdomains retrieved.',
      data: blockedSubdomains,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

exports.add = async (req, res) => {
  try {
    const { secret } = req.query;

    let decoded;
    try {
      decoded = jwt.verify(secret, process.env.JWT_SECRET);
      console.log(decoded);
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired secret.',
      });
    }

    const { name, reason } = decoded;

    const blockedName = await blockedNameModel.store(name, reason);
    return res.status(201).json({
      success: true,
      message: 'Blocked name added successfully.',
      data: blockedName,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
