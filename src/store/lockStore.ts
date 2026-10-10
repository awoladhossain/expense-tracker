import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export interface LockState {
  hasPinSet: boolean;
  pinHash: string | null;
  biometricsEnabled: boolean;
  isUnlocked: boolean;
  isLoaded: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<{ success: boolean; lockedOut?: boolean; remainingSeconds?: number }>;
  removePin: () => Promise<void>;
  toggleBiometrics: (enabled?: boolean) => void;
  setUnlocked: (unlocked: boolean) => void;
  loadLockState: () => Promise<void>;
  getRemainingLockoutSeconds: () => number;
}

const STORAGE_KEY = '@app_lock';
const SECURE_PIN_HASH_KEY = 'expense_tracker_pin_hash';
const SECURE_PIN_SALT_KEY = 'expense_tracker_pin_salt';

let persistQueue: Promise<void> = Promise.resolve();

function schedulePersist() {
  persistQueue = persistQueue
    .then(async () => {
      const state = useLockStore.getState();
      const metadata = {
        hasPinSet: state.hasPinSet,
        biometricsEnabled: state.biometricsEnabled,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    })
    .catch((err) => {
      console.warn('Failed to persist lock metadata', err);
    });
}

/**
 * hashPinWithSalt — Uses multi-round SHA-512 stretching with a unique device salt.
 */
export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  let digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    `${salt}:${pin}:${salt}`,
  );
  // Key stretching rounds to defeat brute-force
  for (let i = 0; i < 2000; i++) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      `${digest}:${salt}:${i}`,
    );
  }
  return digest;
}

export const useLockStore = create<LockState>((set, get) => ({
  hasPinSet: false,
  pinHash: null,
  biometricsEnabled: false,
  isUnlocked: false,
  isLoaded: false,
  failedAttempts: 0,
  lockoutUntil: null,

  getRemainingLockoutSeconds: () => {
    const { lockoutUntil } = get();
    if (!lockoutUntil) return 0;
    const remainingMs = lockoutUntil - Date.now();
    if (remainingMs <= 0) {
      set({ lockoutUntil: null });
      return 0;
    }
    return Math.ceil(remainingMs / 1000);
  },

  setPin: async (pin: string) => {
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    const salt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const hash = await hashPinWithSalt(pin, salt);

    await SecureStore.setItemAsync(SECURE_PIN_SALT_KEY, salt, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(SECURE_PIN_HASH_KEY, hash, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });

    set({
      hasPinSet: true,
      pinHash: hash,
      isUnlocked: true,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    schedulePersist();
  },

  verifyPin: async (pin: string) => {
    const state = get();
    const remaining = state.getRemainingLockoutSeconds();
    if (remaining > 0) {
      return { success: false, lockedOut: true, remainingSeconds: remaining };
    }

    let salt = await SecureStore.getItemAsync(SECURE_PIN_SALT_KEY);
    let storedHash = await SecureStore.getItemAsync(SECURE_PIN_HASH_KEY);

    // Fallback/migration check if stored in Zustand/AsyncStorage state from prior version
    if (!storedHash && state.pinHash) {
      // Legacy unsalted SHA-256 fallback verify
      const legacyHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
      if (legacyHash === state.pinHash) {
        // Automatically upgrade to salted SecureStore hash
        await get().setPin(pin);
        set({ isUnlocked: true, failedAttempts: 0, lockoutUntil: null });
        return { success: true };
      }
    }

    if (!salt || !storedHash) {
      return { success: false };
    }

    const computedHash = await hashPinWithSalt(pin, salt);
    const valid = computedHash === storedHash;

    if (valid) {
      set({ isUnlocked: true, failedAttempts: 0, lockoutUntil: null });
      return { success: true };
    }

    const nextAttempts = state.failedAttempts + 1;
    let lockoutDuration = 0;
    if (nextAttempts >= 10) {
      lockoutDuration = 300 * 1000; // 5 minutes
    } else if (nextAttempts >= 5) {
      lockoutDuration = 30 * 1000; // 30 seconds
    }

    const lockoutUntil = lockoutDuration > 0 ? Date.now() + lockoutDuration : null;
    set({ failedAttempts: nextAttempts, lockoutUntil });

    return {
      success: false,
      lockedOut: lockoutDuration > 0,
      remainingSeconds: Math.ceil(lockoutDuration / 1000),
    };
  },

  removePin: async () => {
    set({
      hasPinSet: false,
      pinHash: null,
      biometricsEnabled: false,
      isUnlocked: true,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    try {
      await SecureStore.deleteItemAsync(SECURE_PIN_SALT_KEY);
      await SecureStore.deleteItemAsync(SECURE_PIN_HASH_KEY);
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
      const [raw, secureHash] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        SecureStore.getItemAsync(SECURE_PIN_HASH_KEY),
      ]);

      let hasPin = false;
      let biometricsEnabled = false;
      let pinHash: string | null = secureHash;

      if (raw) {
        const parsed = JSON.parse(raw) as {
          hasPinSet?: boolean;
          pinHash?: string | null;
          biometricsEnabled?: boolean;
        };
        biometricsEnabled = Boolean(parsed.biometricsEnabled);
        if (secureHash) {
          hasPin = true;
        } else if (parsed.hasPinSet && parsed.pinHash) {
          // Legacy hash found
          hasPin = true;
          pinHash = parsed.pinHash;
        }
      } else if (secureHash) {
        hasPin = true;
      }

      set({
        hasPinSet: hasPin,
        pinHash,
        biometricsEnabled,
        isUnlocked: !hasPin,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true, isUnlocked: true });
    }
  },
}));
