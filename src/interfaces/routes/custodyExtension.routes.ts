import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createCustodyExtension,
  getCustodyExtensions,
  getCustodyExtensionById, // À ajouter
  updateCustodyExtension,   // À ajouter
  deleteCustodyExtension,   // À ajouter
} from "../controllers/custodyExtension.controller";

const router = Router();
router.use(authenticate, authorize(["officier_police","commissaire","prosecutor","judge","greffier","admin"]));

// --- Routes de base ---
router.post("/", createCustodyExtension);
router.get("/", getCustodyExtensions);

// --- Routes spécifiques (ID) ---
router.get("/:id", getCustodyExtensionById);
router.put("/:id", updateCustodyExtension);
router.delete("/:id", deleteCustodyExtension);

export default router;