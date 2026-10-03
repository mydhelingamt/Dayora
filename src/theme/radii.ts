/**
 * Dayora Design System - Corner Radii
 * Modern squircle and rounded corner tokens.
 */

export const radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export type RadiiKey = keyof typeof radii;
