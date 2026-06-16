// src/services/auth.service.ts
import { Platform } from 'react-native';
import api, { logoutFromApi } from './api';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  [key: string]: any;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: number;
    email: string;
    matricule?: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: string[];
    [key: string]: any;
  };
}

export interface UserProfile {
  id: number;
  email: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatar?: string;
  lastLogin?: string;
  [key: string]: any;
}

/**
 * Normalise la réponse pour garantir un objet user cohérent
 */
const normalizeAuthResponse = (data: any): AuthResponse => {
  if (data?.user && typeof data.user === 'object') {
    return data as AuthResponse;
  }
  
  return {
    token: data?.token,
    refreshToken: data?.refreshToken,
    user: {
      id: data?.id,
      email: data?.email,
      matricule: data?.matricule,
      firstName: data?.firstName || data?.firstname,
      lastName: data?.lastName || data?.lastname,
      role: data?.role,
      permissions: data?.permissions || [],
      ...data
    }
  };
};

// ✅ CORRECTION : Accepte deux arguments séparés pour correspondre à useAuthStore
export const login = async (
  identifier: string, 
  password: string
): Promise<AuthResponse> => {
  // Validation
  if (!identifier?.trim() || !password) {
    throw new Error('Identifiants requis');
  }

  const payload = { 
    identifier: identifier.trim(), 
    password: password 
  };

  try {
    const response = await api.post<any>('/auth/login', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // ✅ CORRECTION : Vérifie si la réponse est enveloppée dans data ou directe
    const responseData = response.data?.data || response.data;
    return normalizeAuthResponse(responseData);
  } catch (error: any) {
    if (error.response) {
      console.error("Détail erreur serveur :", error.response.data);
      // Renvoie le message d'erreur du backend s'il existe
      const backendMessage = error.response.data?.message || error.response.data?.error;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
    }
    throw error;
  }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<any>('/auth/register', userData);
  return normalizeAuthResponse(response.data?.data || response.data);
};

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/auth/me');
  return response.data?.data || response.data;
};

export const updateProfile = async (userData: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put<UserProfile>('/auth/update', userData);
  return response.data?.data || response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post<any>('/auth/change-password', { currentPassword, newPassword });
  const data = response.data?.data || response.data;
  return { message: data?.message || 'Mot de passe changé avec succès' };
};

export const logout = async (refreshToken?: string): Promise<void> => {
  await logoutFromApi({ refresh: refreshToken || '' });
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<any>('/auth/forgot-password', { email });
  const data = response.data?.data || response.data;
  return { message: data?.message || 'Email de réinitialisation envoyé' };
};

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post<any>('/auth/reset-password', { token, newPassword });
  const data = response.data?.data || response.data;
  return { message: data?.message || 'Mot de passe réinitialisé avec succès' };
};

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await api.post<any>('/auth/verify-email', { token });
  const data = response.data?.data || response.data;
  return { message: data?.message || 'Email vérifié avec succès' };
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<any>('/auth/resend-verification', { email });
  const data = response.data?.data || response.data;
  return { message: data?.message || 'Email de vérification renvoyé' };
};

export const isEmailFormat = (identifier: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier);
};

export const forceLogout = async (refreshToken?: string): Promise<void> => {
  await logoutFromApi({ refresh: refreshToken || '' });
  if (typeof window !== 'undefined' && Platform.OS === 'web') {
    window.dispatchEvent(new CustomEvent('auth:force-logout'));
  }
};

const authService = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  isEmailFormat,
  forceLogout,
};

export default authService;