module.exports = {
  dbUrl: process.env.DB_URL || 'mongodb://localhost:27017/example',
  secretKey: process.env.SECRET_KEY || 'secret',
};
