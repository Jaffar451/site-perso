// PATH: backend/src/interfaces/routes/court.routes.ts
import { Router } from "express";
import * as courtController from "../controllers/court.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * 1. 📋 Lister les tribunaux
 * Accessible à tout utilisateur authentifié (pour remplir les listes déroulantes)
 */
router.get("/", authenticate, courtController.listCourts);

/**
 * 2. 🔍 Voir les détails d'un tribunal
 */
router.get("/:id", authenticate, courtController.getCourt);

/**
 * 3. 🚀 Créer un tribunal
 * Réservé aux ADMINS uniquement
 */
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  courtController.createCourt,
);

/**
 * 4. 🔄 Modifier un tribunal
 * Réservé aux ADMINS uniquement
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  courtController.updateCourt,
);

/**
 * 5. 🗑️ Supprimer un tribunal
 * Réservé aux ADMINS uniquement
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  courtController.deleteCourt,
);

export default router;
