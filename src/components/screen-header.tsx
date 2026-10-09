import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';

export interface ScreenHeaderProps {
  title: string;
  rightAction?: ReactNode;
  subtitle?: string;
}

export function ScreenHeader({ title, rightAction, subtitle }: ScreenHeaderProps) {
  const colors = useThemeColor();

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.spacing.lg,
  },
  left: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Tokens.typography.title.fontSize,
    lineHeight: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: Tokens.typography.caption.fontSize,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: Tokens.touchTarget,
    minHeight: Tokens.touchTarget,
  },
});
