// PATH: src/interfaces/routes/witness.routes.ts
import { Router } from "express";
import { createWitness, getWitnesses } from "../controllers/witness.controller";
// 👇 Import de la sécurité
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// 📌 AJOUTER UN TÉMOIN (Police, Juge, Greffier)
router.post(
  "/",
  authenticate,
  authorize(["officier_police", "judge", "greffier", "admin"]),
  createWitness,
);

// 📌 LISTER LES TÉMOINS (Justice + Admin)
router.get(
  "/",
  authenticate,
  authorize(["officier_police", "judge", "greffier", "prosecutor", "admin"]),
  getWitnesses,
);

export default router;
