import { Request, Response } from "express";
import Indictment from "../../models/indictment.model";

export const createIndictment = async (req: Request, res: Response) => {
  try {
    const { caseId, charges, issuedAt, status } = req.body;

    if (!caseId || !charges) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants (caseId, charges)",
      });
    }

    const indictment = await Indictment.create({
      caseId,
      charges,
      issuedAt: issuedAt || new Date(),
      status: status || "pending",
    });

    return res.status(201).json({ success: true, data: indictment });
  } catch (error: any) {
    console.error("Erreur création mise en accusation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la mise en accusation",
    });
  }
};

export const getIndictment = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const indictment = await Indictment.findByPk(id);

    if (!indictment) {
      return res.status(404).json({ success: false, message: "Mise en accusation introuvable" });
    }

    return res.json({ success: true, data: indictment });
  } catch (error: any) {
    console.error("Erreur récupération mise en accusation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la mise en accusation",
    });
  }
};

export const updateIndictment = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const indictment = await Indictment.findByPk(id);

    if (!indictment) {
      return res.status(404).json({ success: false, message: "Mise en accusation introuvable" });
    }

    await indictment.update(req.body);
    return res.json({ success: true, data: indictment });
  } catch (error: any) {
    console.error("Erreur mise à jour mise en accusation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la mise en accusation",
    });
  }
};

export const deleteIndictment = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const indictment = await Indictment.findByPk(id);

    if (!indictment) {
      return res.status(404).json({ success: false, message: "Mise en accusation introuvable" });
    }

    await indictment.destroy();
    return res.json({ success: true, message: "Mise en accusation supprimée" });
  } catch (error: any) {
    console.error("Erreur suppression mise en accusation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la mise en accusation",
    });
  }
};
