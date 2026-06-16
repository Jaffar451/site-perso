import { Request, Response } from "express";
import CaseModel from "../../models/case.model";
import Court from "../../models/court.model";
import Assignment from "../../models/assignment.model";

// Helper pour extraire l'ID de manière sécurisée
const parseId = (id: string | string[] | undefined): number => {
  const strId = Array.isArray(id) ? id[0] : id;
  return parseInt(strId || "", 10);
};

// 1. Lister tous les dossiers
export const listCases = async (_req: Request, res: Response) => {
  try {
    const cases = await CaseModel.findAll({
      include: [{ model: Court, as: "court" }],
      order: [['openedAt', 'DESC']]
    });
    return res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error("Erreur listCases:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des dossiers" });
  }
};

// 2. Lister les dossiers de l'utilisateur connecté
export const listMyCases = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Utilisateur non authentifié" });

    const cases = await CaseModel.findAll({
      include: [{ 
        model: Assignment, 
        as: "assignments",
        where: { userId },
        required: true // INNER JOIN pour ne retourner que les dossiers assignés
      }]
    });
    return res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error("Erreur listMyCases:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération de vos dossiers" });
  }
};

// 3. Créer un nouveau dossier
export const createCase = async (req: Request, res: Response) => {
  try {
    const newCase = await CaseModel.create(req.body);
    return res.status(201).json({ success: true, data: newCase });
  } catch (error) {
    console.error("Erreur createCase:", error);
    return res.status(400).json({ success: false, message: "Erreur lors de la création du dossier" });
  }
};

// 4. Récupérer un dossier détaillé
export const getCase = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "ID invalide" });

    const caseItem = await CaseModel.findByPk(id, {
      include: [
        { model: Court, as: "court" },
        { model: Assignment, as: "assignments" }
      ]
    });

    if (!caseItem) return res.status(404).json({ success: false, message: "Dossier introuvable" });
    return res.status(200).json({ success: true, data: caseItem });
  } catch (error) {
    console.error("Erreur getCase:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// 5. Mettre à jour un dossier
export const updateCase = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "ID invalide" });

    // Sécurisation : on ne met à jour que les champs autorisés
    const { reference, description, type, priority, stage, courtId } = req.body;
    
    const [updatedCount] = await CaseModel.update(
      { reference, description, type, priority, stage, courtId }, 
      { where: { id } }
    );
    
    if (updatedCount === 0) return res.status(404).json({ success: false, message: "Dossier introuvable ou aucune donnée modifiée" });
    
    const updatedCase = await CaseModel.findByPk(id);
    return res.status(200).json({ success: true, data: updatedCase });
  } catch (error) {
    console.error("Erreur updateCase:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour" });
  }
};