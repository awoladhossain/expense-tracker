/**
 * Expense Tracker — User Profile Zustand Store
 * Persisted via AsyncStorage (@user_profile)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type UserTier = 'free' | 'pro';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
  tier: UserTier;
}

export interface UserProfileState extends UserProfile {
  isLoaded: boolean;
  updateProfile: (partial: Partial<UserProfile>) => void;
  toggleTier: () => void;
  loadProfile: () => Promise<void>;
  resetProfile: () => Promise<void>;
}

const STORAGE_KEY = '@user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: '',
  avatar: null,
  tier: 'free',
};

let persistQueue: Promise<void> = Promise.resolve();

function schedulePersist() {
  persistQueue = persistQueue
    .then(async () => {
      const state = useUserProfileStore.getState();
      const data: UserProfile = {
        name: state.name,
        email: state.email,
        avatar: state.avatar,
        tier: state.tier,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    })
    .catch((err) => {
      console.warn('Failed to persist user profile', err);
    });
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  ...DEFAULT_PROFILE,
  isLoaded: false,

  updateProfile: (partial) => {
    set((state) => ({ ...state, ...partial }));
    schedulePersist();
  },

  toggleTier: () => {
    set((state) => ({
      tier: state.tier === 'free' ? 'pro' : 'free',
    }));
    schedulePersist();
  },

  loadProfile: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ isLoaded: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      set({
        name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : DEFAULT_PROFILE.name,
        email: typeof parsed.email === 'string' ? parsed.email : DEFAULT_PROFILE.email,
        avatar: typeof parsed.avatar === 'string' ? parsed.avatar : null,
        tier: parsed.tier === 'pro' ? 'pro' : 'free',
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  resetProfile: async () => {
    set({ ...DEFAULT_PROFILE, isLoaded: true });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
}));
