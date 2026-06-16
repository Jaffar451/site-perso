// @TODO: add try/catch around api calls
// PATH: src/services/arrestWarrant.service.ts
import api from "./api";
import { useAuthStore } from "../stores/useAuthStore";

/**
 * 🛡️ Vérification des habilitations
 * Gère les rôles multiples (ex: 'police' couvre officier, commissaire, etc.)
 */
const allow = (...allowedRoles: string[]) => {
  const user = useAuthStore.getState().user;
  const userRole = user?.role; 
  
  if (!userRole) {
    throw new Error("Utilisateur non identifié.");
  }

  // Normalisation pour les groupes de rôles (Adapté à ton système)
  const isPolice = ["officier_police", "commissaire", "inspecteur", "gendarme", "opj_gendarme", "police"].includes(userRole);
  const isJustice = ["judge", "prosecutor", "greffier"].includes(userRole);

  // Vérification
  const hasAccess = allowedRoles.some(role => {
    if (role === "police") return isPolice; // "police" autorise tous les corps habillés
    if (role === "justice") return isJustice;
    return role === userRole; // Vérification stricte (ex: "admin")
  });

  if (!hasAccess) {
    throw new Error(`Accès refusé. Rôle requis : ${allowedRoles.join(" ou ")}`);
  }
};

// ======================================================
// TYPES
// ======================================================

export interface CreateArrestWarrantPayload {
  caseId: number;
  personName: string;
  reason: string;
  expiresAt?: string; 
  urgency: "normal" | "high" | "critical";
  judgeId?: number;
}

// ======================================================
// SERVICES
// ======================================================

/**
 * ⚖️ Émission d'un mandat d'arrêt (Juge uniquement)
 */
export const createArrestWarrant = async (payload: CreateArrestWarrantPayload) => {
  allow("judge");
  const res = await api.post("/arrest-warrants", payload);
  return res.data?.data || res.data;
};

/**
 * 👮 Consultation des mandats actifs
 */
export const getActiveWarrants = async () => {
  // On autorise la police, le juge et l'admin
  allow("police", "judge", "admin");
  const res = await api.get("/arrest-warrants/active");
  
  // Défensif : On s'assure de toujours renvoyer un tableau
  const raw = res.data;
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  return [];
};

/**
 * 🛑 Changement de statut (Annulation ou Exécution)
 */
export const updateWarrantStatus = async (id: number, status: "executed" | "cancelled") => {
  allow("judge", "admin", "commissaire");
  const res = await api.patch(`/arrest-warrants/${id}/status`, { status });
  return res.data?.data || res.data;
};

/**
 * ⛓️ Exécution d'un mandat par la Police
 * C'est cette fonction qui manquait dans ton écran d'arrestation
 */
export const executeWarrant = async (warrantId: number) => {
  allow("police", "admin"); // N'importe quel policier sur le terrain peut exécuter
  const res = await api.post(`/arrest-warrants/${warrantId}/execute`);
  return res.data?.data || res.data;
};