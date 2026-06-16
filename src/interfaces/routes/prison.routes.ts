import { Router } from "express";
import * as prisonController from "../controllers/prison.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Routes publiques ou partagées (consultation)
router.get("/", authenticate, prisonController.listPrisons);
router.get("/:id", authenticate, prisonController.getPrison);

// Routes administratives (création/modification)
router.post(
  "/",
  authenticate,
  authorize(["admin"]),
  prisonController.createPrison,
);
router.patch(
  "/:id",
  authenticate,
  authorize(["admin"]),
  prisonController.updatePrison,
);

export default router;
