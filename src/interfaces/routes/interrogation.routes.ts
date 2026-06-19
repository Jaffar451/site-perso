// src/interfaces/routes/interrogation.routes.ts
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  createInterrogation,
  getAllInterrogations,
  getInterrogation,
  updateInterrogation,
  deleteInterrogation,
} from "../controllers/interrogation.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createInterrogation);
router.get("/", getAllInterrogations);
router.get("/:id", getInterrogation);
router.put("/:id", updateInterrogation);
router.delete("/:id", deleteInterrogation);

export default router;
