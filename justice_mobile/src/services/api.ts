import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { secureGet, secureSet, secureDelete } from '../utils/secureStorage';

export const API_URL = ENV.API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: ENV.TIMEOUT || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureGet('token');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // ✅ FIX UPLOAD : Si le body est un FormData, supprimer le Content-Type
      // pour laisser Axios générer automatiquement le bon boundary multipart
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      if (__DEV__) {
        console.log(`[API] ➡️ ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    } catch (error) {
      console.error('[API] Erreur intercepteur requête:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if (status === 401 && !url.includes('/auth/login')) {
      console.warn("[API] ⛔ Session expirée.");
    }

    if (__DEV__) {
      console.error(`[API] ❌ Erreur ${status}:`, error.message);
    }

    return Promise.reject(error);
  }
);

export const saveAuthData = async (token: string, user: any, refreshToken?: string) => {
  if (!token) throw new Error('Token requis');
  await secureSet('token', token);
  await secureSet('user', JSON.stringify(user));
  if (refreshToken) await secureSet('refreshToken', refreshToken);
};

export const logoutFromApi = async (data?: { refresh: string }) => {
  try {
    if (data?.refresh && typeof data.refresh === 'string') {
      await api.post('/auth/logout', { refresh: data.refresh });
    } else {
      console.warn("[API] Token de rafraîchissement absent pour le logout serveur");
    }
  } catch (error: any) {
    console.warn("[API] Erreur lors du logout API:", error?.message);
  } finally {
    await secureDelete('token');
    await secureDelete('user');
    await secureDelete('refreshToken');
    console.log("[API] ✅ Données locales supprimées");
  }
};

export const getAuthUser = async (): Promise<any | null> => {
  try {
    const userStr = await secureGet('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("[API] Erreur parsing user:", error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await secureGet('token');
  return !!token && token.length > 0;
};

export default api;