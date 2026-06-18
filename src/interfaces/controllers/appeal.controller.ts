import { Request, Response } from "express";
import Appeal from "../../models/appeal.model";

export const createAppeal = async (req: Request, res: Response) => {
  try {
    const { caseId, appellantId, reason, status, appealDate, contestedDecisionId, lawyerId } = req.body;

    if (!caseId || !appellantId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, appellantId, reason)",
      });
    }

    const appeal = await Appeal.create({
      caseId,
      appellantId,
      reason,
      status: status || "pending",
      appealDate: appealDate || new Date(),
      contestedDecisionId,
      lawyerId,
    });

    return res.status(201).json({ success: true, data: appeal });
  } catch (error: any) {
    console.error("Erreur création appel:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'appel",
    });
  }
};

export const getAppeals = async (_req: Request, res: Response) => {
  try {
    const appeals = await Appeal.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: appeals });
  } catch (error: any) {
    console.error("Erreur récupération appels:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des appels",
    });
  }
};
