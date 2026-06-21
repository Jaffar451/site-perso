import { Request, Response } from "express";
import ArrestWarrant from "../../models/arrestWarrant.model"; // Ajuste le chemin selon ta structure
import CaseModel from "../../models/case.model";
import User from "../../models/user.model";

/**
 * ⚖️ CRÉER UN MANDAT D'ARRÊT
 */
export const createArrestWarrant = async (req: Request, res: Response) => {
  try {
    const { 
      caseId, 
      personName, 
      reason, 
      suspectAddress, 
      issuingJudgeId 
    } = req.body;

    // Validation de base
    if (!caseId || !personName || !reason || !issuingJudgeId) {
      return res.status(400).json({ 
        success: false, 
        message: "Champs obligatoires manquants (caseId, personName, reason, issuingJudgeId)" 
      });
    }

    // Création dans la base de données
    const warrant = await ArrestWarrant.create({
      caseId,
      personName,
      reason,
      suspectAddress,
      issuingJudgeId,
      issuedAt: new Date(),
      executed: false
    });

    return res.status(201).json({ 
      success: true, 
      data: warrant 
    });

  } catch (error: any) {
    console.error("Erreur création mandat:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la création du mandat d'arrêt" 
    });
  }
};

/**
 * 📋 RÉCUPÉRER TOUS LES MANDATS (AVEC JOINTURES)
 */
export const getArrestWarrants = async (req: Request, res: Response) => {
  try {
    // On récupère les mandats en incluant les infos de l'affaire et du juge
    const warrants = await ArrestWarrant.findAll({
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: warrants
    });

  } catch (error: any) {
    console.error("Erreur récupération mandats:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des mandats"
    });
  }
};

export const getActiveWarrants = async (_req: Request, res: Response) => {
  try {
    const warrants = await ArrestWarrant.findAll({
      where: { executed: false },
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, data: warrants });
  } catch (error: any) {
    console.error("Erreur getActiveWarrants:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const updateWarrantStatus = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const warrant = await ArrestWarrant.findByPk(id);
    if (!warrant) return res.status(404).json({ success: false, message: "Mandat introuvable" });
    if (status === "executed") (warrant as any).executed = true;
    if (status === "cancelled") (warrant as any).executed = false;
    await warrant.save();
    return res.json({ success: true, data: warrant });
  } catch (error: any) {
    console.error("Erreur updateWarrantStatus:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const executeWarrant = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.warrantId || req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const warrant = await ArrestWarrant.findByPk(id);
    if (!warrant) return res.status(404).json({ success: false, message: "Mandat introuvable" });
    (warrant as any).executed = true;
    (warrant as any).executedAt = new Date();
    await warrant.save();
    return res.json({ success: true, data: warrant, message: "Mandat exécuté" });
  } catch (error: any) {
    console.error("Erreur executeWarrant:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};