import { Request, Response } from "express";
import PreventiveDetention from "../../models/preventiveDetention.model";

export const createPreventiveDetention = async (req: Request, res: Response) => {
  try {
    const { caseId, detaineeId, startDate, endDate, reason } = req.body;

    if (!caseId || !detaineeId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, detaineeId, reason)",
      });
    }

    const preventiveDetention = await PreventiveDetention.create({
      caseId,
      detaineeId,
      startDate: startDate || new Date(),
      endDate,
      reason,
    });

    return res.status(201).json({ success: true, data: preventiveDetention });
  } catch (error: any) {
    console.error("Erreur création détention préventive:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la détention préventive",
    });
  }
};

export const getAllPreventiveDetentions = async (_req: Request, res: Response) => {
  try {
    const detentions = await PreventiveDetention.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: detentions });
  } catch (error: any) {
    console.error("Erreur récupération détentions préventives:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détentions préventives",
    });
  }
};
