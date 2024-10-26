const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.find(email);
    const isPasswordMatch = await bcrypt.compare(password, user ? user.password : '');
    if (!user || !isPasswordMatch) {
      {
        throw new Error('Invalid login credentials');
      }
    }
    const token = jwt.sign(
      {
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { token },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};
