import { Router } from "express";
import {
  listHearings,
  listHearingsByCase,
  createHearing,
  getHearing,
  updateHearing,
  deleteHearing,
  getDailyRoll,
} from "../controllers/hearing.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// --- ACCÈS GÉNÉRAL (Consultation) ---
const judicialStaff = ["judge", "greffier", "officier_police", "prosecutor", "admin"];

// 📌 RÔLE D'AUDIENCE DU JOUR (Placé avant /:id)
router.get("/daily-roll", authenticate, authorize(judicialStaff), getDailyRoll);

// 📌 LISTER TOUTES LES AUDIENCES (Calendrier global ou filtré par tribunal)
router.get("/", authenticate, authorize(judicialStaff), listHearings);

// 📌 HISTORIQUE DES AUDIENCES D'UNE AFFAIRE SPÉCIFIQUE
router.get(
  "/case/:caseId",
  authenticate,
  authorize(judicialStaff),
  listHearingsByCase,
);

// 📌 VOIR UNE AUDIENCE PRÉCISE
router.get("/:id", authenticate, authorize(judicialStaff), getHearing);

// --- ACCÈS RESTREINT (Gestion) ---

// 📌 PLANIFIER (Juge + Greffier)
router.post(
  "/",
  authenticate,
  authorize(["judge", "greffier", "admin"]),
  createHearing,
);

// 📌 MODIFIER / AJOURNER (Juge + Greffier)
router.patch(
  "/:id",
  authenticate,
  authorize(["judge", "greffier", "admin"]),
  updateHearing,
);

// 📌 SUPPRIMER (Admin uniquement)
router.delete("/:id", authenticate, authorize(["admin"]), deleteHearing);

export default router;
