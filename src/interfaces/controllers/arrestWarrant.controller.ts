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
      include: [
        { model: CaseModel, as: 'case', attributes: ['id', 'title', 'trackingCode'] },
        { model: User, as: 'judge', attributes: ['id', 'firstname', 'lastname'] }
      ],
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