import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { createAppeal, getAppeals } from "../controllers/appeal.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createAppeal);
router.get("/", getAppeals);

export default router;
