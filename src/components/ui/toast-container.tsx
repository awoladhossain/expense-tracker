/* eslint-disable react-hooks/immutability */
import * as Haptics from 'expo-haptics';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { useToastStore, type ToastType } from '@/store/toastStore';

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const currentToast = useToastStore((state) => state.currentToast);
  const hideToast = useToastStore((state) => state.hideToast);

  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (currentToast) {
      if (Platform.OS !== 'web') {
        if (currentToast.type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        } else if (currentToast.type === 'warning') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }

      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      scale.value = withSpring(1, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 180 });

      const duration = currentToast.duration ?? 2500;
      const timer = setTimeout(() => {
        translateY.value = withTiming(-40, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.95, { duration: 200 }, () => {
          runOnJS(hideToast)();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -60;
      opacity.value = 0;
      scale.value = 0.95;
    }
  }, [currentToast, hideToast, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!currentToast) return null;

  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 color={colors.success} size={18} strokeWidth={2.2} />,
          iconBg: `${colors.success}15`,
          accent: colors.success,
        };
      case 'error':
        return {
          icon: <AlertCircle color={colors.danger} size={18} strokeWidth={2.2} />,
          iconBg: `${colors.danger}15`,
          accent: colors.danger,
        };
      case 'warning':
        return {
          icon: <TriangleAlert color={colors.warning} size={18} strokeWidth={2.2} />,
          iconBg: `${colors.warning}15`,
          accent: colors.warning,
        };
      case 'info':
      default:
        return {
          icon: <Info color={colors.primary} size={18} strokeWidth={2.2} />,
          iconBg: `${colors.primary}15`,
          accent: colors.primary,
        };
    }
  };

  const styleConfig = getTypeStyles(currentToast.type);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="box-none"
      style={[
        styles.overlay,
        { top: Math.max(insets.top, 16) + 4 },
        animatedStyle,
      ]}>
      <Pressable
        accessibilityHint="Dismiss alert"
        accessibilityLabel={`${currentToast.type}: ${currentToast.title}${currentToast.description ? `. ${currentToast.description}` : ''}`}
        accessibilityRole="button"
        onPress={() => {
          translateY.value = withTiming(-40, { duration: 180 });
          opacity.value = withTiming(0, { duration: 180 });
          scale.value = withTiming(0.95, { duration: 180 }, () => {
            hideToast();
          });
        }}
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}>
        {/* Semantic Accent Pill Icon */}
        <View style={[styles.iconContainer, { backgroundColor: styleConfig.iconBg }]}>
          {styleConfig.icon}
        </View>

        {/* Content Body */}
        <View style={styles.textContainer}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {currentToast.title}
          </Text>
          {currentToast.description ? (
            <Text numberOfLines={2} style={[styles.description, { color: colors.textMuted }]}>
              {currentToast.description}
            </Text>
          ) : null}
        </View>

        {/* Subtle Dismiss Action */}
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => {
            translateY.value = withTiming(-40, { duration: 180 });
            opacity.value = withTiming(0, { duration: 180 });
            scale.value = withTiming(0.95, { duration: 180 }, () => {
              hideToast();
            });
          }}
          style={styles.closeBtn}>
          <X color={colors.textMuted} size={15} strokeWidth={2} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: Tokens.spacing.lg,
    right: Tokens.spacing.lg,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.spacing.sm + 2,
    paddingHorizontal: Tokens.spacing.md,
    borderRadius: Tokens.radius.lg,
    borderWidth: 1,
    maxWidth: 440,
    width: '100%',
    ...Tokens.shadows.card,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Tokens.spacing.sm + 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  title: {
    fontSize: Tokens.typography.bodySm.fontSize,
    lineHeight: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: 16,
    fontWeight: '400',
  },
  closeBtn: {
    marginLeft: Tokens.spacing.sm,
    padding: Tokens.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

