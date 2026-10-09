import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ChartColumn, Clock, House, Plus, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View, type ColorValue } from 'react-native';

import { getDatabase } from '@/db/database';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore } from '@/store/settingsStore';

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

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        await Promise.all([getDatabase(), useSettingsStore.getState().loadSettings()]);
        if (!cancelled) setPhase('ready');
      } catch (error) {
        console.warn('Failed to start expense tracker', error);
        if (!cancelled) setPhase('error');
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

  return (
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
      </Tabs>
    </ThemeProvider>
  );
}

function TabLabel({ color, label }: { color: ColorValue; label: string }) {
  return (
    <Text numberOfLines={1} style={[styles.tabLabel, { color }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  bootTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  retry: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  retryLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
