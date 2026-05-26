import { Colors } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEffect } from 'react';

type ThemeColors = typeof Colors.light & typeof Colors.dark;

export function useTheme(): ThemeColors {
    const systemScheme = useColorScheme() ?? 'light';
    const { themeMode, loadThemeMode } = useThemeStore();

    useEffect(() => {
        loadThemeMode();
    }, [loadThemeMode]);

    const activeScheme = themeMode === 'system' ? systemScheme : themeMode;
    return Colors[activeScheme];
}
