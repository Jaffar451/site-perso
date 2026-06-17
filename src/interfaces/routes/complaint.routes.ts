import { Router } from "express";
import {
  createComplaint,
  listComplaints,
  getComplaint,
  getMyComplaints,
  transmitToHierarchy,
  validateToParquet,
  addAttachment,
  updateComplaint,
  transitionComplaint,
  getAvailableTransitions,
} from "../controllers/complaint.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  onlyCitizen,
  onlyOfficialAgents,
  requireRole,
} from "../middleware/role.middleware";
import { uploadEvidence } from "../middleware/upload-evidence.middleware";
import { get } from "axios";
const router = Router();
router.post("/", authenticate, onlyCitizen, createComplaint);
router.get(
  "/me",
  authenticate,
  requireRole("citizen", "officier_police", "gendarme", "commissaire"),
  getMyComplaints,
  getComplaint,
);
router.get(
  "/my-complaints",
  authenticate,
  requireRole("citizen", "officier_police", "gendarme", "commissaire"),
  getMyComplaints,
  getComplaint,
);
router.patch(
  "/:id",
  authenticate,
  requireRole("citizen", "officier_police", "gendarme", "admin", "commissaire", "prosecutor", "judge"),
  updateComplaint,
);
router.post(
  "/:id/attachments",
  authenticate,
  requireRole("citizen", "officier_police", "gendarme", "commissaire", "prosecutor", "judge"),
  uploadEvidence,
  addAttachment,
);
router.get("/", authenticate, onlyOfficialAgents, listComplaints);
router.get(
  "/:id",
  authenticate,
  requireRole(
    "citizen",
    "officier_police",
    "commissaire",
    "gendarme",
    "prosecutor",
    "judge",
    "greffier",
    "admin",
  ),
  getComplaint,
);
router.get(
  "/:id/transitions",
  authenticate,
  requireRole(
    "officier_police",
    "inspecteur",
    "commissaire",
    "prosecutor",
    "judge",
    "admin",
  ),
  getAvailableTransitions,
);
router.post(
  "/:id/transition",
  authenticate,
  requireRole(
    "officier_police",
    "inspecteur",
    "commissaire",
    "prosecutor",
    "admin",
  ),
  transitionComplaint,
);
router.post(
  "/:id/transmit",
  authenticate,
  requireRole("officier_police", "gendarme", "inspecteur", "commissaire", "prosecutor", "judge", "admin"),
  transmitToHierarchy,
);
router.put(
  "/:id/validate-parquet",
  authenticate,
  requireRole("commissaire", "admin"),
  validateToParquet,
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { Complaint } = require("../../models");
      const complaint = await Complaint.findByPk(req.params.id);
      if (!complaint) return res.status(404).json({ message: "Plainte introuvable" });
      await complaint.destroy();
      return res.json({ success: true, message: "Plainte supprimée" });
    } catch (error) {
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

export default router;
