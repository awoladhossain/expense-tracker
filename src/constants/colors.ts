/**
 * Expense Tracker — Color System
 * Light + Dark FinTech Theme Palette
 */

import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';

export const Colors = {
  light: {
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    accent: '#0EA5E9',
    secondary: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    glassBorder: 'rgba(226,232,240,0.8)',
    text: '#0F172A',
    textMuted: '#64748B',
    textDisabled: '#CBD5E1',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    levelLow: '#10B981',
    levelModerate: '#F59E0B',
    levelHigh: '#EF4444',
    budgetSafe: '#10B981',
    budgetWarning: '#F59E0B',
    budgetDanger: '#EF4444',
    tabActive: '#4F46E5',
    tabInactive: '#64748B',
    tabBackground: '#FFFFFF',
  },
  dark: {
    primary: '#6366F1',
    primaryLight: 'rgba(99,102,241,0.15)',
    accent: '#38BDF8',
    secondary: '#38BDF8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    background: '#0B0F19',
    surface: '#151D2F',
    surfaceAlt: '#1E293B',
    glassBorder: 'rgba(255,255,255,0.08)',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textDisabled: '#475569',
    border: '#1E293B',
    divider: '#1E293B',
    levelLow: '#34D399',
    levelModerate: '#FBBF24',
    levelHigh: '#F87171',
    budgetSafe: '#34D399',
    budgetWarning: '#FBBF24',
    budgetDanger: '#F87171',
    tabActive: '#6366F1',
    tabInactive: '#94A3B8',
    tabBackground: '#151D2F',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColorKeys = keyof typeof Colors.light;
export type ThemeColors = Record<ThemeColorKeys, string>;
export type AppColors = ThemeColors;

/**
 * useThemeColor — Hook helper that resolves the active color palette
 * based on user settings ('light' | 'dark' | 'system') and device OS scheme.
 */
export function useThemeColor(): ThemeColors {
  const systemScheme = useColorScheme();
  const theme = useSettingsStore((state) => state.theme);
  const effectiveScheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  return Colors[effectiveScheme];
}
