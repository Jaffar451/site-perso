import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createProsecution,
  getProsecutions,
} from "../controllers/prosecution.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createProsecution);
router.get("/", getProsecutions);

export default router;
