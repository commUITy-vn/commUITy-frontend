import { create } from 'zustand';
import { storage } from '@/lib/storage';

interface ThemeState {
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => Promise<void>;
  loadThemeMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'light',
  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    await storage.setItemAsync('app_theme_mode', mode);
  },
  loadThemeMode: async () => {
    const mode = await storage.getItemAsync('app_theme_mode');
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      set({ themeMode: mode });
    } else {
      set({ themeMode: 'light' });
    }
  },
}));
