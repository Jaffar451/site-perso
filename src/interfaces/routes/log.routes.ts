// PATH: backend/src/interfaces/routes/log.routes.ts
import { Router } from "express";
import * as logController from "../controllers/log.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Seul l'Admin peut voir les logs
router.get("/", authenticate, authorize(["admin"]), logController.getLog);

export default router;
