import Toast from 'react-native-toast-message';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

export interface ToastOptions {
  description?: string;
  duration?: number;
}

interface ToastState {
  currentToast: ToastItem | null;
  showToast: (
    title: string,
    type?: ToastType,
    options?: ToastOptions,
  ) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  currentToast: null,
  showToast: (
    title: string,
    type: ToastType = 'success',
    options?: ToastOptions,
  ) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Defaults: error gets longer reading time (3500ms), warning (3000ms), info (2500ms), success (2000ms)
    const defaultDuration =
      type === 'error' ? 3500 : type === 'warning' ? 3000 : type === 'info' ? 2500 : 2000;

    set({
      currentToast: {
        id,
        title,
        description: options?.description,
        type,
        duration: options?.duration ?? defaultDuration,
      },
    });
  },
  hideToast: () => {
    set({ currentToast: null });
  },
}));

export const toast = {
  success: (title: string, options?: ToastOptions | string) => {
    const text2 = typeof options === 'string' ? options : options?.description;
    const visibilityTime = typeof options === 'object' ? options?.duration : undefined;
    Toast.show({
      type: 'success',
      text1: title,
      text2,
      visibilityTime,
    });
  },
  error: (title: string, options?: ToastOptions | string) => {
    const text2 = typeof options === 'string' ? options : options?.description;
    const visibilityTime = typeof options === 'object' ? options?.duration : undefined;
    Toast.show({
      type: 'error',
      text1: title,
      text2,
      visibilityTime,
    });
  },
  info: (title: string, options?: ToastOptions | string) => {
    const text2 = typeof options === 'string' ? options : options?.description;
    const visibilityTime = typeof options === 'object' ? options?.duration : undefined;
    Toast.show({
      type: 'info',
      text1: title,
      text2,
      visibilityTime,
    });
  },
  warning: (title: string, options?: ToastOptions | string) => {
    const text2 = typeof options === 'string' ? options : options?.description;
    const visibilityTime = typeof options === 'object' ? options?.duration : undefined;
    Toast.show({
      type: 'info',
      text1: title,
      text2,
      visibilityTime,
    });
  },
  dismiss: () => Toast.hide(),
};
