// PATH: src/interfaces/routes/decision.routes.ts
import { Router } from "express";

// 👇 1. Import des fonctions du contrôleur
import {
  listDecisions,
  listDecisionsByCase,
  createDecision,
  getDecision,
  updateDecision,
  deleteDecision,
  signDecision,
} from "../controllers/decision.controller";

// 👇 2. Import des middlewares standards
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// 🔹 Liste des décisions (Tout agent de justice)
router.get(
  "/",
  authenticate,
  authorize(["judge", "greffier", "officier_police", "admin"]),
  listDecisions,
);

// 🔹 Liste par affaire
router.get(
  "/case/:caseId",
  authenticate,
  authorize(["judge", "greffier", "officier_police", "admin"]),
  listDecisionsByCase,
);

// 🔹 Création décision : juge uniquement
router.post(
  "/",
  authenticate,
  authorize(["judge", "admin"]), // J'ai ajouté admin pour tes tests
  createDecision,
);

// 🔹 Lecture décision
router.get(
  "/:id",
  authenticate,
  authorize(["judge", "greffier", "officier_police", "admin"]),
  getDecision,
);

// 🔹 Modification décision : si non signée
router.put("/:id", authenticate, authorize(["judge"]), updateDecision);
router.patch("/:id", authenticate, authorize(["judge"]), updateDecision);

// 🔹 Signature (Scellement de la décision)
router.patch("/:id/sign", authenticate, authorize(["judge"]), signDecision);

// 🔹 Suppression décision : admin uniquement
router.delete("/:id", authenticate, authorize(["admin"]), deleteDecision);

export default router;
