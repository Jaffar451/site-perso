import { Request, Response } from "express";
import Evidence from "../../models/evidence.model";

// 1. Lister toutes les preuves
export const listEvidence = async (_req: Request, res: Response) => {
  try {
    const evidence = await Evidence.findAll({ order: [["createdAt", "DESC"]] });
    return res.status(200).json({ success: true, data: evidence });
  } catch (error: any) {
    console.error("Erreur listEvidence:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Creer une preuve
export const createEvidence = async (req: Request, res: Response) => {
  try {
    const evidence = await Evidence.create(req.body);
    return res.status(201).json({ success: true, data: evidence });
  } catch (error: any) {
    console.error("Erreur createEvidence:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Recuperer une preuve par ID
export const getEvidence = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const evidence = await Evidence.findByPk(id);
    if (!evidence)
      return res.status(404).json({ success: false, message: "Preuve introuvable" });

    return res.status(200).json({ success: true, data: evidence });
  } catch (error: any) {
    console.error("Erreur getEvidence:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Mettre a jour une preuve
export const updateEvidence = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const evidence = await Evidence.findByPk(id);
    if (!evidence)
      return res.status(404).json({ success: false, message: "Preuve introuvable" });

    await evidence.update(req.body);
    return res.status(200).json({ success: true, data: evidence });
  } catch (error: any) {
    console.error("Erreur updateEvidence:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Supprimer une preuve (existant)
export const deleteEvidence = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const evidence = await Evidence.findByPk(id);
    if (!evidence)
      return res.status(404).json({ success: false, message: "Preuve introuvable" });

    await evidence.destroy();
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erreur deleteEvidence:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
