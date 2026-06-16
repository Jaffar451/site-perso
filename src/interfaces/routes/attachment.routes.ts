// PATH: src/interfaces/routes/attachment.routes.ts
import { Router } from "express";

// 👇 1. Import des fonctions du contrôleur
import {
  uploadAttachment,
  listAttachments,
  deleteAttachment,
} from "../controllers/attachment.controller";

// 👇 2. Import des middlewares standards
import { authenticate, authorize } from "../middleware/auth.middleware";

// (Optionnel) Si tu utilises Multer pour l'upload de fichiers, tu devras l'importer ici
// import upload from "../../middleware/upload.middleware";

const router = Router();

// 📌 AJOUTER UNE PIÈCE JOINTE
// (Note: Si tu utilises Multer, ajoute 'upload.single("file")' avant le contrôleur)
router.post(
  "/",
  authenticate,
  authorize(["officier_police", "gendarme", "inspecteur", "commissaire", "judge", "greffier", "admin"]),
  uploadAttachment,
);

router.get(
  "/:caseId",
  authenticate,
  authorize(["officier_police", "gendarme", "inspecteur", "commissaire", "judge", "greffier", "prosecutor", "admin"]),
  listAttachments,
);

router.delete("/:id", authenticate, authorize(["admin"]), deleteAttachment);

export default router;