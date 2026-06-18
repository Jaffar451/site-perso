import { Request, Response } from "express";
import Prosecution from "../../models/prosecution.model";

export const createProsecution = async (req: Request, res: Response) => {
  try {
    const { caseId, prosecutorId, charges, filedAt, status } = req.body;

    if (!caseId || !prosecutorId || !charges) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, prosecutorId, charges)",
      });
    }

    const prosecution = await Prosecution.create({
      caseId,
      prosecutorId,
      charges,
      filedAt: filedAt || new Date(),
      status: status || "pending",
    });

    return res.status(201).json({ success: true, data: prosecution });
  } catch (error: any) {
    console.error("Erreur création poursuite:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la poursuite",
    });
  }
};

export const getProsecutions = async (_req: Request, res: Response) => {
  try {
    const prosecutions = await Prosecution.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: prosecutions });
  } catch (error: any) {
    console.error("Erreur récupération poursuites:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des poursuites",
    });
  }
};
