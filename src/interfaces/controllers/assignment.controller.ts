import { Request, Response } from "express";
import Assignment from "../../models/assignment.model";

export const listAssignments = async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error("Erreur récupération affectations:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des affectations",
    });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { caseId, userId, role, assignedAt } = req.body;

    if (!caseId || !userId || !role) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, userId, role)",
      });
    }

    const assignment = await Assignment.create({
      caseId,
      userId,
      role,
      assignedAt: assignedAt || new Date(),
    });

    return res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    console.error("Erreur création affectation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'affectation",
    });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Affectation introuvable" });
    }

    return res.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error("Erreur récupération affectation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'affectation",
    });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Affectation introuvable" });
    }

    await assignment.update(req.body);
    return res.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error("Erreur mise à jour affectation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'affectation",
    });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const assignment = await Assignment.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Affectation introuvable" });
    }

    await assignment.destroy();
    return res.json({ success: true, message: "Affectation supprimée" });
  } catch (error: any) {
    console.error("Erreur suppression affectation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'affectation",
    });
  }
};
