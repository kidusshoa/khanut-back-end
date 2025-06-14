import dotenv from "dotenv";
import { chapaConfig } from "./chapa";
import { corsMiddleware } from "./cors";
import { connectDB } from "./db";
import { swaggerSpec } from "./swagger";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  db: connectDB,
  cors: corsMiddleware,
  swagger: swaggerSpec,
  chapa: chapaConfig,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

export default config;
