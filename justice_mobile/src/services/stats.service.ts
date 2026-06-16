import api from "./api";
import { useAuthStore } from "../stores/useAuthStore";
import { getAllComplaints } from "./complaint.service";

export interface AdminStats {
  usersCount: number;
  courtsCount: number;
  activityRate: string;
  systemStatus: string;
}

export interface ProsecutorStats {
  total: number;
  nouveaux: number;
  enCours: number;
  urgences: number;
  clotures?: number;
}

export type DashboardStats = ProsecutorStats;

export const getAdminStats = async (): Promise<AdminStats> => {
  const user = useAuthStore.getState().user;

  const authorizedRoles = ['admin', 'prosecutor'];
  if (!user || !authorizedRoles.includes(user.role)) {
    return { usersCount: 0, courtsCount: 0, activityRate: "0%", systemStatus: "Accès Refusé" };
  }

  try {
    const response = await api.get("/stats/dashboard");
    const data = response.data?.data || response.data;

    return {
      usersCount:    data.users || data.usersCount || 0,
      courtsCount:   data.courts || data.stations || data.courtsCount || 0,
      activityRate:  data.activityRate || "94%",
      systemStatus:  data.systemStatus || "Stable",
    };
  } catch {
    console.warn("[Stats] Erreur getAdminStats, retour valeurs par défaut.");
    return { usersCount: 0, courtsCount: 0, activityRate: "N/A", systemStatus: "Maintenance" };
  }
};

export const getProsecutorStats = async (): Promise<ProsecutorStats> => {
  try {
    const data = await getAllComplaints();

    return {
      total:     data.length,
      nouveaux:  data.filter((c: any) => ['transmise_parquet', 'nouveau', 'soumise'].includes(c.status)).length,
      enCours:   data.filter((c: any) => ['instruction', 'en_cours', 'en_cours_OPJ'].includes(c.status)).length,
      urgences:  data.filter((c: any) =>
        c.priority === 'high' ||
        c.isUrgent === true ||
        (c.title && c.title.toLowerCase().includes('urgent'))
      ).length,
      clotures:  data.filter((c: any) => ['cloture', 'classement', 'archivée', 'jugée'].includes(c.status)).length,
    };
  } catch (error) {
    console.error("[Stats] Erreur calcul stats Procureur:", error);
    return { total: 0, nouveaux: 0, enCours: 0, urgences: 0, clotures: 0 };
  }
};

export const getPoliceStats = async (): Promise<ProsecutorStats> => {
  try {
    const data = await getAllComplaints();

    return {
      total:    data.length,
      nouveaux: data.filter((c: any) => c.status === 'soumise').length,
      enCours:  data.filter((c: any) => ['en_cours_OPJ', 'garde_a_vue', 'en_cours'].includes(c.status)).length,
      urgences: data.filter((c: any) =>
        c.isUrgent || (c.title && c.title.toLowerCase().includes('urgent'))
      ).length,
    };
  } catch {
    console.warn("[Stats] Erreur stats Police.");
    return { total: 0, nouveaux: 0, enCours: 0, urgences: 0 };
  }
};

export const getMonthlyTrends = async () => {
  try {
    const res = await api.get("/stats/trends");
    return res.data?.data || res.data || [];
  } catch {
    return [];
  }
};