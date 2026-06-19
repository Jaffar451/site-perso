import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { createRelease, getReleases } from "../controllers/release.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createRelease);
router.get("/", getReleases);

export default router;
