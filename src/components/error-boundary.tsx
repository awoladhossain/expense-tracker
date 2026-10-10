import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { DevSettings, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { getTranslations } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo.componentStack);
  }

  handleRestart = (): void => {
    if (__DEV__ && DevSettings?.reload) {
      DevSettings.reload();
      return;
    }

    // Reset error state for component re-mount
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const settings = useSettingsStore.getState();
      const scheme = settings.theme === 'dark' ? 'dark' : 'light';
      const palette = Colors[scheme];
      const t = getTranslations(settings.language);

      return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${palette.danger}15`,
                  borderColor: `${palette.danger}30`,
                },
              ]}>
              <AlertTriangle color={palette.danger} size={56} strokeWidth={1.8} />
            </View>

            <Text style={[styles.title, { color: palette.text }]}>{t.common.error}</Text>

            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              Please restart the app
            </Text>

            <GradientButton
              icon={RotateCcw}
              onPress={this.handleRestart}
              style={styles.restartBtn}
              title="Restart App"
              variant="primary"
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xl,
    paddingVertical: Tokens.spacing.section,
    gap: Tokens.spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: Tokens.radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  title: {
    fontSize: Tokens.typography.title.fontSize,
    lineHeight: Tokens.typography.title.lineHeight,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Tokens.typography.body.fontSize,
    lineHeight: Tokens.typography.body.lineHeight,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 300,
  },
  restartBtn: {
    marginTop: Tokens.spacing.sm,
    minWidth: 180,
  },
});
