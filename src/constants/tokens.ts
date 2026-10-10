/**
 * Expense Tracker — Design Tokens
 * Spacing, Radius, Touch Target, Shadows & Typography Scale
 */

export const Tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    section: 32,
    huge: 48,
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    card: 20,
    full: 999,
  },
  borderWidth: {
    hairline: 0.5,
    thin: 1,
    medium: 1.5,
    thick: 2,
  },
  touchTarget: 44,
  typography: {
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      fontWeight: '500' as const,
    },
    captionBold: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontWeight: '700' as const,
    },
    bodySm: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: '400' as const,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.1,
      fontWeight: '400' as const,
    },
    bodyBold: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.1,
      fontWeight: '600' as const,
    },
    bodyLg: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: -0.2,
      fontWeight: '500' as const,
    },
    bodyLgBold: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: -0.2,
      fontWeight: '700' as const,
    },
    title: {
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.3,
      fontWeight: '700' as const,
    },
    headline: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.4,
      fontWeight: '700' as const,
    },
    hero: {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.6,
      fontWeight: '800' as const,
    },
    display: {
      fontSize: 40,
      lineHeight: 48,
      letterSpacing: -1,
      fontWeight: '800' as const,
    },
  },
  shadows: {
    subtle: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    popover: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
  },
} as const;

export type TokensType = typeof Tokens;
export type SpacingKey = keyof typeof Tokens.spacing;
export type RadiusKey = keyof typeof Tokens.radius;
export type TypographyKey = keyof typeof Tokens.typography;
