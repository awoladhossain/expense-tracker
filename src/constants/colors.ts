/**
 * Expense Tracker — Color System
 * Light + Dark theme palette
 */

export const Colors = {
  light: {
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    secondary: '#0EA5E9',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#64748B',
    textDisabled: '#CBD5E1',
    border: '#E2E8F0',
    divider: '#F1F5F9',
    levelLow: '#16A34A',
    levelModerate: '#F59E0B',
    levelHigh: '#EF4444',
    budgetSafe: '#16A34A',
    budgetWarning: '#F59E0B',
    budgetDanger: '#EF4444',
    tabActive: '#4F46E5',
    tabInactive: '#94A3B8',
    tabBackground: '#FFFFFF',
  },
  dark: {
    primary: '#818CF8',
    primaryLight: '#1E1B4B',
    secondary: '#38BDF8',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textDisabled: '#475569',
    border: '#334155',
    divider: '#1E293B',
    levelLow: '#4ADE80',
    levelModerate: '#FBBF24',
    levelHigh: '#F87171',
    budgetSafe: '#4ADE80',
    budgetWarning: '#FBBF24',
    budgetDanger: '#F87171',
    tabActive: '#818CF8',
    tabInactive: '#475569',
    tabBackground: '#1E293B',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type AppColors = typeof Colors.light;
