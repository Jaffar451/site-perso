import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createReparation,
  getReparations,
} from "../controllers/reparation.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createReparation);
router.get("/", getReparations);

export default router;
