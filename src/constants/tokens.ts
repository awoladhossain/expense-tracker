/**
 * Expense Tracker — Design Tokens
 * Spacing, Radius, Touch Target & Typography Scale
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
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    card: 24,
    full: 999,
  },
  touchTarget: 44,
  typography: {
    caption: {
      fontSize: 12,
      lineHeight: 18,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
    },
    bodyLg: {
      fontSize: 16,
      lineHeight: 24,
    },
    title: {
      fontSize: 20,
      lineHeight: 30,
    },
    headline: {
      fontSize: 24,
      lineHeight: 36,
    },
    hero: {
      fontSize: 32,
      lineHeight: 48,
    },
  },
} as const;

export type TokensType = typeof Tokens;
export type SpacingKey = keyof typeof Tokens.spacing;
export type RadiusKey = keyof typeof Tokens.radius;
export type TypographyKey = keyof typeof Tokens.typography;
