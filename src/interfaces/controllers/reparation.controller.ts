import { Request, Response } from "express";
import Reparation from "../../models/reparation.model";

export const createReparation = async (req: Request, res: Response) => {
  try {
    const { caseId, amount, type, status, orderedAt } = req.body;

    if (!caseId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, amount)",
      });
    }

    const reparation = await Reparation.create({
      caseId,
      amount,
      type,
      status: status || "pending",
      orderedAt: orderedAt || new Date(),
    });

    return res.status(201).json({ success: true, data: reparation });
  } catch (error: any) {
    console.error("Erreur création réparation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la réparation",
    });
  }
};

export const getReparations = async (_req: Request, res: Response) => {
  try {
    const reparations = await Reparation.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: reparations });
  } catch (error: any) {
    console.error("Erreur récupération réparations:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réparations",
    });
  }
};
