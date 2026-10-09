/**
 * Expense Tracker — App Lock & Security Zustand Store
 * PIN hashed via SHA-256 (expo-crypto)
 * Persisted via AsyncStorage (@app_lock)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

export interface LockState {
  hasPinSet: boolean;
  pinHash: string | null;
  biometricsEnabled: boolean;
  isUnlocked: boolean;
  isLoaded: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  removePin: () => Promise<void>;
  toggleBiometrics: (enabled?: boolean) => void;
  setUnlocked: (unlocked: boolean) => void;
  loadLockState: () => Promise<void>;
}

const STORAGE_KEY = '@app_lock';

let persistQueue: Promise<void> = Promise.resolve();

function schedulePersist() {
  persistQueue = persistQueue
    .then(async () => {
      const state = useLockStore.getState();
      const data = {
        hasPinSet: state.hasPinSet,
        pinHash: state.pinHash,
        biometricsEnabled: state.biometricsEnabled,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    })
    .catch((err) => {
      console.warn('Failed to persist lock state', err);
    });
}

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export const useLockStore = create<LockState>((set, get) => ({
  hasPinSet: false,
  pinHash: null,
  biometricsEnabled: false,
  isUnlocked: false,
  isLoaded: false,

  setPin: async (pin: string) => {
    const hash = await hashPin(pin);
    set({
      hasPinSet: true,
      pinHash: hash,
      isUnlocked: true,
    });
    schedulePersist();
  },

  verifyPin: async (pin: string) => {
    const currentHash = get().pinHash;
    if (!currentHash) return false;
    const inputHash = await hashPin(pin);
    const valid = inputHash === currentHash;
    if (valid) {
      set({ isUnlocked: true });
    }
    return valid;
  },

  removePin: async () => {
    set({
      hasPinSet: false,
      pinHash: null,
      biometricsEnabled: false,
      isUnlocked: true,
    });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  toggleBiometrics: (enabled) => {
    set((state) => ({
      biometricsEnabled: enabled !== undefined ? enabled : !state.biometricsEnabled,
    }));
    schedulePersist();
  },

  setUnlocked: (unlocked: boolean) => {
    set({ isUnlocked: unlocked });
  },

  loadLockState: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ isLoaded: true, isUnlocked: true });
        return;
      }
      const parsed = JSON.parse(raw) as {
        hasPinSet?: boolean;
        pinHash?: string | null;
        biometricsEnabled?: boolean;
      };
      const hasPin = Boolean(parsed.hasPinSet && parsed.pinHash);
      set({
        hasPinSet: hasPin,
        pinHash: parsed.pinHash ?? null,
        biometricsEnabled: Boolean(parsed.biometricsEnabled),
        // If a PIN is configured, app starts locked until verified
        isUnlocked: !hasPin,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true, isUnlocked: true });
    }
  },
}));
