import { Router } from "express";
import {
  createSentence,
  getSentences,
  getSentence,
  updateSentence,
  deleteSentence,
} from "../controllers/sentence.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

/**
 * ⚖️ DROITS D'ACCÈS
 * - Consultation : Juges, Greffiers, Procureurs, Police (pour suivi), Admin
 * - Modification/Création : Juges et Admins uniquement
 */
const judicialStaff = ["judge", "greffier", "officier_police", "prosecutor", "admin"];
const magistrateOnly = ["judge", "admin"];

// 📌 LISTER LES PEINES
router.get("/", authenticate, authorize(judicialStaff), getSentences);

// 📌 VOIR LE DÉTAIL D'UNE PEINE
router.get("/:id", authenticate, authorize(judicialStaff), getSentence);

// 📌 ENREGISTRER UNE NOUVELLE PEINE (Prononcé du jugement)
router.post("/", authenticate, authorize(magistrateOnly), createSentence);

// 📌 MODIFIER UNE PEINE (Rectification d'erreur matérielle)
router.patch("/:id", authenticate, authorize(magistrateOnly), updateSentence);

// 📌 SUPPRIMER UNE PEINE (Action critique)
router.delete("/:id", authenticate, authorize(["admin"]), deleteSentence);

export default router;
