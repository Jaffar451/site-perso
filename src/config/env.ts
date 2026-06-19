// PATH: src/config/env.ts
import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement depuis .env
dotenv.config();

const requiredEnv = (key: string, fallback?: string): string => {
  const val = process.env[key] || fallback;
  if (!val) {
    console.error(`FATAL: Variable d'environnement ${key} manquante`);
    if (process.env.NODE_ENV === "production") process.exit(1);
    return "DEV_ONLY_INSECURE_" + key;
  }
  return val;
};

const ALLOWED_ORIGINS = [
  "https://justice-mobile-web.vercel.app",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:3000",
];

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),

  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "justice_db",
  },

  jwt: {
    secret: requiredEnv("JWT_SECRET"),
    expiration: process.env.JWT_EXPIRATION || "24h",
    refreshSecret: requiredEnv("JWT_REFRESH_SECRET", process.env.REFRESH_SECRET),
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  },

  security: {
    corsOrigins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s: string) => s.trim())
      : ALLOWED_ORIGINS,
    jwtSecret: requiredEnv("JWT_SECRET"),
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 100,
    authRateLimitMax: 10,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  },

  files: {
    path: process.env.UPLOAD_PATH || path.join(__dirname, "../../uploads"),
    maxSize: 10 * 1024 * 1024,
  },

  socket: {
    corsOrigins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s: string) => s.trim())
      : ALLOWED_ORIGINS,
  },
};
