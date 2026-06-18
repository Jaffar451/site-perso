import { Request, Response } from "express";
import Interrogation from "../../models/interrogation.model";

export const createInterrogation = async (req: Request, res: Response) => {
  try {
    const { caseId, personId, content, conductedAt, conductedBy } = req.body;

    if (!caseId || !personId || !content) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, personId, content)",
      });
    }

    const interrogation = await Interrogation.create({
      caseId,
      personId,
      content,
      conductedAt: conductedAt || new Date(),
      conductedBy,
    });

    return res.status(201).json({ success: true, data: interrogation });
  } catch (error: any) {
    console.error("Erreur création interrogatoire:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'interrogatoire",
    });
  }
};

export const getAllInterrogations = async (_req: Request, res: Response) => {
  try {
    const interrogations = await Interrogation.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: interrogations });
  } catch (error: any) {
    console.error("Erreur récupération interrogatoires:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des interrogatoires",
    });
  }
};

export const getInterrogation = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const interrogation = await Interrogation.findByPk(id);

    if (!interrogation) {
      return res.status(404).json({ success: false, message: "Interrogatoire introuvable" });
    }

    return res.json({ success: true, data: interrogation });
  } catch (error: any) {
    console.error("Erreur récupération interrogatoire:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'interrogatoire",
    });
  }
};

export const updateInterrogation = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const interrogation = await Interrogation.findByPk(id);

    if (!interrogation) {
      return res.status(404).json({ success: false, message: "Interrogatoire introuvable" });
    }

    await interrogation.update(req.body);
    return res.json({ success: true, data: interrogation });
  } catch (error: any) {
    console.error("Erreur mise à jour interrogatoire:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'interrogatoire",
    });
  }
};

export const deleteInterrogation = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const interrogation = await Interrogation.findByPk(id);

    if (!interrogation) {
      return res.status(404).json({ success: false, message: "Interrogatoire introuvable" });
    }

    await interrogation.destroy();
    return res.json({ success: true, message: "Interrogatoire supprimé" });
  } catch (error: any) {
    console.error("Erreur suppression interrogatoire:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'interrogatoire",
    });
  }
};
