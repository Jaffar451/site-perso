import { Request, Response } from 'express';
import { Custody, Person, User } from '../../models'; // Utilisation de l'index des modèles

// 1. Créer une nouvelle garde à vue
export const createCustody = async (req: Request, res: Response) => {
  try {
    const newCustody = await Custody.create(req.body);
    res.status(201).json({ success: true, data: newCustody });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur création', error });
  }
};

// 2. Récupérer toutes les gardes à vue
export const getAllCustodies = async (req: Request, res: Response) => {
  try {
    const data = await Custody.findAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur récupération', error });
  }
};

// 3. Récupérer uniquement les gardes à vue "actives"
export const getActiveCustodies = async (req: Request, res: Response) => {
  try {
    const data = await Custody.findAll({ 
      where: { 
        status: 'en_cours' // ✅ Utilise la valeur exacte de ton ENUM
      },
      include: [
        { model: Person, as: 'suspect' },      // Optionnel : pour voir qui est en garde à vue
        { model: User, as: 'orderedByUser' }   // Optionnel : pour voir quel agent a ordonné
      ]
    });
    
    res.status(200).json({ success: true, data });
  } catch (error) {
    // Affiche l'erreur en console pour le debug si ça persiste
    console.error(error); 
    res.status(500).json({ success: false, message: 'Erreur récupération actifs', error });
  }
};

// 4. Récupérer une seule garde à vue par ID
export const getCustody = async (req: Request, res: Response) => {
  try {
    const data = await Custody.findByPk(req.params.id as string);
    if (!data) return res.status(404).json({ success: false, message: 'Introuvable' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error });
  }
};

// 5. Mettre à jour
export const updateCustody = async (req: Request, res: Response) => {
  try {
    const [updated] = await Custody.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ success: false, message: 'Introuvable' });
    res.status(200).json({ success: true, message: 'Mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour', error });
  }
};

// 6. Supprimer
export const deleteCustody = async (req: Request, res: Response) => {
  try {
    const deleted = await Custody.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Introuvable' });
    res.status(200).json({ success: true, message: 'Supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur suppression', error });
  }
};