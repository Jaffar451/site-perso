// PATH: src/interfaces/routes/policeStation.routes.ts
import { Router } from "express";
// 👇 On importe tout en tant que "StationController" (pas de classe)
import * as StationController from "../controllers/policeStation.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// 🔓 ROUTES ACCESSIBLES (Citoyens & Police)
// ==========================================

/**
 * @route   GET /api/police-stations
 * @desc    Récupérer la liste (Pour l'annuaire mobile)
 */
router.get("/", authenticate, StationController.getAllStations);

/**
 * @route   GET /api/police-stations/:id
 * @desc    Détails d'un commissariat
 */
router.get("/:id", authenticate, StationController.getStationById);

// ==========================================
// 🔒 ROUTES ADMIN (GESTION)
// ==========================================

/**
 * @route   POST /api/police-stations
 * @desc    Créer un commissariat
 */
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  StationController.createStation,
);

/**
 * @route   PUT /api/police-stations/:id
 * @desc    Modifier
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  StationController.updateStation,
);

/**
 * @route   DELETE /api/police-stations/:id
 * @desc    Supprimer
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  StationController.deleteStation,
);

export default router;
