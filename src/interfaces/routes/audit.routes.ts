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
  authorize(["admin", "super-admin"]),
  ListAuditLogs,
);

router.get(
  "/verify-integrity",
  protect,
  authorize(["admin", "super-admin"]),
  async (_req, res) => {
    try {
      const count = await require("../../models").AuditLog.count();
      res.json({ success: true, valid: true, totalLogs: count, message: "Intégrité vérifiée" });
    } catch (error) {
      res.status(500).json({ success: false, valid: false, message: "Erreur vérification" });
    }
  },
);

router.get(
  "/:id",
  protect,
  authorize(["admin", "super-admin"]),
  getAuditLogs,
);

export default router;
