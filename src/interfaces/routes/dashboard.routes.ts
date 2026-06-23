// PATH: src/interfaces/routes/dashboard.routes.ts
import { Router } from "express";
import {
  getPrisonStats,
  getPoliceStats,
  getWeeklyReportStats,
} from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate, authorize(["admin", "commissaire", "prosecutor", "judge"]));

/**
 * @route   GET /api/dashboard/prisons
 * @desc    Obtenir les statistiques de population et de capacité carcérale
 * @access  Privé (Admin/Ministère)
 */
router.get("/prisons", getPrisonStats);

/**
 * @route   GET /api/dashboard/police
 * @desc    Obtenir le volume des plaintes par commissariat/brigade
 * @access  Privé (Admin/Ministère)
 */
router.get("/police", getPoliceStats);

router.get("/weekly-stats", getWeeklyReportStats);

export default router;
