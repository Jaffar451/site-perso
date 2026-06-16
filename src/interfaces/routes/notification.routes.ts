// PATH: src/interfaces/routes/notification.routes.ts
import { Router } from "express";
// 👇 On importe toutes les fonctions exportées
import * as NotificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ❌ ON SUPPRIME : const controller = new NotificationController();
// Car ce n'est plus une classe, mais des fonctions directes.

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Lecture
router.get("/", NotificationController.getNotifications);
router.patch("/:id/read", NotificationController.markAsRead);

// Suppression
// ✅ IMPORTANT : La route "/all" doit être déclarée AVANT "/:id"
// Sinon Express pensera que "all" est un ID.
router.delete("/all", NotificationController.clearAll);

// ✅ AJOUT : Route pour supprimer une seule notification
router.delete("/:id", NotificationController.deleteNotification);

export default router;
