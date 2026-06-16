import { Router } from "express";
import * as workflowController from "../controllers/workflow.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Toutes les routes de workflow sont protégées
// Seuls les procureurs et admins peuvent décider des suites judiciaires
const prosecutorAccess = [authenticate, authorize(["admin", "prosecutor"])];

router.post("/prosecute", prosecutorAccess, workflowController.prosecute);
router.post("/dismiss", prosecutorAccess, workflowController.dismiss);
router.post(
  "/flagrant-delict",
  prosecutorAccess,
  workflowController.handleFlagrantDelict,
);

export default router;
