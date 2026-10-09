/* eslint-disable react-hooks/immutability */
import * as Haptics from 'expo-haptics';
import { type LucideIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';

export type GradientButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: GradientButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon: Icon,
  style,
}: GradientButtonProps) {
  const colors = useThemeColor();
  const scale = useSharedValue(1);

  const isInteractive = !disabled && !loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isInteractive) return;
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    if (!isInteractive) return;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = async () => {
    if (!isInteractive) return;
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return colors.text;
      case 'ghost':
        return colors.primary;
    }
  };

  const getContainerVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const textColor = getTextColor();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={!isInteractive}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        getContainerVariantStyle(),
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}>
      {variant === 'primary' ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%">
          <Defs>
            <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.primary} />
              <Stop offset="100%" stopColor={colors.accent} />
            </LinearGradient>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            rx={Tokens.radius.full}
            ry={Tokens.radius.full}
            fill="url(#btnGrad)"
          />
        </Svg>
      ) : null}

      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {Icon ? (
            <Icon color={textColor} size={20} strokeWidth={2.2} />
          ) : null}
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={[styles.title, { color: textColor }]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Tokens.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xxl,
    gap: Tokens.spacing.sm,
    overflow: 'hidden',
  },
  title: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
