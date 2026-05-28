import { darkColors, lightColors, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'acams_theme_preference';

export const themePalettes: Record<ResolvedTheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

export const normalizeThemeMode = (value: string | null | undefined): ThemeMode => {
  if (value === 'light' || value === 'Light') return 'light';
  if (value === 'dark' || value === 'Dark') return 'dark';
  if (value === 'system' || value === 'System Default') return 'system';
  return 'system';
};

export const themeModeLabels: Record<ThemeMode, string> = {
  system: 'System Default',
  light: 'Light Mode',
  dark: 'Dark Mode',
};
