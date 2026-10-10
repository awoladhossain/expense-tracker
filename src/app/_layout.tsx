import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, router, Tabs, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import { ChartColumn, Clock, House, Plus, Settings } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type AppStateStatus,
  type ColorValue,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OnboardingScreen, { ONBOARDING_KEY } from '@/app/onboarding';
import { ErrorBoundary } from '@/components/error-boundary';
import { PinLockModal } from '@/components/pin-lock-modal';
import Toast, { BaseToast, ErrorToast, type ToastConfig } from 'react-native-toast-message';
import { getDatabase } from '@/db/database';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useLockStore } from '@/store/lockStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import {
  setupNotificationChannelsAsync,
  scheduleDailyReminderAsync,
  isRunningInExpoGo,
} from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();

type BootPhase = 'booting' | 'ready' | 'error';

export default function RootLayout() {
  const colors = useAppColors();
  const { t } = useI18n();
  const theme = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();
  const scheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  const [phase, setPhase] = useState<BootPhase>('booting');
  const [attempt, setAttempt] = useState(0);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  const hasPinSet = useLockStore((state) => state.hasPinSet);
  const isUnlocked = useLockStore((state) => state.isUnlocked);
  const setUnlocked = useLockStore((state) => state.setUnlocked);
  const pendingDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function cleanupStaleExports() {
      try {
        const cacheDir = Paths.cache;
        const entries = cacheDir.list();
        const exportRegex = /^expense-tracker-.*\.(csv|json)$/;
        for (const entry of entries) {
          if (entry instanceof File && exportRegex.test(entry.name)) {
            try {
              entry.delete();
            } catch {
              // Ignore single file deletion failure
            }
          }
        }
      } catch {
        // Silent fail OK per SEC-07 specification
      }
    }

    async function prepare() {
      try {
        cleanupStaleExports().catch(() => {});
        const [, , , , onboardingDone] = await Promise.all([
          getDatabase(),
          useSettingsStore.getState().loadSettings(),
          useLockStore.getState().loadLockState(),
          useUserProfileStore.getState().loadProfile(),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);

        const settings = useSettingsStore.getState();

        // Initialize notification channel and sync reminder if enabled
        setupNotificationChannelsAsync().catch(() => {});
        if (settings.reminderEnabled) {
          scheduleDailyReminderAsync(
            settings.reminderHour,
            settings.reminderMinute,
            settings.language
          ).catch(() => {});
        }

        if (!cancelled) {
          setIsOnboardingCompleted(Boolean(onboardingDone));
          setPhase('ready');
          await SplashScreen.hideAsync().catch(() => {});
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Failed to start expense tracker', error);
        }
        if (!cancelled) {
          setPhase('error');
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    }

    prepare();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (phase === 'booting') return;
    SplashScreen.hideAsync().catch(() => {});
  }, [phase]);

  // Handle pending deep links upon unlocking
  useEffect(() => {
    if (isUnlocked && pendingDeepLinkRef.current) {
      const target = pendingDeepLinkRef.current;
      pendingDeepLinkRef.current = null;
      router.navigate(target as '/add' | '/budget' | '/stats' | '/history');
    }
  }, [isUnlocked]);

  // Register foreground presentation and response listeners for native notifications
  useEffect(() => {
    let responseSub: { remove: () => void } | null = null;

    async function initNotificationListeners() {
      if (isRunningInExpoGo()) return;
      try {
        const Notifications = await import('expo-notifications');
        if (!Notifications.addNotificationResponseReceivedListener) return;

        // Foreground presentation configuration
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Deep-link / navigate on notification tap with lock gate
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const url = response.notification.request.content.data?.url;
          if (typeof url === 'string') {
            const { isUnlocked: currentlyUnlocked } = useLockStore.getState();
            if (!currentlyUnlocked) {
              pendingDeepLinkRef.current = url;
            } else {
              router.navigate(url as '/add' | '/budget' | '/stats' | '/history');
            }
          }
        });
      } catch (err) {
        if (__DEV__) {
          console.warn('Failed to register notification listeners:', err);
        }
      }
    }

    initNotificationListeners();

    return () => {
      responseSub?.remove();
    };
  }, []);

  // Re-lock when app transitions to background or inactive (OWASP MASVS Lifecycle requirement)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const { hasPinSet: isPinConfigured } = useLockStore.getState();
        if (isPinConfigured) {
          useLockStore.getState().setUnlocked(false);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (phase === 'booting' && attempt === 0) return null;

  if (phase !== 'ready') {
    return (
      <View style={[styles.boot, { backgroundColor: colors.background }]}>
        {phase === 'booting' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.bootTitle, { color: colors.text }]}>{t.common.error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPhase('booting');
                setAttempt((value) => value + 1);
              }}
              style={[styles.retry, { backgroundColor: colors.primary }]}>
              <Text style={styles.retryLabel}>{t.common.retry}</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const showLockModal = hasPinSet && !isUnlocked;

  if (!isOnboardingCompleted) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <OnboardingScreen onComplete={() => setIsOnboardingCompleted(true)} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorBoundary>
          <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.tabActive,
                tabBarInactiveTintColor: colors.tabInactive,
                tabBarStyle: {
                  backgroundColor: colors.tabBackground,
                  borderTopColor: colors.border,
                },
                sceneStyle: { backgroundColor: colors.background },
              }}>
              <Tabs.Screen
                name="index"
                options={{
                  title: t.tabs.home,
                  tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
                  tabBarLabel: ({ color }) => <TabLabel color={color} label={t.tabs.home} />,
                }}
              />
              <Tabs.Screen
                name="stats"
                options={{
                  title: t.tabs.stats,
                  tabBarIcon: ({ color, size }) => <ChartColumn color={color} size={size} />,
                  tabBarLabel: ({ color }) => <TabLabel color={color} label={t.tabs.stats} />,
                }}
              />
              <Tabs.Screen
                name="add"
                options={{
                  title: t.tabs.add,
                  tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
                  tabBarLabel: ({ color }) => <TabLabel color={color} label={t.tabs.add} />,
                }}
              />
              <Tabs.Screen
                name="history"
                options={{
                  title: t.tabs.history,
                  tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
                  tabBarLabel: ({ color }) => <TabLabel color={color} label={t.tabs.history} />,
                }}
              />
              <Tabs.Screen
                name="settings"
                options={{
                  title: t.tabs.settings,
                  tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                  tabBarLabel: ({ color }) => <TabLabel color={color} label={t.tabs.settings} />,
                }}
              />
              <Tabs.Screen name="budget" options={{ href: null }} />
              <Tabs.Screen name="edit-transaction" options={{ href: null }} />
              <Tabs.Screen name="onboarding" options={{ href: null }} />
            </Tabs>

            {/* Security Gate PIN Modal */}
            {showLockModal && (
              <PinLockModal
                mode="unlock"
                onSuccess={() => setUnlocked(true)}
                visible={showLockModal}
              />
            )}

            {/* Global Toast System */}
            <Toast
              config={createToastConfig(colors)}
              position="bottom"
              bottomOffset={100}
            />
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function createToastConfig(colors: ReturnType<typeof useAppColors>): ToastConfig {
  return {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.success,
          borderLeftWidth: 5,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 14,
          height: undefined,
          minHeight: 60,
          paddingVertical: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 14 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
        }}
        text1NumberOfLines={2}
        text2NumberOfLines={2}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: colors.danger,
          borderLeftWidth: 5,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 14,
          height: undefined,
          minHeight: 60,
          paddingVertical: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 14 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
        }}
        text1NumberOfLines={2}
        text2NumberOfLines={2}
      />
    ),
    info: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.primary,
          borderLeftWidth: 5,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 14,
          height: undefined,
          minHeight: 60,
          paddingVertical: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
          width: '90%',
        }}
        contentContainerStyle={{ paddingHorizontal: 14 }}
        text1Style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.textMuted,
          marginTop: 2,
        }}
        text1NumberOfLines={2}
        text2NumberOfLines={2}
      />
    ),
  };
}

function TabLabel({ color, label }: { color: ColorValue; label: string }) {
  return (
    <Text numberOfLines={1} style={[styles.tabLabel, { color }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  bootTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  retry: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  retryLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
