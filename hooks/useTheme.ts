import {Colors} from '@/constants/theme';
import {useColorScheme} from './use-color-scheme';

type ThemeColors = typeof Colors.light & typeof Colors.dark;

export function useTheme(): ThemeColors {
    const colorScheme = useColorScheme() ?? 'light';
    return Colors[colorScheme];
}
