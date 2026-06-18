import { Request, Response } from "express";
import Witness from "../../models/witness.model";

export const createWitness = async (req: Request, res: Response) => {
  try {
    const { caseId, personId, statement, hearingDate } = req.body;

    if (!caseId || !personId) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, personId)",
      });
    }

    const witness = await Witness.create({
      caseId,
      personId,
      statement,
      hearingDate,
    });

    return res.status(201).json({ success: true, data: witness });
  } catch (error: any) {
    console.error("Erreur création témoin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du témoin",
    });
  }
};

export const getWitnesses = async (_req: Request, res: Response) => {
  try {
    const witnesses = await Witness.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: witnesses });
  } catch (error: any) {
    console.error("Erreur récupération témoins:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des témoins",
    });
  }
};
