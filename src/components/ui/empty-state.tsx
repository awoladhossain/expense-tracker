import { type LucideIcon } from 'lucide-react-native';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { GradientButton } from '@/components/ui/gradient-button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaIcon?: LucideIcon;
  onCta?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaIcon,
  onCta,
  style,
}: EmptyStateProps) {
  const colors = useThemeColor();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${colors.primary}15`,
            borderColor: `${colors.primary}30`,
          },
        ]}>
        <Icon color={colors.primary} size={48} strokeWidth={1.8} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>
      {ctaLabel && onCta ? (
        <GradientButton
          icon={ctaIcon}
          onPress={onCta}
          style={styles.ctaButton}
          title={ctaLabel}
          variant="primary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Tokens.spacing.section,
    paddingHorizontal: Tokens.spacing.xl,
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
    maxWidth: 280,
  },
  ctaButton: {
    marginTop: Tokens.spacing.sm,
    alignSelf: 'center',
    minHeight: 48,
    height: 48,
    paddingHorizontal: Tokens.spacing.xxl,
    borderRadius: Tokens.radius.full,
  },
});
