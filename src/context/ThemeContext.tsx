import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors } from '../theme/colors';
import {
  normalizeThemeMode,
  ResolvedTheme,
  THEME_STORAGE_KEY,
  ThemeMode,
  themeModeLabels,
  themePalettes,
} from '../theme/theme';

export type ThemePreference = 'System Default' | 'Light' | 'Dark';

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  mode: ResolvedTheme;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const toPreference = (mode: ThemeMode): ThemePreference => {
  if (mode === 'light') return 'Light';
  if (mode === 'dark') return 'Dark';
  return 'System Default';
};

const fromPreference = (theme: ThemePreference): ThemeMode => {
  if (theme === 'Light') return 'light';
  if (theme === 'Dark') return 'dark';
  return 'system';
};

const resolveTheme = (mode: ThemeMode, systemScheme: ColorSchemeName): ResolvedTheme => {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemScheme === 'dark' ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(value => setThemeModeState(normalizeThemeMode(value)))
      .catch(() => setThemeModeState('system'));

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const setThemePreference = useCallback(
    async (theme: ThemePreference) => {
      await setThemeMode(fromPreference(theme));
    },
    [setThemeMode],
  );

  const resolvedTheme = resolveTheme(themeMode, systemScheme);
  const isDark = resolvedTheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedTheme,
      colors: themePalettes[resolvedTheme],
      isDark,
      setThemeMode,
      mode: resolvedTheme,
      themePreference: toPreference(themeMode),
      setThemePreference,
    }),
    [isDark, resolvedTheme, setThemeMode, setThemePreference, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return value;
};

export { THEME_STORAGE_KEY, themeModeLabels };
