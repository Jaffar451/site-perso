import { Router } from "express";
import * as incarcerationController from "../controllers/incarceration.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * 🔒 PROTECTION GLOBALE
 * Toutes les routes ci-dessous nécessitent une authentification
 * et sont réservées aux admins et au personnel pénitentiaire.
 */
const prisonAccess = [authenticate, authorize(["admin", "prison_officer"])];

// POST /api/incarcerations/entry -> Enregistrer une nouvelle mise sous écrou
router.post("/entry", prisonAccess, incarcerationController.registerEntry);

// GET /api/incarcerations/inmates -> Consulter le registre d'écrou (liste des détenus présents)
router.get("/inmates", prisonAccess, incarcerationController.listInmates);

// PATCH /api/incarcerations/:id/release -> Procéder à une levée d'écrou (libération)
router.patch(
  "/:id/release",
  prisonAccess,
  incarcerationController.releaseDetainee,
);

// POST /api/incarcerations/:id/transfer -> Transférer un détenu vers un autre établissement
router.post(
  "/:id/transfer",
  prisonAccess,
  incarcerationController.transferDetainee,
);

export default router;
