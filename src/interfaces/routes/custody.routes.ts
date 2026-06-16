import { Router } from "express";
import {
  createCustody,
  getAllCustodies,
  getActiveCustodies,
  getCustody,
  updateCustody,
  deleteCustody,
} from "../controllers/custody.controller";
import { authenticate } from "../middleware/auth.middleware";
const router = Router();
router.post("/", authenticate, createCustody);
router.get("/", authenticate, getAllCustodies);
router.get("/active", authenticate, getActiveCustodies);
router.get("/:id", authenticate, getCustody);
router.put("/:id", authenticate, updateCustody);
router.delete("/:id", authenticate, deleteCustody);
export default router;
