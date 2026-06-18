import { Request, Response } from "express";
import Decision from "../../models/decision.model";

// 1. Lister toutes les decisions
export const listDecisions = async (_req: Request, res: Response) => {
  try {
    const decisions = await Decision.findAll({ order: [["createdAt", "DESC"]] });
    return res.status(200).json({ success: true, data: decisions });
  } catch (error: any) {
    console.error("Erreur listDecisions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lister les decisions par dossier
export const listDecisionsByCase = async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.caseId as string, 10);
    if (isNaN(caseId))
      return res.status(400).json({ success: false, message: "caseId invalide" });

    const decisions = await Decision.findAll({
      where: { caseId },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ success: true, data: decisions });
  } catch (error: any) {
    console.error("Erreur listDecisionsByCase:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Creer une decision
export const createDecision = async (req: Request, res: Response) => {
  try {
    const decision = await Decision.create(req.body);
    return res.status(201).json({ success: true, data: decision });
  } catch (error: any) {
    console.error("Erreur createDecision:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Recuperer une decision par ID
export const getDecision = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const decision = await Decision.findByPk(id);
    if (!decision)
      return res.status(404).json({ success: false, message: "Decision introuvable" });

    return res.status(200).json({ success: true, data: decision });
  } catch (error: any) {
    console.error("Erreur getDecision:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Mettre a jour une decision
export const updateDecision = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const decision = await Decision.findByPk(id);
    if (!decision)
      return res.status(404).json({ success: false, message: "Decision introuvable" });

    await decision.update(req.body);
    return res.status(200).json({ success: true, data: decision });
  } catch (error: any) {
    console.error("Erreur updateDecision:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Supprimer une decision (existant)
export const deleteDecision = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const decision = await Decision.findByPk(id);
    if (!decision)
      return res.status(404).json({ success: false, message: "Decision introuvable" });

    await decision.destroy();
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erreur deleteDecision:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Signer une decision
export const signDecision = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const decision = await Decision.findByPk(id);
    if (!decision)
      return res.status(404).json({ success: false, message: "Decision introuvable" });

    await decision.update({
      signedAt: new Date(),
      status: "signed",
    });
    return res.status(200).json({ success: true, data: decision });
  } catch (error: any) {
    console.error("Erreur signDecision:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
