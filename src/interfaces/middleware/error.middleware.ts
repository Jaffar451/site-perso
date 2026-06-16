// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";

export default function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error("❌", err);
  res.status(err.status || 500).json({
    message: err.message || "Erreur serveur",
  });
}
