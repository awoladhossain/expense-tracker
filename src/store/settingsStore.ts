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
  dailyReminderEnabled: boolean;
  reminderTime: string; // e.g. "20:00"
  isLoaded: boolean;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;
  setReminder: (enabled: boolean, hour?: number, minute?: number) => void;
  setDailyReminder: (enabled: boolean, time?: string) => void;
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

function parseHourMinute(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(':');
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1], 10);
  return {
    hour: Number.isFinite(h) && h >= 0 && h <= 23 ? h : 20,
    minute: Number.isFinite(m) && m >= 0 && m <= 59 ? m : 0,
  };
}

function schedulePersist() {
  persistQueue = persistQueue
    .then(async () => {
      const state = useSettingsStore.getState();
      const data = {
        language: state.language,
        currency: state.currency,
        theme: state.theme,
        reminderEnabled: state.dailyReminderEnabled,
        reminderHour: state.reminderHour,
        reminderMinute: state.reminderMinute,
        dailyReminderEnabled: state.dailyReminderEnabled,
        reminderTime: state.reminderTime,
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
  reminderHour: 20,
  reminderMinute: 0,
  dailyReminderEnabled: false,
  reminderTime: '20:00',
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
    const update: Partial<SettingsState> = {
      reminderEnabled,
      dailyReminderEnabled: reminderEnabled,
    };
    if (hour !== undefined) update.reminderHour = hour;
    if (minute !== undefined) update.reminderMinute = minute;
    if (hour !== undefined || minute !== undefined) {
      const h = hour !== undefined ? hour : 20;
      const m = minute !== undefined ? minute : 0;
      update.reminderTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    set(update);
    schedulePersist();
  },
  setDailyReminder: (dailyReminderEnabled, time) => {
    const update: Partial<SettingsState> = {
      dailyReminderEnabled,
      reminderEnabled: dailyReminderEnabled,
    };
    if (time) {
      update.reminderTime = time;
      const parsed = parseHourMinute(time);
      update.reminderHour = parsed.hour;
      update.reminderMinute = parsed.minute;
    }
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
      const enabled =
        typeof record.dailyReminderEnabled === 'boolean'
          ? record.dailyReminderEnabled
          : typeof record.reminderEnabled === 'boolean'
            ? record.reminderEnabled
            : false;
      const timeStr = typeof record.reminderTime === 'string' ? record.reminderTime : '20:00';
      const parsedTime = parseHourMinute(timeStr);
      const finalHour =
        typeof record.reminderHour === 'number' ? record.reminderHour : parsedTime.hour;
      const finalMinute =
        typeof record.reminderMinute === 'number' ? record.reminderMinute : parsedTime.minute;

      set({
        language: isOneOf(record.language, LANGUAGES) ? record.language : 'bn',
        currency: isOneOf(record.currency, CURRENCIES) ? record.currency : 'BDT',
        theme: isOneOf(record.theme, THEMES) ? record.theme : 'system',
        reminderEnabled: enabled,
        reminderHour: finalHour,
        reminderMinute: finalMinute,
        dailyReminderEnabled: enabled,
        reminderTime:
          typeof record.reminderTime === 'string'
            ? record.reminderTime
            : `${String(finalHour).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')}`,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
