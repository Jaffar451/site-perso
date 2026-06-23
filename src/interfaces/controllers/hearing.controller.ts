import { Request, Response } from "express";
import { Op } from "sequelize";
import Hearing from "../../models/hearing.model";

// 1. Lister toutes les audiences
export const listHearings = async (req: Request, res: Response) => {
  try {
    const { getPagination, formatPaginatedResponse } = require("../../utils/pagination");
    const { page, limit, offset } = getPagination(req);
    const { count, rows: hearings } = await Hearing.findAndCountAll({ order: [["createdAt", "DESC"]], limit, offset });
    return res.json(formatPaginatedResponse(hearings, count, page, limit));
  } catch (error: any) {
    console.error("Erreur listHearings:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lister les audiences par dossier
export const listHearingsByCase = async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.caseId as string, 10);
    if (isNaN(caseId))
      return res.status(400).json({ success: false, message: "caseId invalide" });

    const hearings = await Hearing.findAll({
      where: { caseId },
      order: [["date", "ASC"]],
    });
    return res.status(200).json({ success: true, data: hearings });
  } catch (error: any) {
    console.error("Erreur listHearingsByCase:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Creer une audience
export const createHearing = async (req: Request, res: Response) => {
  try {
    const hearing = await Hearing.create(req.body);
    return res.status(201).json({ success: true, data: hearing });
  } catch (error: any) {
    console.error("Erreur createHearing:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Recuperer une audience par ID
export const getHearing = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const hearing = await Hearing.findByPk(id);
    if (!hearing)
      return res.status(404).json({ success: false, message: "Audience introuvable" });

    return res.status(200).json({ success: true, data: hearing });
  } catch (error: any) {
    console.error("Erreur getHearing:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Mettre a jour une audience
export const updateHearing = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const hearing = await Hearing.findByPk(id);
    if (!hearing)
      return res.status(404).json({ success: false, message: "Audience introuvable" });

    await hearing.update(req.body);
    return res.status(200).json({ success: true, data: hearing });
  } catch (error: any) {
    console.error("Erreur updateHearing:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Supprimer une audience (existant)
export const deleteHearing = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const hearing = await Hearing.findByPk(id);
    if (!hearing)
      return res.status(404).json({ success: false, message: "Audience introuvable" });

    await hearing.destroy();
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erreur deleteHearing:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Role du jour (audiences du jour)
export const getDailyRoll = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hearings = await Hearing.findAll({
      where: {
        date: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
      order: [["date", "ASC"]],
    });
    return res.status(200).json({ success: true, data: hearings });
  } catch (error: any) {
    console.error("Erreur getDailyRoll:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
