import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createSearchWarrant,
  getSearchWarrants,
} from "../controllers/searchWarrant.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createSearchWarrant);
router.get("/", getSearchWarrants);

export default router;
