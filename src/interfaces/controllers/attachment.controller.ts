import { Request, Response } from "express";
import Attachment from "../../models/attachment.model";
import Complaint from "../../models/complaint.model";

const userReq = (req: Request) => (req as any).user as { id: number; role: string };
const getParam = (p: string | string[]): string => Array.isArray(p) ? p[0] : p;

export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const { id: userId } = userReq(req);
    const complaintId = parseInt(getParam(req.params.id));

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Plainte introuvable" });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Aucun fichier reçu" });
    }

    const attachment = await Attachment.create({
      complaintId,
      uploadedBy: userId,
      fileUrl: file.path || file.location || file.filename || "",
      filename: file.originalname || file.filename || "upload",
    });

    return res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    console.error("Error in uploadAttachment:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const listAttachments = async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(getParam(req.params.id));

    const attachments = await Attachment.findAll({
      where: { complaintId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: attachments });
  } catch (error) {
    console.error("Error in listAttachments:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const { id: userId, role } = userReq(req);
    const attachmentId = parseInt(getParam(req.params.attachmentId));

    const attachment = await Attachment.findByPk(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Pièce jointe introuvable" });
    }

    if ((attachment as any).uploadedBy !== userId && role !== "admin") {
      return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    await attachment.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error("Error in deleteAttachment:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};