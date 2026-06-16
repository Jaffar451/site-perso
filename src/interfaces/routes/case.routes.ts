import { Router } from "express";
import {
  listCases,
  listMyCases,
  createCase,
  getCase,
  updateCase,
} from "../controllers/case.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

import qualificationRoutes from "./qualification.routes";
import proceduralRoutes from "./procedural.routes";
import casePartyRoutes from "./caseParty.routes";

const router = Router();

// ==========================================
// SOUS-ROUTES PAR DOSSIER
// ==========================================

// /api/cases/:caseId/qualification
router.use("/:caseId/qualification", qualificationRoutes);

// /api/cases/:caseId/procedural
router.use("/:caseId/procedural", proceduralRoutes);

// /api/cases/:caseId/parties
router.use("/:caseId/parties", casePartyRoutes);

// ==========================================
// ROUTES PRINCIPALES
// ==========================================

router.get("/me", authenticate, listMyCases);

router.get("/", authenticate, authorize(["admin"]), listCases);

router.post("/", authenticate, authorize(["prosecutor", "admin"]), createCase);

router.get("/:id", authenticate, getCase);

// PATCH — transitions de stage via CaseService
router.patch(
  "/:id",
  authenticate,
  authorize(["judge", "prosecutor", "greffier", "admin"]),
  updateCase,
);

// PUT — alias pour compatibilité avec l'existant
router.put(
  "/:id",
  authenticate,
  authorize(["judge", "prosecutor", "greffier", "admin"]),
  updateCase,
);

export default router;
