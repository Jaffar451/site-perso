import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getProceduralDashboard,
  completeAct,
  waiveAct,
} from "../controllers/procedural.controller";

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get("/", getProceduralDashboard);
router.patch("/acts/:actId/complete", completeAct);
router.patch("/acts/:actId/waive", waiveAct);

export default router;
