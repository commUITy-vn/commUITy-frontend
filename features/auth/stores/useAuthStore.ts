import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { login as loginApi, register as registerApi, refreshToken as refreshTokenApi, getUserProfile } from '../api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';
import { UserRole } from '../types';

const STORAGE_KEY_ACCESS_TOKEN = 'auth_access_token';
const STORAGE_KEY_REFRESH_TOKEN = 'auth_refresh_token';
const STORAGE_KEY_USER = 'auth_user';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    try {
      const token = await storage.getItemAsync(STORAGE_KEY_ACCESS_TOKEN);

      if (token) {
        // Fetch fresh user data from /me endpoint
        try {
          const user = await getUserProfile();
          await storage.setItemAsync(STORAGE_KEY_USER, JSON.stringify(user));
          set({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
        } catch {
          // Token might be expired, clear it
          await storage.deleteItemAsync(STORAGE_KEY_ACCESS_TOKEN);
          await storage.deleteItemAsync(STORAGE_KEY_REFRESH_TOKEN);
          await storage.deleteItemAsync(STORAGE_KEY_USER);
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      set({ isLoading: false, error: 'Failed to restore session' });
    }
  },

  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await loginApi(credentials);

      await storage.setItemAsync(STORAGE_KEY_ACCESS_TOKEN, response.accessToken);
      await storage.setItemAsync(STORAGE_KEY_REFRESH_TOKEN, response.refreshToken);

      // Fetch real user data from /me endpoint
      const user = await getUserProfile();
      await storage.setItemAsync(STORAGE_KEY_USER, JSON.stringify(user));

      set({
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });
      await registerApi(data);
      set({ isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await storage.deleteItemAsync(STORAGE_KEY_ACCESS_TOKEN);
      await storage.deleteItemAsync(STORAGE_KEY_REFRESH_TOKEN);
      await storage.deleteItemAsync(STORAGE_KEY_USER);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }

    set({
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },

  refreshToken: async () => {
    try {
      const refreshToken = await storage.getItemAsync(STORAGE_KEY_REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await refreshTokenApi({ refreshToken });

      await storage.setItemAsync(STORAGE_KEY_ACCESS_TOKEN, response.accessToken);
      await storage.setItemAsync(STORAGE_KEY_REFRESH_TOKEN, response.refreshToken);

      set({ error: null });
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Force logout on refresh failure
      await get().logout();
      throw error;
    }
  },
}));
