// src/interfaces/routes/detention.routes.ts
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  createDetention,
  getAllDetentions,
  getDetention,
  updateDetention,
  deleteDetention,
} from "../controllers/detention.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

router.post("/", createDetention);
router.get("/", getAllDetentions);
router.get("/:id", getDetention);
router.put("/:id", updateDetention);
router.delete("/:id", deleteDetention);

export default router;
