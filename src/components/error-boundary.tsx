import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/ui/gradient-button';
import { Colors } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
    // Note: Future production crash reporting (e.g. Sentry/Crashlytics) can hook here
  }

  handleRestart = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const palette = Colors.light;

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
              <AlertTriangle color={palette.danger} size={48} strokeWidth={1.8} />
            </View>

            <Text style={[styles.title, { color: palette.text }]}>Something went wrong</Text>

            <Text style={[styles.description, { color: palette.textMuted }]}>
              {this.state.error?.message ||
                'An unexpected error occurred. Please restart the application to continue.'}
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
    width: 88,
    height: 88,
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
  description: {
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
