import { Router } from "express";
// ✅ Correction du chemin d'import (suppression de /http/)
import * as sosController from "../controllers/sos.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route POST /api/sos
 * @desc Envoyer un SOS (Ouvert à tous les utilisateurs connectés)
 */
router.post("/", authenticate, sosController.createSosAlert);

/**
 * @route GET /api/sos/station/:stationId
 * @desc Voir les alertes d'un commissariat (Police & Admin uniquement)
 */
router.get(
  "/station/:stationId",
  authenticate,
  authorize(["officier_police", "commissaire", "admin"]),
  sosController.getStationAlerts,
);

router.patch(
  "/:id/resolve",
  authenticate,
  authorize(["officier_police", "commissaire", "admin"]),
  sosController.resolveSosAlert,
);

export default router;
