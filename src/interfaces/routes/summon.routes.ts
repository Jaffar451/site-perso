// PATH: src/interfaces/routes/summon.routes.ts
import { Router } from "express";
import {
  createSummon,
  listSummons,
  getSummonsByComplaint,
  updateSummonStatus,
} from "../controllers/summon.controller";

// 👇 1. Import des middlewares standards
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// 📌 Toutes les routes nécessitent une authentification
// 👇 2. CORRECTION : On utilise la variable importée 'authenticate'
router.use(authenticate);

// 🔹 Créer une convocation (Police, Juge, Greffier)
router.post(
  "/",
  authorize(["officier_police", "gendarme", "inspecteur", "commissaire", "judge", "greffier", "admin"]),
  createSummon,
);

router.get(
  "/",
  authorize(["officier_police", "gendarme", "inspecteur", "commissaire", "judge", "greffier", "prosecutor", "admin"]),
  listSummons,
);

router.get(
  "/complaint/:complaintId",
  authorize(["officier_police", "gendarme", "inspecteur", "commissaire", "judge", "greffier", "prosecutor", "admin"]),
  getSummonsByComplaint,
);

router.patch(
  "/:id/status",
  authorize(["officier_police", "gendarme", "inspecteur", "commissaire", "judge", "greffier", "admin"]),
  updateSummonStatus,
);

export default router;