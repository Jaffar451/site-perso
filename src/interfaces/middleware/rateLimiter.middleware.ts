// src/middleware/rateLimiter.middleware.ts
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // ⏱️ 1 minute
  max: 5, // 🚫 max 5 tentatives par minute
  message: {
    message: "Trop de tentatives, réessayez plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default loginLimiter;
