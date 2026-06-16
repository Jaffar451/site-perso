import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthService from '../services/auth.service';
import { saveAuthData, logoutFromApi } from '../services/api';

export interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  LastName?: string;
  firstname?: string;
  lastname?: string;
  role: string;
  policeStationId?: number | null;
  courtId?: number | null;
  [key: string]: any;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  loading: boolean;
  error: string | null;

  // Computed helper — évite d'accéder à user?.role partout
  role: string | null;

  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  logout: (refreshToken?: string) => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setError: (err: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isHydrating:     true,   // true au démarrage, false après hydration
      loading:         false,
      error:           null,
      role:            null,

      login: async ({ identifier, password }) => {
        set({ loading: true, error: null });
        try {
          const response: any = await AuthService.login(identifier, password);
          const data  = response.data || response;
          const token = data.token;
          const user  = data.user;

          if (!token || !user) throw new Error("Données d'authentification invalides");

          await saveAuthData(token, user, data.refreshToken);
          set({
            user,
            token,
            role:            user.role ?? null,
            isAuthenticated: true,
            loading:         false,
            error:           null,
          });
        } catch (err: any) {
          set({ loading: false, error: err.message || 'Échec de connexion' });
          throw err;
        }
      },

      logout: async (refreshToken?: string): Promise<void> => {
        try {
          if (refreshToken) await logoutFromApi({ refresh: refreshToken });
        } catch (err) {
          console.error("Erreur API logout:", err);
        } finally {
          set({
            user:            null,
            token:           null,
            role:            null,
            isAuthenticated: false,
            loading:         false,
            error:           null,
          });
        }
      },

      setUser: (user: UserProfile | null) => {
        set({ user, role: user?.role ?? null });
      },

      setError: (error: string | null) => set({ error }),
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: AuthState) => ({
        user:            state.user,
        token:           state.token,
        role:            state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      // Marque isHydrating = false une fois la réhydratation terminée
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ isHydrating: false });
      },
    }
  )
);