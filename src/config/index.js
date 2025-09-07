require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/school-payment-db',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Payment Gateway
  pgKey: process.env.PG_KEY,
  pgSecretKey: process.env.PG_SECRET_KEY,
  apiKey: process.env.API_KEY,
  schoolId: process.env.SCHOOL_ID,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
