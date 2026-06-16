// PATH: src/interfaces/routes/lawyer.routes.ts
import { Router } from "express";
import { LawyerController } from "../controllers/lawyer.controller";
// ✅ Importation groupée depuis le même fichier
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const controller = new LawyerController();

router.get("/tracking", authenticate, authorize(["LAWYER"]), (req, res) =>
  controller.getMyTracking(req, res),
);

export default router;
