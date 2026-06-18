import { Request, Response } from "express";
import Sentence from "../../models/sentence.model";

export const createSentence = async (req: Request, res: Response) => {
  try {
    const { caseId, type, duration, details, issuedAt } = req.body;

    if (!caseId || !type) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, type)",
      });
    }

    const sentence = await Sentence.create({
      caseId,
      type,
      duration,
      details,
      issuedAt: issuedAt || new Date(),
    });

    return res.status(201).json({ success: true, data: sentence });
  } catch (error: any) {
    console.error("Erreur création condamnation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la condamnation",
    });
  }
};

export const getSentences = async (_req: Request, res: Response) => {
  try {
    const sentences = await Sentence.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: sentences });
  } catch (error: any) {
    console.error("Erreur récupération condamnations:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des condamnations",
    });
  }
};

export const getSentence = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sentence = await Sentence.findByPk(id);

    if (!sentence) {
      return res.status(404).json({ success: false, message: "Condamnation introuvable" });
    }

    return res.json({ success: true, data: sentence });
  } catch (error: any) {
    console.error("Erreur récupération condamnation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la condamnation",
    });
  }
};

export const updateSentence = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sentence = await Sentence.findByPk(id);

    if (!sentence) {
      return res.status(404).json({ success: false, message: "Condamnation introuvable" });
    }

    await sentence.update(req.body);
    return res.json({ success: true, data: sentence });
  } catch (error: any) {
    console.error("Erreur mise à jour condamnation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la condamnation",
    });
  }
};

export const deleteSentence = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sentence = await Sentence.findByPk(id);

    if (!sentence) {
      return res.status(404).json({ success: false, message: "Condamnation introuvable" });
    }

    await sentence.destroy();
    return res.json({ success: true, message: "Condamnation supprimée" });
  } catch (error: any) {
    console.error("Erreur suppression condamnation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la condamnation",
    });
  }
};
