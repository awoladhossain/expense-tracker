/* eslint-disable react-hooks/immutability */
import * as Haptics from 'expo-haptics';
import { type LucideIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {Icon ? <Icon color={textColor} size={20} strokeWidth={2.2} /> : null}
            <Text ellipsizeMode="tail" numberOfLines={1} style={[styles.title, { color: textColor }]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: Tokens.radius.full,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xxl,
    gap: Tokens.spacing.sm,
  },
  title: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    lineHeight: Tokens.typography.bodyLg.lineHeight,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
