// PATH: src/services/court.service.ts
import api from "./api";

/**
 * ✅ INTERFACE DE RÉPONSE API STANDARD
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * ✅ INTERFACE DU TRIBUNAL
 * Aligné sur la structure judiciaire du Niger
 */
export interface Court {
  id: number;
  name: string;         // ex: "Tribunal de Grande Instance de Niamey"
  city: string;         // ex: "Niamey"
  jurisdiction: string; // Ressort (ex: "Cour d'Appel de Niamey")
  type: string;         // ex: "TGI", "Instance", "Commerce", "Travail"
  status: "active" | "inactive";
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * 🏛️ RÉCUPÉRER TOUS LES TRIBUNAUX (GET)
 * Utilisé pour les listes d'administration et les formulaires d'affectation
 */
export const getAllCourts = async (): Promise<Court[]> => {
  try {
    // CORRECTION : Typage de la réponse API complète
    const res = await api.get<ApiResponse<Court[]>>("/courts");
    return res.data.data; // ✅ Extrait le tableau des tribunaux
  } catch (error) {
    console.error("[COURT SERVICE] Erreur lors de la récupération :", error);
    throw error;
  }
};

/**
 * 🏛️ RÉCUPÉRER UN TRIBUNAL PAR ID
 */
export const getCourtById = async (id: number): Promise<Court> => {
  try {
    const res = await api.get<ApiResponse<Court>>(`/courts/${id}`);
    return res.data.data; // ✅ Extrait l'objet tribunal
  } catch (error) {
    console.error(`[COURT SERVICE] Erreur récupération tribunal ${id}:`, error);
    throw error;
  }
};

/**
 * ➕ AJOUTER UN NOUVEAU TRIBUNAL (POST)
 */
export const createCourt = async (data: Partial<Court>): Promise<Court> => {
  try {
    // 🛡️ NORMALISATION : Évite les erreurs 400 SQL sur les types numériques
    const normalizedData = {
      ...data,
      name: data.name?.trim(),
      city: data.city?.trim(),
      status: data.status || "active",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };

    const res = await api.post<ApiResponse<Court>>("/courts", normalizedData);
    return res.data.data; // ✅ Extrait le tribunal créé
  } catch (error: any) {
    console.error("[COURT SERVICE] Erreur 400/500 création :", error.response?.data);
    throw error;
  }
};

/**
 * 📝 MODIFIER UN TRIBUNAL (PUT)
 */
export const updateCourt = async (id: number, data: Partial<Court>): Promise<Court> => {
  try {
    const normalizedData = {
      ...data,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };

    const res = await api.put<ApiResponse<Court>>(`/courts/${id}`, normalizedData);
    return res.data.data; // ✅ Extrait le tribunal modifié
  } catch (error: any) {
    console.error(`[COURT SERVICE] Erreur modification tribunal ${id}:`, error.response?.data);
    throw error;
  }
};

/**
 * 🗑️ SUPPRIMER UN TRIBUNAL (DELETE)
 */
export const deleteCourt = async (id: number): Promise<{ message: string }> => {
  try {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/courts/${id}`);
    return res.data.data || { message: "Tribunal supprimé avec succès" };
  } catch (error) {
    console.error("[COURT SERVICE] Erreur suppression :", error);
    throw error;
  }
};