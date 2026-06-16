import { Request, Response } from "express";
import Court from "../../models/court.model";
import CaseModel from "../../models/case.model";
import Hearing from "../../models/hearing.model";

// 1. Lister tous les tribunaux
export const listCourts = async (_req: Request, res: Response) => {
  try {
    const courts = await Court.findAll({ order: [['name', 'ASC']] });
    
    // 🔍 LOG DE DÉBOGAGE
    console.log(`📊 ${courts.length} tribunaux trouvés en BDD`);
    console.log("📋 Données:", JSON.stringify(courts, null, 2));
    
    return res.status(200).json({ success: true, data: courts });
  } catch (error) {
    console.error("Erreur listCourts:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// 2. Récupérer un tribunal avec ses dossiers et audiences liés
export const getCourt = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "ID invalide" });

    const court = await Court.findByPk(id, {
      include: [
        { model: CaseModel, as: "courtCases" },
        { model: Hearing, as: "hearings" }
      ]
    });

    if (!court) return res.status(404).json({ success: false, message: "Tribunal introuvable" });
    return res.status(200).json({ success: true, data: court });
  } catch (error) {
    console.error("Erreur getCourt:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// 3. Créer un tribunal
export const createCourt = async (req: Request, res: Response) => {
  try {
    // Note: Ajoutez ici une validation (ex: Zod ou Joi) pour req.body
    const court = await Court.create(req.body);
    return res.status(201).json({ success: true, data: court });
  } catch (error) {
    console.error("Erreur createCourt:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la création du tribunal" });
  }
};

// 4. Mettre à jour un tribunal
export const updateCourt = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "ID invalide" });

    const court = await Court.findByPk(id);
    if (!court) return res.status(404).json({ success: false, message: "Tribunal introuvable" });

    // Sécurité: on ne met à jour que les champs autorisés
    const { name, address, city, jurisdiction } = req.body;
    await court.update({ name, address, city, jurisdiction });
    
    return res.status(200).json({ success: true, data: court });
  } catch (error) {
    console.error("Erreur updateCourt:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour" });
  }
};

// 5. Supprimer un tribunal
export const deleteCourt = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "ID invalide" });

    const court = await Court.findByPk(id);
    if (!court) return res.status(404).json({ success: false, message: "Tribunal introuvable" });
    
    await court.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error("Erreur deleteCourt:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
  }
};