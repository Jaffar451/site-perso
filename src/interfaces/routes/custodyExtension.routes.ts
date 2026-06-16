import { Router } from "express";
import {
  createCustodyExtension,
  getCustodyExtensions,
  getCustodyExtensionById, // À ajouter
  updateCustodyExtension,   // À ajouter
  deleteCustodyExtension,   // À ajouter
} from "../controllers/custodyExtension.controller";

const router = Router();

// --- Routes de base ---
router.post("/", createCustodyExtension);
router.get("/", getCustodyExtensions);

// --- Routes spécifiques (ID) ---
router.get("/:id", getCustodyExtensionById);
router.put("/:id", updateCustodyExtension);
router.delete("/:id", deleteCustodyExtension);

export default router;