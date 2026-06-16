// PATH: src/interfaces/routes/audit.routes.ts
import { Router } from "express";
import {
  ListAuditLogs,
  getAuditLogs,
} from "../controllers/auditLog.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * 🕵️ ACCÈS AUX JOURNAUX D'AUDIT
 * Réservé exclusivement aux administrateurs pour la conformité et la sécurité.
 */
router.get(
  "/",
  protect,
  authorize(["admin", "super-admin"]), // ✅ On autorise aussi le super-admin si présent
  getAuditLogs,
);

export default router;
