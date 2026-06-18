import { Request, Response } from "express";
import Summon from "../../models/summon.model";

// 1. Creer une convocation
export const createSummon = async (req: Request, res: Response) => {
  try {
    const summon = await Summon.create(req.body);
    return res.status(201).json({ success: true, data: summon });
  } catch (error: any) {
    console.error("Erreur createSummon:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lister toutes les convocations
export const listSummons = async (_req: Request, res: Response) => {
  try {
    const summons = await Summon.findAll({ order: [["createdAt", "DESC"]] });
    return res.status(200).json({ success: true, data: summons });
  } catch (error: any) {
    console.error("Erreur listSummons:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lister les convocations par plainte
export const getSummonsByComplaint = async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.complaintId as string, 10);
    if (isNaN(complaintId))
      return res
        .status(400)
        .json({ success: false, message: "complaintId invalide" });

    const summons = await Summon.findAll({
      where: { complaintId },
      order: [["scheduledAt", "ASC"]],
    });
    return res.status(200).json({ success: true, data: summons });
  } catch (error: any) {
    console.error("Erreur getSummonsByComplaint:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre a jour le statut d'une convocation
export const updateSummonStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const summon = await Summon.findByPk(id);
    if (!summon)
      return res
        .status(404)
        .json({ success: false, message: "Convocation introuvable" });

    const { status } = req.body;
    if (!status)
      return res
        .status(400)
        .json({ success: false, message: "Le champ status est requis" });

    await summon.update({ status });
    return res.status(200).json({ success: true, data: summon });
  } catch (error: any) {
    console.error("Erreur updateSummonStatus:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
