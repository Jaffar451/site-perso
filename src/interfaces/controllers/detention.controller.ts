import { Request, Response } from "express";
import Detention from "../../models/detention.model";

export const createDetention = async (req: Request, res: Response) => {
  try {
    const { caseId, detaineeId, startDate, endDate, reason, status } = req.body;

    if (!caseId || !detaineeId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, detaineeId, reason)",
      });
    }

    const detention = await Detention.create({
      caseId,
      detaineeId,
      startDate: startDate || new Date(),
      endDate,
      reason,
      status: status || "active",
    });

    return res.status(201).json({ success: true, data: detention });
  } catch (error: any) {
    console.error("Erreur création détention:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la détention",
    });
  }
};

export const getAllDetentions = async (_req: Request, res: Response) => {
  try {
    const detentions = await Detention.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: detentions });
  } catch (error: any) {
    console.error("Erreur récupération détentions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détentions",
    });
  }
};

export const getDetention = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const detention = await Detention.findByPk(id);

    if (!detention) {
      return res.status(404).json({ success: false, message: "Détention introuvable" });
    }

    return res.json({ success: true, data: detention });
  } catch (error: any) {
    console.error("Erreur récupération détention:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la détention",
    });
  }
};

export const updateDetention = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const detention = await Detention.findByPk(id);

    if (!detention) {
      return res.status(404).json({ success: false, message: "Détention introuvable" });
    }

    await detention.update(req.body);
    return res.json({ success: true, data: detention });
  } catch (error: any) {
    console.error("Erreur mise à jour détention:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la détention",
    });
  }
};

export const deleteDetention = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const detention = await Detention.findByPk(id);

    if (!detention) {
      return res.status(404).json({ success: false, message: "Détention introuvable" });
    }

    await detention.destroy();
    return res.json({ success: true, message: "Détention supprimée" });
  } catch (error: any) {
    console.error("Erreur suppression détention:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la détention",
    });
  }
};
