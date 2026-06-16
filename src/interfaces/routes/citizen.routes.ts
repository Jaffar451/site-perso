import { Router } from "express";
import { CitizenController } from "../controllers/citizen.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const controller = new CitizenController();

/**
 * @route   GET /api/citizen/cases
 * @desc    Récupérer tous les dossiers judiciaires liés au citoyen connecté
 * @access  Privé (Citizen uniquement)
 */
router.get(
  "/cases",
  authenticate,
  authorize(["citizen"]),
  (req: any, res: any) => controller.getDashboard(req, res),
);

/**
 * @route   GET /api/citizen/notifications
 * @desc    Récupérer les alertes (significations d'actes, dates d'audiences)
 * @access  Privé (Citizen uniquement)
 */
router.get(
  "/notifications",
  authenticate,
  authorize(["citizen"]),
  (req: any, res: any) => controller.getNotifications(req, res),
);

/**
 * @route   GET /api/citizen/summons
 * @desc    Voir les convocations reçues
 */
router.get(
  "/summons",
  authenticate,
  authorize(["citizen"]),
  (req: any, res: any) => {
    // Tu pourras ajouter une méthode getMySummons dans le controller plus tard
    res
      .status(501)
      .json({ message: "Non implémenté : liste des convocations" });
  },
);

export default router;
