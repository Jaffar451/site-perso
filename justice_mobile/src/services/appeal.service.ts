// @TODO: add try/catch around api calls
import api from "./api";

export interface CreateAppealPayload {
  caseId: number;
  appellant: "DEFENDANT" | "PROSECUTOR" | "CIVIL_PARTY";
  grounds: string;
  isSuspensive: boolean;
  filedBy?: number; // ID du Juge ou Greffier
  date?: string;
}

/**
 * ⚖️ Enregistrement d'un recours (Appel)
 */
export const registerAppeal = async (payload: CreateAppealPayload) => {
  // Remplacez '/appeals' par la route réelle de votre API
  const res = await api.post("/appeals", payload);
  return res.data;
};
