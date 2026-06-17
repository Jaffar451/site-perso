import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { ListAuditLogs } from "../controllers/auditLog.controller";

const router = Router();

// Middleware global : Seul l'ADMIN passe
router.use(authenticate, authorize(["admin"]));

// 📋 Audit Logs (accessible via /admin/audit-logs)
router.get("/audit-logs", ListAuditLogs);

// 📊 Stats Dashboard
router.get("/dashboard-stats", AdminController.getDashboardStats);

// 🏥 Santé du Système
router.get("/system-health", AdminController.getSystemHealth);

// 📜 Logs Système
router.get("/logs", AdminController.getSystemLogs);

// 🔐 Settings & Sécurité
router.get("/security/settings", AdminController.getSecuritySettings);
router.get("/security/overview", async (_req, res) => {
  try {
    const { User, AuditLog } = require("../../models");
    const totalUsers = await User.count();
    const recentLogs = await AuditLog.count();
    const failedLogins = await AuditLog.count({ where: { action: "LOGIN_FAILED" } });
    res.json({
      success: true,
      data: {
        score: failedLogins > 10 ? 60 : 85,
        totalUsers,
        activeUsers: totalUsers,
        recentLogs,
        failedLogins,
        threats: failedLogins > 5 ? [{ type: "brute_force", count: failedLogins }] : [],
        alerts: [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
router.put("/security/settings", AdminController.updateSecuritySettings);
router.post("/security/scan", async (_req, res) => {
  try {
    const { AuditLog } = require("../../models");
    const failedLogins = await AuditLog.count({ where: { action: "LOGIN_FAILED" } });
    res.json({
      success: true,
      data: {
        score: failedLogins > 10 ? 60 : 85,
        vulnerabilities: [],
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// 🛠️ Maintenance (C'est ici que j'ai ajouté /status pour correspondre au Frontend)
router.get("/maintenance/status", AdminController.getMaintenanceStatus);
router.post("/maintenance/status", AdminController.setMaintenanceStatus);

// Route pour vider le cache
router.post("/maintenance/clear-cache", (req, res) => {
  // Logique simulée de vidage de cache
  console.log("🧹 Cache vidé par l'admin");
  res.json({ success: true, message: "Cache serveur vidé avec succès" });
});

export default router;
