require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '12h',
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
  NODE_ENV: process.env.NODE_ENV || 'development',
};