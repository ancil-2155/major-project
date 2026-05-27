import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'System Default' | 'Light' | 'Dark';

export const THEME_STORAGE_KEY = 'acams_theme_preference';

type AppColors = {
  background: string;
  surface: string;
  elevated: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  input: string;
  inputBorder: string;
  chip: string;
  headerStart: string;
  headerEnd: string;
  shadow: string;
  overlay: string;
};

type AppThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  mode: 'light' | 'dark';
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
};

const lightColors: AppColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  text: '#111827',
  textSecondary: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  primary: '#4F46E5',
  primarySoft: '#EEF2FF',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  input: '#FFFFFF',
  inputBorder: '#CBD5E1',
  chip: '#F1F5F9',
  headerStart: '#4F46E5',
  headerEnd: '#7C3AED',
  shadow: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.52)',
};

const darkColors: AppColors = {
  background: '#070A12',
  surface: '#0F172A',
  elevated: '#111827',
  card: '#111827',
  cardAlt: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  muted: '#94A3B8',
  border: '#243044',
  primary: '#818CF8',
  primarySoft: '#1E1B4B',
  accent: '#22D3EE',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  input: '#0B1120',
  inputBorder: '#334155',
  chip: '#172033',
  headerStart: '#111827',
  headerEnd: '#312E81',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.72)',
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const normalizeTheme = (value: string | null): ThemePreference => {
  if (value === 'Light' || value === 'Dark' || value === 'System Default') {
    return value;
  }
  return 'System Default';
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>('System Default');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(value => setThemePreferenceState(normalizeTheme(value)))
      .catch(() => setThemePreferenceState('System Default'));
  }, []);

  const setThemePreference = useCallback(async (theme: ThemePreference) => {
    setThemePreferenceState(theme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  }, []);

  const isDark =
    themePreference === 'Dark' ||
    (themePreference === 'System Default' && systemScheme === 'dark');

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode: isDark ? 'dark' : 'light',
      themePreference,
      setThemePreference,
    }),
    [isDark, setThemePreference, themePreference],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const value = useContext(AppThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return value;
};
