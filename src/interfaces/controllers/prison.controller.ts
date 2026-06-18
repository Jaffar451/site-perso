import { Request, Response } from "express";
import Prison from "../../models/prison.model";

// 1. Lister toutes les prisons
export const listPrisons = async (_req: Request, res: Response) => {
  try {
    const prisons = await Prison.findAll({ order: [["createdAt", "DESC"]] });
    return res.status(200).json({ success: true, data: prisons });
  } catch (error: any) {
    console.error("Erreur listPrisons:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Recuperer une prison par ID
export const getPrison = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const prison = await Prison.findByPk(id);
    if (!prison)
      return res.status(404).json({ success: false, message: "Prison introuvable" });

    return res.status(200).json({ success: true, data: prison });
  } catch (error: any) {
    console.error("Erreur getPrison:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Creer une prison
export const createPrison = async (req: Request, res: Response) => {
  try {
    const prison = await Prison.create(req.body);
    return res.status(201).json({ success: true, data: prison });
  } catch (error: any) {
    console.error("Erreur createPrison:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre a jour une prison
export const updatePrison = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const prison = await Prison.findByPk(id);
    if (!prison)
      return res.status(404).json({ success: false, message: "Prison introuvable" });

    await prison.update(req.body);
    return res.status(200).json({ success: true, data: prison });
  } catch (error: any) {
    console.error("Erreur updatePrison:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
