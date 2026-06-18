import { Request, Response } from "express";
import Release from "../../models/release.model";

export const createRelease = async (req: Request, res: Response) => {
  try {
    const { caseId, detaineeId, type, conditions, releasedAt } = req.body;

    if (!caseId || !detaineeId) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, detaineeId)",
      });
    }

    const release = await Release.create({
      caseId,
      detaineeId,
      type,
      conditions,
      releasedAt: releasedAt || new Date(),
    });

    return res.status(201).json({ success: true, data: release });
  } catch (error: any) {
    console.error("Erreur création libération:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la libération",
    });
  }
};

export const getReleases = async (_req: Request, res: Response) => {
  try {
    const releases = await Release.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: releases });
  } catch (error: any) {
    console.error("Erreur récupération libérations:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des libérations",
    });
  }
};
