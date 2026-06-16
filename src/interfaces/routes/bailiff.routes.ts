import { Router } from "express";
import { BailiffController } from "../controllers/bailiff.controller";
// ✅ Import avec le chemin exact vers le dossier "middleware"
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const controller = new BailiffController();

/**
 * Route : Récupérer les missions de l'huissier
 * URL : GET /api/bailiff/missions
 */
router.get(
  "/missions",
  authenticate,
  authorize(["bailiff"]),
  (req: any, res: any) => controller.getMyMissions(req, res),
);

/**
 * Route : Valider une signification avec coordonnées GPS
 * URL : POST /api/bailiff/signify
 */
router.post(
  "/signify",
  authenticate,
  authorize(["bailiff"]),
  (req: any, res: any) => controller.validateMission(req, res),
);

export default router;
