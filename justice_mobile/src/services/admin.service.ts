// PATH: src/services/admin.service.ts
import api from "./api";

/**
 * 🛠️ TYPES & INTERFACES
 */
export type CreateUserPayload = {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  password?: string;
  role: string;
  organization: string;
  matricule?: string;
  poste?: string;
  policeStationId?: number | null;
  courtId?: number | null;
  prisonId?: number | null;
  status?: string;
  is_active?: boolean;
  photo?: string | null;
};

// Interface pour les données de sécurité (Résout les erreurs TS2339)
export interface SecurityData {
  score: number;
  threats: number;
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }>;
}

export interface DashboardData {
  usersCount: number;
  courtsCount: number;
  activeSessions: number;
  activityRate: string;
  systemStatus: string;
  securityLevel: string;
  statusStats: { status: string; count: string }[];
  regionalStats: { district: string; total: string }[];
  timingStats: { avg_days: number };
  summary?: any;
}

/**
 * 📊 GESTION DU DASHBOARD (Analytique)
 */
export const getAdminStats = async (): Promise<DashboardData> => {
  try {
    const response = await api.get("/admin/dashboard-stats");
    const data = response.data.data;

    return {
      usersCount: data.summary?.users_total || 0,
      courtsCount: data.summary?.courts_total || data.regionalStats?.length || 0,
      activeSessions: data.summary?.police_users || 0,
      activityRate: (data.summary?.complaints_total > 0)
        ? Math.round((data.summary.complaints_open / data.summary.complaints_total) * 100) + "%"
        : "0%",
      systemStatus: data.summary?.systemHealth === '100%' ? "Stable" : "Maintenance",
      securityLevel: data.summary?.systemHealth === '100%' ? "Optimal" : "Vigilance",
      statusStats: data.statusStats || [],
      regionalStats: data.regionalStats || [],
      timingStats: data.timingStats || { avg_days: 0 },
      summary: data.summary || {}
    };
  } catch (error) {
    console.error("[ADMIN SERVICE] Erreur:", error);
    return {
      usersCount: 0, courtsCount: 0, activeSessions: 0,
      activityRate: "0%", systemStatus: "Hors-ligne",
      securityLevel: "N/A", statusStats: [], regionalStats: [],
      timingStats: { avg_days: 0 }
    };
  }
};

export const getDashboardData = getAdminStats;

/**
 * 🛡️ SÉCURITÉ (Résout les erreurs TS2305 & TS2339 dans AdminSecurityScreen)
 */
export const getSecurityOverview = async (): Promise<SecurityData> => {
  try {
    const response = await api.get("/admin/security/overview");
    // On s'assure que l'objet retourné respecte l'interface SecurityData
    return response.data.success ? response.data.data : { score: 0, threats: 0, alerts: [] };
  } catch (error) {
    console.error("Erreur Security Overview:", error);
    return { score: 0, threats: 0, alerts: [] };
  }
};

export const triggerSecurityScan = async () => {
  const response = await api.post("/admin/security/scan");
  return response.data;
};

/**
 * 👥 GESTION DES UTILISATEURS (CRUD)
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get("/users");
    return response.data.success ? response.data.data : [];
  } catch (error) {
    return [];
  }
};

export const createUser = async (userData: CreateUserPayload) => {
  try {
    const finalPayload = {
      ...userData,
      email: userData.email.toLowerCase().trim(),
      police_station_id: userData.policeStationId,
      court_id: userData.courtId,
      prison_id: userData.prisonId,
    };
    const response = await api.post('/users', finalPayload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.status === 409 ? "Email déjà utilisé." : "Erreur création.");
  }
};

export const updateUser = async (id: number, data: any) => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

/**
 * 🏛️ GESTION DES STRUCTURES
 */
export const getAllCourts = async () => {
  const response = await api.get("/courts");
  return response.data.success ? response.data.data : [];
};

export const getAllPoliceStations = async () => {
  const response = await api.get("/police-stations");
  return response.data.success ? response.data.data : [];
};

/**
 * 🔧 MAINTENANCE & SYSTÈME
 */
export const getSystemHealth = async () => {
  const response = await api.get('/admin/system-health');
  return response.data;
};

export const getSystemLogs = async () => {
  const response = await api.get('/admin/logs');
  return response.data;
};

export const getMaintenanceStatus = async () => {
  const response = await api.get('/admin/maintenance/status');
  return response.data;
};

export const setMaintenanceStatus = async (data: { isActive?: boolean; enabled?: boolean }) => {
  const payload = { isActive: data.isActive ?? data.enabled };
  const response = await api.post('/admin/maintenance/status', payload);
  return response.data;
};

// ✅ Ajout explicite pour AdminAuditTrailScreen
export const getAuditLogs = async () => {
  const response = await api.get('/admin/audit-logs');
  return response.data;
};

// ✅ Ajout explicite pour AdminMaintenanceScreen
export const clearServerCache = async () => {
  const response = await api.post('/admin/maintenance/clear-cache');
  return response.data;
};