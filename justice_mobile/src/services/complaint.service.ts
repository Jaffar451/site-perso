// PATH: src/services/complaint.service.ts
import api from "./api";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

// ======================================================
// TYPES
// ======================================================

// ✅ Mise à jour : Fusion des statuts OPJ + Procureur + Juge (Résout TS2345)
export type ComplaintStatus =
  | "soumise"
  | "en_cours_OPJ"
  | "garde_a_vue"
  | "attente_validation"
  | "transmise_parquet"
  | "instruction"           // Ajouté pour le Juge
  | "detention_provisoire"  // Ajouté pour le Juge
  | "non_lieu"             // Ajouté pour le Juge
  | "classée_sans_suite_par_OPJ"
  | "classée_sans_suite_par_procureur"
  | "figée"
  | "archived"
  | "saisi_juge"           // Ajouté pour le Juge
  | "audience_programmée"  // Ajouté pour le Juge
  | "jugée";

export interface Complaint {
  id: number;
  citizenId: number;
  title: string;
  description: string;
  category?: string;
  status: ComplaintStatus;
  location?: string | null;
  filedAt?: string;
  createdAt?: string;
  trackingCode?: string;
  assignedJudgeId?: number; // Ajouté pour la gestion des assignations

  // Propriétés G.A.V
  isInCustody?: boolean;
  custodyStart?: string;
  rightsNotified?: boolean;
  medicalExamRequested?: boolean;
  custodyStatus?: "active" | "extended" | "released" | "referred";

  attachments?: {
    id: number;
    file_url: string;
    filename: string;
    type?: string;
  }[];

  citizen?: {
    firstname: string;
    lastname: string;
    telephone?: string;
  };

  isOfflinePending?: boolean;
  [key: string]: any;
}

export interface PoliceStats {
  assigned: number;
  open: number;
  closed: number;
  total: number;
}

// ======================================================
// CACHE & SYNC LOGIC
// ======================================================

let complaintsCache: Complaint[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30_000; 
let sharedComplaintsRequest: Promise<Complaint[]> | null = null;

const isOnline = async (): Promise<boolean> => {
  if (Platform.OS === "web") return true;
  const net = await NetInfo.fetch();
  return net.isConnected === true;
};

const extractDataArray = (res: any): Complaint[] => {
  const raw = res?.data;
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.complaints && Array.isArray(raw.complaints)) return raw.complaints;
  return [];
};

export const invalidateComplaintsCache = () => {
  complaintsCache = null;
  lastFetchTime = 0;
};

// ======================================================
// READ (LECTURE)
// ======================================================

export const getAllComplaints = async (): Promise<Complaint[]> => {
  const now = Date.now();
  if (sharedComplaintsRequest) return sharedComplaintsRequest;
  if (complaintsCache && now - lastFetchTime < CACHE_DURATION) {
    return complaintsCache;
  }

  sharedComplaintsRequest = (async () => {
    try {
      const res = await api.get("/complaints");
      complaintsCache = extractDataArray(res);
      lastFetchTime = Date.now();
      return complaintsCache;
    } finally {
      sharedComplaintsRequest = null;
    }
  })();

  return sharedComplaintsRequest;
};

export const getMyComplaints = async (): Promise<Complaint[]> => {
  const res = await api.get("/complaints/my-complaints");
  return extractDataArray(res);
};

export const getComplaintById = async (id: number): Promise<Complaint> => {
  const res = await api.get(`/complaints/${id}`);
  return res.data?.data || res.data;
};

// ======================================================
// ACTIONS (CREATE / UPDATE / DELETE)
// ======================================================

export const createComplaint = async (data: Partial<Complaint>): Promise<Complaint> => {
  const online = await isOnline();
  if (!online) throw new Error("OFFLINE_MODE");
  
  const res = await api.post("/complaints", data);
  invalidateComplaintsCache();
  return res.data?.data || res.data;
};

export const uploadAttachment = async (complaintId: number, file: any) => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // Sur web, DocumentPicker retourne une blob URL — on la fetch pour obtenir le Blob
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append("file", blob, file.name || `upload_${Date.now()}`);
  } else {
    // Sur mobile, on utilise la syntaxe React Native
    formData.append("file", {
      uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
      type: file.mimeType || "application/octet-stream",
      name: file.name || `file_${Date.now()}`,
    } as any);
  }

  const res = await api.post(`/complaints/${complaintId}/attachments`, formData);
  return res.data?.data || res.data;
};

export const updateComplaint = async (id: number, data: Partial<Complaint>) => {
  const res = await api.patch(`/complaints/${id}`, data);
  invalidateComplaintsCache();
  return res.data?.data || res.data;
};

export const transitionComplaint = async (
  id: number,
  status: ComplaintStatus,
  reason?: string
) => {
  const res = await api.post(`/complaints/${id}/transition`, { status, reason });
  invalidateComplaintsCache();
  return res.data;
};

export const deleteComplaint = async (id: number) => {
  await api.delete(`/complaints/${id}`);
  invalidateComplaintsCache();
};

// ======================================================
// STATISTICS
// ======================================================

export const getPoliceStats = async (): Promise<PoliceStats> => {
  try {
    const data = await getAllComplaints();
    return {
      total:     data.length,
      assigned: data.filter((c) => c.status === "en_cours_OPJ").length,
      open:      data.filter((c) => ["soumise", "attente_validation"].includes(c.status)).length,
      closed:    data.filter((c) => 
        ["figée", "classée_sans_suite_par_OPJ", "classée_sans_suite_par_procureur", "archived"].includes(c.status)
      ).length,
    };
  } catch {
    return { total: 0, assigned: 0, open: 0, closed: 0 };
  }
};

// ======================================================
// ALIASES
// ======================================================

export const submitToOPJ    = (id: number) => transitionComplaint(id, "en_cours_OPJ");
export const sendToParquet  = (id: number) => transitionComplaint(id, "transmise_parquet");
export const archiveCase    = (id: number) => transitionComplaint(id, "figée");

export const getComplaint        = getComplaintById;
export const getMyComplaintsList = getMyComplaints;
export const getStationComplaints = getAllComplaints;