import dotenv from 'dotenv';
import { chapaConfig } from './chapa';
import { corsConfig } from './cors';
import { dbConfig } from './db';
import { swaggerConfig } from './swagger';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  db: dbConfig,
  cors: corsConfig,
  swagger: swaggerConfig,
  chapa: chapaConfig,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default config;
