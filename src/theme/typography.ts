/**
 * Dayora Design System - Typography
 * Clean, native typographic scale optimized for readability on mobile screens.
 */

import { TextStyle } from 'react-native';

export interface TypographyToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing?: number;
}

export const typography: Record<string, TypographyToken> = {
  displayLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  headlineLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  headlineMedium: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  titleLarge: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
