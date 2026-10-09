/**
 * useAppColors — Returns theme-aware color palette
 */

import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';
import { useSettingsStore } from '@/store/settingsStore';

export function useAppColors() {
  const systemScheme = useColorScheme();
  const { theme } = useSettingsStore();
  const effectiveScheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  return Colors[effectiveScheme];
}
