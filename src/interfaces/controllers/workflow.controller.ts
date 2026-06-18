import { Request, Response } from "express";
import { Complaint, CaseModel } from "../../models";

export const prosecute = async (req: Request, res: Response) => {
  try {
    const { complaintId, charges } = req.body;
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });
    await complaint.update({ status: "saisi_juge" });
    return res.json({ success: true, message: "Dossier transmis au juge", data: complaint });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const dismiss = async (req: Request, res: Response) => {
  try {
    const { complaintId, reason } = req.body;
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });
    await complaint.update({ status: "classée_sans_suite_par_procureur" });
    return res.json({ success: true, message: "Affaire classée sans suite", data: complaint });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const handleFlagrantDelict = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.body;
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Plainte introuvable" });
    await complaint.update({ status: "instruction" });
    return res.json({ success: true, message: "Procédure de flagrant délit engagée", data: complaint });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
