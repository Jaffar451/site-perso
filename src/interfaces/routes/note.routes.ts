// PATH: src/interfaces/routes/note.routes.ts
import { Router } from "express";
import {
  listNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote,
} from "../controllers/note.controller";

// 👇 1. Import des middlewares standards
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// 🔹 Lecture notes (liste globale ou filtrée)
router.get(
  "/",
  authenticate,
  authorize(["officier_police", "greffier", "judge", "admin"]),
  listNotes,
);

// 🔹 Lecture une note
router.get(
  "/:id",
  authenticate,
  authorize(["officier_police", "greffier", "judge", "admin"]),
  getNote,
);

// 🔹 Création note interne
router.post(
  "/",
  authenticate,
  authorize(["officier_police", "greffier", "judge", "admin"]),
  createNote,
);

// 🔹 Modification (Seul l'auteur peut modifier, géré dans le controller)
router.put(
  "/:id",
  authenticate,
  authorize(["officier_police", "greffier", "judge", "admin"]),
  updateNote,
);

// 🔹 Suppression définitive → admin only
router.delete("/:id", authenticate, authorize(["admin"]), deleteNote);

export default router;
