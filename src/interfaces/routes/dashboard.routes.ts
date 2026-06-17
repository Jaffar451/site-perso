// PATH: src/interfaces/routes/dashboard.routes.ts
import { Router } from "express";
import {
  getPrisonStats,
  getPoliceStats,
  getWeeklyReportStats,
} from "../controllers/dashboard.controller";
// import { protect, restrictTo } from "../../middlewares/auth.middleware"; // À activer plus tard pour la sécurité

const router = Router();

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
