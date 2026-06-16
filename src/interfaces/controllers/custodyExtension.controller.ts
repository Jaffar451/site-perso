import { Request, Response } from "express";
import { CustodyExtension, Person, User, Custody } from "../../models";

// 1. Créer une prolongation
export const createCustodyExtension = async (req: Request, res: Response) => {
  try {
    const newExtension = await CustodyExtension.create(req.body);
    
    // Si la prolongation est liée à une garde à vue, on peut mettre à jour son statut
    if (req.body.custodyId) {
      await Custody.update(
        { status: "prolongée" }, 
        { where: { id: req.body.custodyId } }
      );
    }

    res.status(201).json({ success: true, data: newExtension });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur création", error });
  }
};

// 2. Récupérer toutes les prolongations
export const getCustodyExtensions = async (_: Request, res: Response) => {
  try {
    const data = await CustodyExtension.findAll({
      include: ["suspect", "requester", "custody"]
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};

// 3. Récupérer une prolongation par ID (MANQUANT PRÉCÉDEMMENT)
export const getCustodyExtensionById = async (req: Request, res: Response) => {
  try {
    // On force la conversion en string pour satisfaire Sequelize
    const id = req.params.id as string; 

    const data = await CustodyExtension.findByPk(id, {
      include: ["suspect", "requester", "custody"]
    });
    
    if (!data) return res.status(404).json({ success: false, message: "Non trouvé" });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};

// 4. Mettre à jour une prolongation (MANQUANT PRÉCÉDEMMENT)
export const updateCustodyExtension = async (req: Request, res: Response) => {
  try {
    const [updated] = await CustodyExtension.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) return res.status(404).json({ success: false, message: "Introuvable" });
    res.status(200).json({ success: true, message: "Mise à jour réussie" });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};

// 5. Supprimer une prolongation (MANQUANT PRÉCÉDEMMENT)
export const deleteCustodyExtension = async (req: Request, res: Response) => {
  try {
    const deleted = await CustodyExtension.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) return res.status(404).json({ success: false, message: "Introuvable" });
    res.status(200).json({ success: true, message: "Suppression réussie" });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};