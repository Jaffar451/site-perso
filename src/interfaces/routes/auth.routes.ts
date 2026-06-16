import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  me,
  createSuperAdmin,
  logout,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register",           register);
router.post("/login",              login);
router.post("/refresh-token",      refreshToken);
router.get("/me",     authenticate, me);
router.post("/logout",             logout);
router.put("/update", authenticate, updateProfile);  // ← route manquante

// ✨ Route Magique Admin
router.get("/create-super-admin",  createSuperAdmin);

export default router;