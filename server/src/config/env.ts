import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  SERVER_PORT: parseInt(process.env.SERVER_PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
} as const;
