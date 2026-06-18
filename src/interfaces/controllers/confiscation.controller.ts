import { Request, Response } from "express";
import Confiscation from "../../models/confiscation.model";

export const createConfiscation = async (req: Request, res: Response) => {
  try {
    const { caseId, description, type, status, confiscatedAt } = req.body;

    if (!caseId || !description) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, description)",
      });
    }

    const confiscation = await Confiscation.create({
      caseId,
      description,
      type,
      status: status || "pending",
      confiscatedAt: confiscatedAt || new Date(),
    });

    return res.status(201).json({ success: true, data: confiscation });
  } catch (error: any) {
    console.error("Erreur création confiscation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la confiscation",
    });
  }
};

export const getConfiscations = async (_req: Request, res: Response) => {
  try {
    const confiscations = await Confiscation.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: confiscations });
  } catch (error: any) {
    console.error("Erreur récupération confiscations:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des confiscations",
    });
  }
};
