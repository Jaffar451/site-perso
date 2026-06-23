import { Request, Response } from "express";
import { Op } from "sequelize";
import Complaint, { ComplaintStatus } from "../../models/complaint.model";
import User from "../../models/user.model";
import PoliceStation from "../../models/policeStation.model";
import Attachment from "../../models/attachment.model";
import ComplaintFile from "../../models/complaintFile.model";
import path from "path";

const generateTrackingCode = (): string => {
  const prefix = "PLT";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
};

const userReq = (req: Request) => (req as any).user as { id: number; role: string };

const TRANSITIONS: Record<ComplaintStatus, Partial<Record<string, ComplaintStatus[]>>> = {
  soumise: {
    officier_police: ["en_cours_OPJ"],
    gendarme:        ["en_cours_OPJ"],
    inspecteur:      ["en_cours_OPJ"],
    commissaire:     ["en_cours_OPJ", "classée_sans_suite_par_OPJ"],
    admin:           ["en_cours_OPJ", "classée_sans_suite_par_OPJ"],
  },
  en_cours_OPJ: {
    officier_police: ["attente_validation", "classée_sans_suite_par_OPJ"],
    gendarme:        ["attente_validation", "classée_sans_suite_par_OPJ"],
    inspecteur:      ["attente_validation", "classée_sans_suite_par_OPJ"],
    commissaire:     ["attente_validation", "transmise_parquet", "classée_sans_suite_par_OPJ"],
    admin:           ["attente_validation", "transmise_parquet", "classée_sans_suite_par_OPJ"],
  },
  attente_validation: {
    commissaire: ["transmise_parquet", "classée_sans_suite_par_OPJ", "en_cours_OPJ"],
    admin:       ["transmise_parquet", "classée_sans_suite_par_OPJ", "en_cours_OPJ"],
  },
  transmise_parquet: {
    prosecutor: ["saisi_juge", "classée_sans_suite_par_procureur"],
    admin:      ["saisi_juge", "classée_sans_suite_par_procureur"],
  },
  saisi_juge: {
    judge: ["instruction", "non_lieu"],
    admin: ["instruction", "non_lieu"],
  },
  instruction: {
    judge:    ["audience_programmée", "non_lieu"],
    greffier: ["audience_programmée"],
    admin:    ["audience_programmée", "non_lieu"],
  },
  audience_programmée: {
    judge:    ["jugée"],
    greffier: ["jugée"],
    admin:    ["jugée"],
  },
  classée_sans_suite_par_OPJ:       {},
  classée_sans_suite_par_procureur: {},
  non_lieu:            {},
  jugée:               {},
  figée:               {},
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const { id: citizenId } = userReq(req);
    const { title, description, category, location, latitude, longitude, policeStationId } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, message: "La description est obligatoire" });
    }

    let trackingCode = generateTrackingCode();
    let attempt = 0;
    while (await Complaint.findOne({ where: { trackingCode } }) && attempt < 5) {
      trackingCode = generateTrackingCode();
      attempt++;
    }

    const complaint = await Complaint.create({
      citizenId,
      title: title || "Plainte sans titre",
      description,
      category: category || "general",
      status: "soumise",
      location: location || null,
      latitude: latitude || null,
      longitude: longitude || null,
      policeStationId: policeStationId || null,
      trackingCode,
      filedAt: new Date(),
    });

    const out = await Complaint.findByPk(complaint.id, {
      include: [
        { model: User, as: "complainant", attributes: ["id", "firstname", "lastname", "telephone"] },
        { model: Attachment, as: "attachments" },
      ],
    });

    return res.status(201).json({ success: true, data: out });
  } catch (error) {
    console.error("Error in createComplaint:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────────────────────────────

export const listComplaints = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = userReq(req);
    let where: any = {};

    const user = await User.findByPk(userId);
    const stationId = (user as any)?.policeStationId;

    if (["officier_police", "gendarme", "inspecteur", "commissaire"].includes(role)) {
      where[Op.and] = [
        { status: { [Op.in]: ["soumise", "en_cours_OPJ", "attente_validation", "classée_sans_suite_par_OPJ"] } },
        stationId ? { [Op.or]: [{ policeStationId: stationId }, { policeStationId: null }] } : {}
      ];
    } else if (role === "prosecutor") {
      where.status = { [Op.in]: ["transmise_parquet", "figée", "classée_sans_suite_par_procureur"] };
    } else if (["judge", "greffier"].includes(role)) {
      where.status = { [Op.in]: ["saisi_juge", "instruction", "audience_programmée", "jugée", "non_lieu"] };
    }

    const { getPagination, formatPaginatedResponse } = require("../../utils/pagination");
    const { page, limit, offset } = getPagination(req);

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      attributes: ["id", "title", "status", "category", "location", "trackingCode", "filedAt", "createdAt", "policeStationId", "citizenId", "assignedOpjId"],
      include: [
        { model: User, as: "complainant", attributes: ["id", "firstname", "lastname", "telephone"] },
        { model: User, as: "assignedOPJ", attributes: ["id", "firstname", "lastname", "matricule"] },
        { model: PoliceStation, as: "originStation", attributes: ["id", "name", "city", "district"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.json(formatPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    console.error("Error in listComplaints:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY COMPLAINTS
// ─────────────────────────────────────────────────────────────────────────────

export const getMyComplaints = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = userReq(req);
    let where: any = (role === "citizen") ? { citizenId: userId } : { assignedOpjId: userId };

    const complaints = await Complaint.findAll({
      where,
      include: [
        { model: User, as: "complainant", attributes: ["id", "firstname", "lastname", "telephone"] },
        { model: PoliceStation, as: "originStation" },
        { model: Attachment, as: "attachments" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: complaints });
  } catch (error) {
    console.error("Error in getMyComplaints:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID  ← correction principale
// ─────────────────────────────────────────────────────────────────────────────

export const getComplaint = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = userReq(req);
    const complaintId = parseInt(req.params.id as any);

    const complaint = await Complaint.findByPk(complaintId, {
      include: [
        {
          model: User, as: "complainant",
          attributes: ["id", "firstname", "lastname", "telephone"],
        },
        {
          // ✅ matricule et organization retournés pour afficher le nom complet de l'OPJ
          model: User, as: "assignedOPJ",
          attributes: ["id", "firstname", "lastname", "matricule", "organization"],
        },
        { model: PoliceStation, as: "originStation" },
        { model: Attachment, as: "attachments" },
        { model: ComplaintFile, as: "attachedFiles" },
      ],
    });

    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });

    if (role === "citizen" && (complaint as any).citizenId !== userId) {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    return res.json({ success: true, data: complaint });
  } catch (error) {
    console.error("Error in getComplaint:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  ← pvDetails autorisé
// ─────────────────────────────────────────────────────────────────────────────

export const updateComplaint = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = userReq(req);
    const complaintId = parseInt(req.params.id as any);
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });

    if (role === "citizen") {
      if ((complaint as any).citizenId !== userId) return res.status(403).json({ success: false, message: "Accès refusé" });
      if (complaint.status !== "soumise") return res.status(403).json({ success: false, message: "Plainte déjà en cours de traitement" });
    }

    const {
      title, description, category, location,
      assignedOpjId, policeStationId,
      // ✅ pvDetails : synthèse rédigée par l'OPJ
      pvDetails,
      // champs jugement
      verdictDetails, prosecutionDetails, detentionDetails, releaseDetails,
    } = req.body;

    const updates: any = {};
    if (title !== undefined)            updates.title            = title;
    if (description !== undefined)      updates.description      = description;
    if (category !== undefined)         updates.category         = category;
    if (location !== undefined)         updates.location         = location;
    if (assignedOpjId !== undefined)    updates.assignedOpjId    = assignedOpjId;
    if (policeStationId !== undefined)  updates.policeStationId  = policeStationId;
    if (pvDetails !== undefined)        updates.pvDetails        = pvDetails;
    if (verdictDetails !== undefined)   updates.verdictDetails   = verdictDetails;
    if (prosecutionDetails !== undefined) updates.prosecutionDetails = prosecutionDetails;
    if (detentionDetails !== undefined) updates.detentionDetails = detentionDetails;
    if (releaseDetails !== undefined)   updates.releaseDetails   = releaseDetails;

    await complaint.update(updates);

    const out = await Complaint.findByPk(complaintId, {
      include: [
        { model: User, as: "complainant", attributes: ["id", "firstname", "lastname"] },
        { model: User, as: "assignedOPJ", attributes: ["id", "firstname", "lastname", "matricule", "organization"] },
        { model: PoliceStation, as: "originStation" },
        { model: Attachment, as: "attachments" },
      ],
    });

    return res.json({ success: true, data: out });
  } catch (error) {
    console.error("Error in updateComplaint:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION
// ─────────────────────────────────────────────────────────────────────────────

export const transitionComplaint = async (req: Request, res: Response) => {
  try {
    const { role } = userReq(req);
    const complaintId = parseInt(req.params.id as any);
    const { status: newStatus } = req.body;

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });

    const allowed = TRANSITIONS[complaint.status]?.[role] || [];
    if (!allowed.includes(newStatus as ComplaintStatus)) {
      return res.status(403).json({ success: false, message: `Transition vers ${newStatus} non autorisée.` });
    }

    await complaint.update({ status: newStatus as ComplaintStatus });
    return res.json({ success: true, data: complaint });
  } catch (error) {
    console.error("Error in transitionComplaint:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITIONS DISPONIBLES
// ─────────────────────────────────────────────────────────────────────────────

export const getAvailableTransitions = async (req: Request, res: Response) => {
  try {
    const { role } = userReq(req);
    const complaintId = parseInt(req.params.id as any);
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });

    const available = TRANSITIONS[complaint.status]?.[role] || [];
    return res.json({ success: true, data: available });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RACCOURCIS MÉTIERS
// ─────────────────────────────────────────────────────────────────────────────

export const addAttachment = async (req: Request, res: Response) => {
  try {
    const { id: userId } = userReq(req);
    const complaintId = parseInt(req.params.id as any);
    const file = (req as any).file;

    if (!file) return res.status(400).json({ success: false, message: "Aucun fichier reçu" });

    const filename = file.filename || path.basename(file.path);
    const fileUrl  = `uploads/evidence/${filename}`;

    const attachment = await Attachment.create({
      complaintId,
      uploadedBy: userId,
      fileUrl,
      filename: file.originalname || filename,
    });

    return res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const transmitToHierarchy = async (req: Request, res: Response) => {
  try {
    const { role } = userReq(req);
    const complaint = await Complaint.findByPk(req.params.id as any);
    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });

    const allowed = TRANSITIONS[complaint.status]?.[role] || [];
    if (!allowed.includes("attente_validation")) return res.status(403).json({ success: false, message: "Action non autorisée." });

    await complaint.update({ status: "attente_validation" });
    return res.json({ success: true, data: complaint });
  } catch (error) { return res.status(500).json({ success: false, message: "Erreur serveur" }); }
};

export const validateToParquet = async (req: Request, res: Response) => {
  try {
    const { role } = userReq(req);
    const complaint = await Complaint.findByPk(req.params.id as any);
    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });

    const allowed = TRANSITIONS[complaint.status]?.[role] || [];
    if (!allowed.includes("transmise_parquet")) return res.status(403).json({ success: false, message: "Action réservée au Commissaire." });

    await complaint.update({ status: "transmise_parquet", validatedByCommissaire: true });
    return res.json({ success: true, data: complaint });
  } catch (error) { return res.status(500).json({ success: false, message: "Erreur serveur" }); }
};