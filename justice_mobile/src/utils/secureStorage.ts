import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ✅ TYPES UTILISATEURS (Alignés avec le Backend)
export type OrganizationType = "POLICE" | "GENDARMERIE" | "JUSTICE" | "ADMIN" | "CITIZEN";

export interface UserData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  telephone?: string;
  role: string;
  matricule?: string; // Ajouté car vu dans vos logs backend
  organization?: OrganizationType;
  policeStationId?: number | null;
  district?: string;
  courtId?: number | null;
  prisonId?: number | null;
}

// 🔑 CLÉS DE STOCKAGE
// ⚠️ Mises à jour pour correspondre à useAuthStore ('token' et non 'access_token')
export const STORAGE_KEYS = {
  TOKEN: "token", 
  REFRESH: "refreshToken",
  USER: "user",
} as const;

const isWeb = Platform.OS === 'web';

// ==========================================
// 🛠️ MOTEUR DE STOCKAGE (Web vs Mobile)
// ==========================================

async function setItem(key: string, value: string) {
  try {
    if (isWeb) {
      if (key === STORAGE_KEYS.TOKEN || key === STORAGE_KEYS.REFRESH) {
        sessionStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    console.error(`[Storage] Erreur SetItem (${key}):`, e);
  }
}

async function getItem(key: string) {
  try {
    if (isWeb) {
      return sessionStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (e) {
    console.error(`[Storage] Erreur GetItem (${key}):`, e);
    return null;
  }
}

async function removeItem(key: string) {
  try {
    if (isWeb) {
      sessionStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.error(`[Storage] Erreur RemoveItem (${key}):`, e);
  }
}

// ==========================================
// 🚀 API EXPORTÉE (Utilisée par le Store & API)
// ==========================================

/**
 * Récupère une valeur sécurisée (ou localStorage sur Web)
 */
export async function secureGet(key: string): Promise<string | null> {
  return await getItem(key);
}

/**
 * Enregistre une valeur sécurisée
 */
export async function secureSet(key: string, value: string): Promise<void> {
  await setItem(key, value);
}

/**
 * Supprime une valeur
 */
export async function secureDelete(key: string): Promise<void> {
  await removeItem(key);
}

// ==========================================
// 📦 HELPERS MÉTIERS (Optionnels mais pratiques)
// ==========================================

export async function saveTokens(token: string, refreshToken: string) {
  await setItem(STORAGE_KEYS.TOKEN, token);
  await setItem(STORAGE_KEYS.REFRESH, refreshToken);
}

export async function getToken() {
  return await getItem(STORAGE_KEYS.TOKEN);
}

export async function saveUser(user: UserData) {
  await setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<UserData | null> {
  const data = await getItem(STORAGE_KEYS.USER);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * 🧹 NETTOYAGE COMPLET (Logout)
 */
export async function clearStorage(): Promise<void> {
  try {
    // On utilise les clés définies + celles potentiellement utilisées en dur
    const keysToRemove = [
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.REFRESH,
      STORAGE_KEYS.USER,
      "token",       // Sécurité au cas où
      "refreshToken" // Sécurité au cas où
    ];

    for (const key of keysToRemove) {
      await removeItem(key);
    }
    console.log("[Storage] Session nettoyée avec succès.");
  } catch (error) {
    console.error("[Storage] Erreur lors du nettoyage :", error);
  }
}

// Alias pour compatibilité
export const clearAllSecureData = clearStorage;
