import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  me,
  createSuperAdmin,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register",           register);
router.post("/login",              login);
router.post("/refresh-token",      refreshToken);
router.post("/refresh",            refreshToken);
router.get("/me",     authenticate, me);
router.post("/logout",             logout);
router.put("/update", authenticate, updateProfile);

router.post("/change-password",    authenticate, changePassword);
router.post("/forgot-password",    forgotPassword);
router.post("/reset-password",     resetPassword);
router.post("/verify-email",       verifyEmail);
router.post("/resend-verification", resendVerification);

router.get("/create-super-admin", authenticate, createSuperAdmin);

export default router;