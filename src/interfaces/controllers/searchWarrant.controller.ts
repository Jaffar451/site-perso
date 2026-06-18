import { Request, Response } from "express";
import SearchWarrant from "../../models/searchWarrant.model";

export const createSearchWarrant = async (req: Request, res: Response) => {
  try {
    const { caseId, location, reason, issuedAt, executedAt } = req.body;

    if (!caseId || !location || !reason) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, location, reason)",
      });
    }

    const searchWarrant = await SearchWarrant.create({
      caseId,
      location,
      reason,
      issuedAt: issuedAt || new Date(),
      executedAt,
    });

    return res.status(201).json({ success: true, data: searchWarrant });
  } catch (error: any) {
    console.error("Erreur création mandat de perquisition:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du mandat de perquisition",
    });
  }
};

export const getSearchWarrants = async (_req: Request, res: Response) => {
  try {
    const warrants = await SearchWarrant.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: warrants });
  } catch (error: any) {
    console.error("Erreur récupération mandats de perquisition:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des mandats de perquisition",
    });
  }
};
