import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getQualification,
  qualifyCase,
  getQualificationHistory,
} from "../controllers/qualification.controller";

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get("/", getQualification);
router.post("/", qualifyCase);
router.get("/history", getQualificationHistory);

export default router;
