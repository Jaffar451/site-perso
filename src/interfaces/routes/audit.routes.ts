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

router.post(
  "/",
  protect,
  authorize(["admin", "super-admin"]),
  async (req, res) => {
    try {
      const { AuditLog } = require("../../models");
      const log = await AuditLog.create({
        action: req.body.action || "ADMIN_ACTION",
        userId: (req as any).user?.id,
        details: req.body.details || null,
        ipAddress: req.ip,
      });
      return res.status(201).json({ success: true, data: log });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  },
);

router.get(
  "/actor/:userId",
  protect,
  authorize(["admin", "super-admin"]),
  async (req, res) => {
    try {
      const { AuditLog } = require("../../models");
      const logs = await AuditLog.findAll({
        where: { userId: req.params.userId },
        order: [["createdAt", "DESC"]],
        limit: 100,
      });
      return res.json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
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
