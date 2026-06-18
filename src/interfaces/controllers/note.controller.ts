import { Request, Response } from "express";
import Note from "../../models/note.model";

export const listNotes = async (_req: Request, res: Response) => {
  try {
    const notes = await Note.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: notes });
  } catch (error: any) {
    console.error("Erreur récupération notes:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notes",
    });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const { caseId, content, authorId } = req.body;

    if (!caseId || !content || !authorId) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, content, authorId)",
      });
    }

    const note = await Note.create({
      caseId,
      content,
      authorId,
    });

    return res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    console.error("Erreur création note:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la note",
    });
  }
};

export const getNote = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note introuvable" });
    }

    return res.json({ success: true, data: note });
  } catch (error: any) {
    console.error("Erreur récupération note:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la note",
    });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note introuvable" });
    }

    await note.update(req.body);
    return res.json({ success: true, data: note });
  } catch (error: any) {
    console.error("Erreur mise à jour note:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la note",
    });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note introuvable" });
    }

    await note.destroy();
    return res.json({ success: true, message: "Note supprimée" });
  } catch (error: any) {
    console.error("Erreur suppression note:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la note",
    });
  }
};
