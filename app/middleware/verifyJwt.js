const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      throw new Error('Unauthorized');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new Error('Token is invalid');
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

module.exports = verifyJWT;
