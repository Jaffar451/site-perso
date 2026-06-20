// PATH: backend/src/app.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";

import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./interfaces/routes/index";

const app = express();

// ==========================================
// 🏗️ CONFIGURATION PROXY (IMPORTANT POUR PROD)
// ==========================================
app.set("trust proxy", 1);

// ==========================================
// 🛡️ COUCHE DE SÉCURITÉ (HELMET & CORS)
// ==========================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  }),
);

// ✅ CORRECTION CORS CRITIQUE
// On met "origin: true" pour refléter l'origine de la requête (ex: localhost:8081).
// Cela permet à Expo Web de fonctionner avec les cookies/headers sécurisés.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.security.corsOrigins.includes(origin) || env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("CORS non autorisé: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }),
);

// ==========================================
// 🚦 LIMITATION DES REQUÊTES (ANTI-DDOS)
// ==========================================
const limiter = rateLimit({
  windowMs: env.security.rateLimitWindowMs || 15 * 60 * 1000,
  max: env.security.rateLimitMax || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "⛔ Trop de requêtes. Veuillez patienter avant de réessayer.",
  },
});

app.use("/api/", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.security.authRateLimitMax || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de tentatives. Réessayez dans 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ==========================================
// ⚙️ MIDDLEWARES DE PARSING & LOGS
// ==========================================
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("short"));
}

// ==========================================
// 📂 GESTION DES FICHIERS STATIQUES
// ==========================================
const uploadsPath = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsPath)) {
  console.log(
    `📂 [INFO] Dossier 'uploads' introuvable. Création automatique...`,
  );
  fs.mkdirSync(uploadsPath, { recursive: true });
}

console.log(`📂 [INFO] Dossier Uploads servi depuis : ${uploadsPath}`);

app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Accès non autorisé aux fichiers" });
  }
  try {
    const jwt = require("jsonwebtoken");
    jwt.verify(authHeader.split(" ")[1], env.jwt.secret);
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide" });
  }
}, express.static(uploadsPath));

// ==========================================
// 🚀 POINTS D'ENTRÉE (API ROUTES)
// ==========================================
app.use("/api", routes);

// Health Check (Monitoring)
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "✅ e-Justice Niger API Online",
    version: "2.2.0",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 🛑 GESTION DES ERREURS
// ==========================================

// 404 - Ressource non trouvée
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "❌ La ressource demandée n'existe pas (404).",
  });
});

// Global Error Handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = err.message || "Erreur interne du serveur.";

  if (statusCode === 500) {
    console.error(
      `🔴 [SERVER ERROR] ${new Date().toISOString()} :`,
      err.stack || err,
    );
  } else {
    console.warn(`⚠️ [APP ERROR] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
