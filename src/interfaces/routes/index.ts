// PATH: src/interfaces/routes/index.ts
import { Router } from "express";

// ==========================================
// 1. SÉCURITÉ, INFRASTRUCTURE & ADMINISTRATION
// ==========================================
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import auditRoutes from "./audit.routes";
import adminRoutes from "./admin.routes";
import notificationRoutes from "./notification.routes";
import courtRoutes from "./court.routes";
import prisonRoutes from "./prison.routes";
import lawyerRoutes from "./lawyer.routes";
import bailiffRoutes from "./bailiff.routes";
import citizenRoutes from "./citizen.routes";

// ==========================================
// 2. SIG, POLICE & ALERTES
// ==========================================
import policeStationRoutes from "./policeStation.routes";
import sosRoutes from "./sos.routes";

// ==========================================
// 3. COEUR DU WORKFLOW JUDICIAIRE
// ==========================================
import complaintRoutes from "./complaint.routes";
import caseRoutes from "./case.routes";
import workflowRoutes from "./workflow.routes"; // ✅ CORRIGÉ : Import ajouté
import casePartyRoutes from "./caseParty.routes";
import assignmentRoutes from "./assignment.routes";
import decisionRoutes from "./decision.routes";
import hearingRoutes from "./hearing.routes";

// ==========================================
// 4. ACTES DE PROCÉDURE & DOCUMENTS
// ==========================================
import summonRoutes from "./summon.routes";
import arrestWarrantRoutes from "./arrestWarrant.routes";
import searchWarrantRoutes from "./searchWarrant.routes";
import witnessRoutes from "./witness.routes";
import evidenceRoutes from "./evidence.routes";
import attachmentRoutes from "./attachment.routes";
import noteRoutes from "./note.routes";
import interrogationRoutes from "./interrogation.routes"; // ✅ AJOUT AUDIT
import proceduralRoutes from "./procedural.routes";       // ✅ AJOUT AUDIT
import qualificationRoutes from "./qualification.routes"; // ✅ AJOUT AUDIT

// ==========================================
// 5. DÉTENTION, INCARCÉRATION & PEINES
// ==========================================
import incarcerationRoutes from "./incarceration.routes";
import indictmentRoutes from "./indictment.routes";
import custodyExtensionRoutes from "./custodyExtension.routes";
import preventiveDetentionRoutes from "./preventiveDetention.routes";
import releaseRoutes from "./release.routes";
import sentenceRoutes from "./sentence.routes";
import confiscationRoutes from "./confiscation.routes";
import custodyRoutes from "./custody.routes";

// ==========================================
// 6. SUITES LÉGALES, RÉPARATIONS & APPELS
// ==========================================
import reparationRoutes from "./reparation.routes";
import appealRoutes from "./appeal.routes";
import prosecutionRoutes from "./prosecution.routes";

// ==========================================
// 7. ANALYSE DE DONNÉES & ACCÈS PUBLIC
// ==========================================
import dashboardRoutes from "./dashboard.routes";
import statsRoutes from "./stats.routes";
import publicRoutes from "./public.routes";
import resourceRoutes from "./resource.routes";

const router = Router();

// ==========================================
// 🔗 MAPPAGE DES POINTS D'ENTRÉE (API)
// ==========================================

// --- Infrastructure ---
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/courts", courtRoutes);
router.use("/prisons", prisonRoutes);
router.use("/lawyers", lawyerRoutes);
router.use("/bailiffs", bailiffRoutes);
router.use("/citizens", citizenRoutes);

// --- SIG & Sécurité ---
router.use("/police-stations", policeStationRoutes);
router.use("/directory", policeStationRoutes);
router.use("/sos", sosRoutes);

// --- Dossiers Judiciaires ---
router.use("/complaints", complaintRoutes);
router.use("/cases", caseRoutes);
router.use("/workflow", workflowRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/decisions", decisionRoutes);
router.use("/hearings", hearingRoutes);
router.use("/case-parties", casePartyRoutes);

// --- Actes & Procédures ---
router.use("/summons", summonRoutes);
router.use("/arrest-warrants", arrestWarrantRoutes);
router.use("/search-warrants", searchWarrantRoutes);
router.use("/witnesses", witnessRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/attachments", attachmentRoutes);
router.use("/notes", noteRoutes);
router.use("/interrogations", interrogationRoutes); // ✅ AJOUT AUDIT
router.use("/procedural", proceduralRoutes);         // ✅ AJOUT AUDIT
router.use("/qualifications", qualificationRoutes); // ✅ AJOUT AUDIT

// --- Pénitentiaire ---
router.use("/incarcerations", incarcerationRoutes);
router.use("/indictments", indictmentRoutes);
router.use("/custody-extensions", custodyExtensionRoutes);
router.use("/preventive-detentions", preventiveDetentionRoutes);
router.use("/releases", releaseRoutes);
router.use("/sentences", sentenceRoutes);
router.use("/confiscations", confiscationRoutes);
router.use("/custodies", custodyRoutes);

// --- Voies de Recours ---
router.use("/reparations", reparationRoutes);
router.use("/appeals", appealRoutes);
router.use("/prosecutions", prosecutionRoutes);

// --- Statistiques & Dashboards ---
router.use("/dashboard", dashboardRoutes);
router.use("/stats", statsRoutes);
router.use("/public", publicRoutes);
router.use("/resources", resourceRoutes);

// --- Surveillance du Système (Status) ---
router.get("/status", (_, res) => {
  res.json({
    success: true,
    message: "⚖️ Système National e-Justice Niger Online",
    version: "2.0.0",
    node_env: process.env.NODE_ENV || "development",
    timestamp: new Date(),
  });
});

export default router;