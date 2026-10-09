/**
 * Expense Tracker — Settings Zustand Store
 * Persisted via AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type Language = 'en' | 'bn';
export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'INR';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  currency: CurrencyCode;
  theme: ThemeMode;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  isLoaded: boolean;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;
  setReminder: (enabled: boolean, hour?: number, minute?: number) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEY = '@expense_tracker_settings';

const LANGUAGES: Language[] = ['en', 'bn'];
const CURRENCIES: CurrencyCode[] = ['BDT', 'USD', 'EUR', 'INR'];
const THEMES: ThemeMode[] = ['light', 'dark', 'system'];

let persistQueue: Promise<void> = Promise.resolve();

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}

function schedulePersist() {
  persistQueue = persistQueue
    .then(async () => {
      const state = useSettingsStore.getState();
      const data = {
        language: state.language,
        currency: state.currency,
        theme: state.theme,
        reminderEnabled: state.reminderEnabled,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    })
    .catch(() => {});
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'bn',
  currency: 'BDT',
  theme: 'system',
  reminderEnabled: false,
  reminderHour: 21,
  reminderMinute: 0,
  isLoaded: false,

  setLanguage: (language) => {
    set({ language });
    schedulePersist();
  },
  setCurrency: (currency) => {
    set({ currency });
    schedulePersist();
  },
  setTheme: (theme) => {
    set({ theme });
    schedulePersist();
  },
  setReminder: (reminderEnabled, hour, minute) => {
    const update: Partial<SettingsState> = { reminderEnabled };
    if (hour !== undefined) update.reminderHour = hour;
    if (minute !== undefined) update.reminderMinute = minute;
    set(update);
    schedulePersist();
  },
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ isLoaded: true });
        return;
      }
      const saved: unknown = JSON.parse(raw);
      const record = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
      set({
        language: isOneOf(record.language, LANGUAGES) ? record.language : 'bn',
        currency: isOneOf(record.currency, CURRENCIES) ? record.currency : 'BDT',
        theme: isOneOf(record.theme, THEMES) ? record.theme : 'system',
        reminderEnabled: typeof record.reminderEnabled === 'boolean' ? record.reminderEnabled : false,
        reminderHour: typeof record.reminderHour === 'number' ? record.reminderHour : 21,
        reminderMinute: typeof record.reminderMinute === 'number' ? record.reminderMinute : 0,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
