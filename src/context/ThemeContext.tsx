import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Uniwind } from 'uniwind';
import * as SystemUI from 'expo-system-ui';
import { AppColors, DARK_COLORS, LIGHT_COLORS, setActiveColors } from '../constants/colors';

export type ThemePreference = 'system' | 'light' | 'dark';
interface ThemeContextValue {
  preference: ThemePreference;
  isDark: boolean;
  colors: AppColors;
  setPreference: (value: ThemePreference) => Promise<void>;
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = '@penny_theme_preference_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, updatePreference] = useState<ThemePreference>('system');
  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
  setActiveColors(isDark);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'system' || stored === 'light' || stored === 'dark') updatePreference(stored);
    });
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
    Uniwind.setTheme(isDark ? 'dark' : 'light');
    void SystemUI.setBackgroundColorAsync(isDark ? DARK_COLORS.background : LIGHT_COLORS.background).catch(() => {});
  }, [isDark, preference]);

  const setPreference = async (value: ThemePreference) => {
    await AsyncStorage.setItem(STORAGE_KEY, value);
    updatePreference(value);
  };

  return <ThemeContext.Provider value={{ preference, isDark, colors: isDark ? DARK_COLORS : LIGHT_COLORS, setPreference }}>
    {children}
  </ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const namedColors = new Map<string, string>();
for (const key of Object.keys(LIGHT_COLORS) as (keyof AppColors)[]) {
  if (LIGHT_COLORS[key] !== '#FFFFFF') namedColors.set(LIGHT_COLORS[key].toLowerCase(), DARK_COLORS[key]);
}
const extraColors: Record<string, string> = {
  '#fafbf9': DARK_COLORS.background, '#fbfcfa': DARK_COLORS.background,
  '#f8fafc': DARK_COLORS.background, '#fafafa': DARK_COLORS.background,
  '#f9fafb': DARK_COLORS.background, '#f4f4f5': DARK_COLORS.secondary,
  '#f5f5f5': DARK_COLORS.secondary, '#e5e7eb': DARK_COLORS.cardBorder,
  '#e4e4e7': DARK_COLORS.cardBorder, '#d4d4d8': DARK_COLORS.cardBorderHover,
  '#18181b': DARK_COLORS.foreground, '#171717': DARK_COLORS.foreground,
  '#111827': DARK_COLORS.foreground, '#374151': DARK_COLORS.secondaryForeground,
  '#52525b': DARK_COLORS.mutedText, '#71717a': DARK_COLORS.mutedText,
  '#6b7280': DARK_COLORS.mutedText, '#a1a1aa': DARK_COLORS.subtleText,
};

const themeStyle = (style: Record<string, unknown>) => Object.fromEntries(
  Object.entries(style).map(([property, value]) => {
    if (typeof value !== 'string' || !/color/i.test(property)) return [property, value];
    const normalized = value.toLowerCase();
    if (normalized === '#ffffff' || normalized === '#fff' || normalized === 'white') {
      return [property, property === 'backgroundColor' ? DARK_COLORS.card : property === 'borderColor' ? DARK_COLORS.cardBorder : value];
    }
    return [property, extraColors[normalized] || namedColors.get(normalized) || value];
  })
);

export const useThemedStyles = <T extends Record<string, any>>(lightStyles: T): T => {
  const { isDark } = useTheme();
  return useMemo(() => {
    if (!isDark) return lightStyles;
    return Object.fromEntries(Object.entries(lightStyles).map(([name, style]) => [
      name, themeStyle(StyleSheet.flatten(style) as Record<string, unknown>),
    ])) as T;
  }, [isDark, lightStyles]);
};
