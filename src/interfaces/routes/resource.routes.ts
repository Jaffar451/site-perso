// PATH: src/interfaces/routes/resource.routes.ts
import { Router } from "express";
import * as ResourceController from "../controllers/resource.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Routes protégées pour l'application
router.get("/legal-texts", authenticate, ResourceController.getLegalTexts);
router.get("/lawyers", authenticate, ResourceController.getLawyers);

// ✨ LA ROUTE MAGIQUE (Sans protection pour pouvoir l'appeler facilement depuis le navigateur)
// Tu pourras la supprimer plus tard si tu veux
router.get("/seed-force", ResourceController.seedResources);

export default router;
