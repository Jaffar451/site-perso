import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createPreventiveDetention,
  getAllPreventiveDetentions,
} from "../controllers/preventiveDetention.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createPreventiveDetention);
router.get("/", getAllPreventiveDetentions);

export default router;
