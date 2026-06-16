import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Middleware global : Seul l'ADMIN passe
router.use(authenticate, authorize(["admin"]));

// 📊 Stats Dashboard
router.get("/dashboard-stats", AdminController.getDashboardStats);

// 🏥 Santé du Système
router.get("/system-health", AdminController.getSystemHealth);

// 📜 Logs Système
router.get("/logs", AdminController.getSystemLogs);

// 🔐 Settings & Sécurité
router.get("/security/settings", AdminController.getSecuritySettings);
router.get("/security/overview", AdminController.getSecuritySettings);
router.put("/security/settings", AdminController.updateSecuritySettings);

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
