import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  jwtSecret: process.env.JWT_SECRET || 'nexus_fleetops_jwt_secret_key_2026_secure',
  nodeEnv: process.env.NODE_ENV || 'development',
};
