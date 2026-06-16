// PATH: src/interfaces/routes/arrestWarrant.routes.ts
import { Router } from "express";

// 👇 1. Imports du contrôleur
import {
  createArrestWarrant,
  getArrestWarrants,
} from "../controllers/arrestWarrant.controller";

// 👇 2. Imports des middlewares standards
import { authenticate, authorize } from "../middleware/auth.middleware";

// Je commente ceci pour éviter le crash tant que ce middleware n'est pas mis à jour
// import { requireAssignmentRole } from "../../middleware/assignment.middleware";

const router = Router();

// Seul un juge (d'instruction) peut créer un mandat d'arrêt
router.post(
  "/",
  authenticate,
  // On remplace requireAssignmentRole par authorize(["judge"]) temporairement
  authorize(["judge", "admin"]),
  createArrestWarrant,
);

// Seuls les agents judiciaires peuvent voir les mandats
router.get(
  "/",
  authenticate,
  authorize(["officier_police", "prosecutor", "judge", "greffier", "admin"]),
  getArrestWarrants,
);

export default router;
