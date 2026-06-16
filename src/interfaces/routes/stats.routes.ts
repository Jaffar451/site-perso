import { Router } from "express";
import {
  getDashboardStats,
  getMonthlyTrends,
} from "../controllers/stats.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  authorize(["admin", "prosecutor", "commissaire"]),
  getDashboardStats,
);

router.get(
  "/trends",
  authenticate,
  authorize(["admin", "prosecutor", "commissaire", "judge"]),
  getMonthlyTrends,
);

export default router;
