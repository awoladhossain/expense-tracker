import { type LucideIcon } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'pro' | 'pill';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Badge({
  label,
  variant = 'neutral',
  icon: Icon,
  style,
  onPress,
}: BadgeProps) {
  const colors = useThemeColor();

  const getVariantColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: `${colors.success}18`,
          text: colors.success,
          border: `${colors.success}40`,
        };
      case 'warning':
        return {
          bg: `${colors.warning}18`,
          text: colors.warning,
          border: `${colors.warning}40`,
        };
      case 'danger':
        return {
          bg: `${colors.danger}18`,
          text: colors.danger,
          border: `${colors.danger}40`,
        };
      case 'pro':
        return {
          bg: `${colors.accent}1F`,
          text: colors.accent,
          border: `${colors.accent}50`,
        };
      case 'pill':
        return {
          bg: colors.primaryLight,
          text: colors.primary,
          border: 'transparent',
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceAlt,
          text: colors.textMuted,
          border: colors.border,
        };
    }
  };

  const palette = getVariantColors();

  const isPill = variant === 'pill';
  const badgeStyle = [
    styles.badge,
    isPill && styles.pillBadge,
    {
      backgroundColor: palette.bg,
      borderColor: palette.border,
    },
    style,
  ];

  const content = (
    <>
      {Icon ? (
        <Icon color={palette.text} size={isPill ? 14 : 12} strokeWidth={2.5} />
      ) : null}
      <Text style={[styles.label, isPill && styles.pillLabel, { color: palette.text }]}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onPress}
        style={badgeStyle}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={badgeStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
    paddingHorizontal: Tokens.spacing.sm,
    paddingVertical: Tokens.spacing.xs,
    gap: Tokens.spacing.xs,
  },
  pillBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 0,
    justifyContent: 'center',
  },
  label: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pillLabel: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: Tokens.typography.caption.lineHeight,
    fontWeight: '700',
  },
});
