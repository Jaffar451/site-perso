import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createConfiscation,
  getConfiscations,
} from "../controllers/confiscation.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createConfiscation);
router.get("/", getConfiscations);

export default router;
