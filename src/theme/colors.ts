/**
 * Dayora Design System - Color Palette
 * Curated, harmonious tokens for light and dark modes with high accessibility contrast.
 * Tailored for a premium dark navy/near-black visual foundation.
 */

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  cardElevated: string;
  cardGradientStart: string;
  cardGradientEnd: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  divider: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  error: string;
  errorBackground: string;
  info: string;
  infoBackground: string;
  glowPrimary: string;
  glowSecondary: string;
  glowAccent: string;
  overlay: string;
}

export const lightColors: ColorPalette = {
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  secondary: '#0EA5E9', // Sky 500
  secondaryLight: '#38BDF8',
  secondaryDark: '#0284C7',
  accent: '#F59E0B', // Amber 500
  accentLight: '#FBBF24',
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F8FAFC',
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',
  border: '#E2E8F0', // Slate 200
  borderSubtle: '#F1F5F9',
  divider: '#E2E8F0',
  success: '#10B981', // Emerald 500
  successBackground: '#ECFDF5',
  warning: '#F59E0B', // Amber 500
  warningBackground: '#FFFBEB',
  error: '#EF4444', // Red 500
  errorBackground: '#FEF2F2',
  info: '#3B82F6', // Blue 500
  infoBackground: '#EFF6FF',
  glowPrimary: 'rgba(79, 70, 229, 0.12)',
  glowSecondary: 'rgba(14, 165, 233, 0.10)',
  glowAccent: 'rgba(245, 158, 11, 0.12)',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

export const darkColors: ColorPalette = {
  primary: '#6366F1', // Indigo 500
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  secondary: '#38BDF8', // Sky 400
  secondaryLight: '#7DD3FC',
  secondaryDark: '#0284C7',
  accent: '#FBBF24', // Amber 400
  accentLight: '#FDE68A',
  background: '#080C15', // Premium dark navy / near-black
  surface: '#0E1424', // Deep navy surface
  surfaceSubtle: '#141D33', // Subtle navy element
  card: '#121A2D', // Deep rounded card surface
  cardElevated: '#17223B', // Floating card surface
  cardGradientStart: '#151F38',
  cardGradientEnd: '#0D1322',
  text: '#F1F5F9', // Slate 100
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  textInverse: '#080C15',
  border: 'rgba(255, 255, 255, 0.08)', // Subtle border
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  divider: 'rgba(255, 255, 255, 0.06)',
  success: '#34D399', // Emerald 400
  successBackground: 'rgba(16, 185, 129, 0.15)',
  warning: '#FBBF24', // Amber 400
  warningBackground: 'rgba(245, 158, 11, 0.15)',
  error: '#F87171', // Red 400
  errorBackground: 'rgba(239, 68, 68, 0.15)',
  info: '#60A5FA', // Blue 400
  infoBackground: 'rgba(59, 130, 246, 0.15)',
  glowPrimary: 'rgba(99, 102, 241, 0.25)',
  glowSecondary: 'rgba(56, 189, 248, 0.20)',
  glowAccent: 'rgba(251, 191, 36, 0.20)',
  overlay: 'rgba(4, 6, 12, 0.75)',
};

export const goldenColors: ColorPalette = {
  primary: '#FFD700', // Brilliant Gold
  primaryLight: '#FFE57F', // Champagne highlight
  primaryDark: '#B39200', // Deep metallic gold
  secondary: '#D4AF37', // Metallic Gold
  secondaryLight: '#E6CA65',
  secondaryDark: '#997D1E',
  accent: '#FFA000', // Warm amber gold
  accentLight: '#FFD54F',
  background: '#0C0A06', // Deep obsidian warm golden background
  surface: '#18140B', // Rich dark gold surface
  surfaceSubtle: '#241E10', // Subtle gold element
  card: '#1C180E', // Golden card surface
  cardElevated: '#282214', // Floating golden card
  cardGradientStart: '#2A2210',
  cardGradientEnd: '#161208',
  text: '#FFFBF0', // Warm champagne white
  textSecondary: '#D8C7A5', // Warm golden sand
  textMuted: '#8C7E68', // Muted warm gold
  textInverse: '#0C0A06',
  border: 'rgba(255, 215, 0, 0.22)', // Soft golden border
  borderSubtle: 'rgba(255, 215, 0, 0.10)',
  divider: 'rgba(255, 215, 0, 0.14)',
  success: '#34D399',
  successBackground: 'rgba(16, 185, 129, 0.15)',
  warning: '#FFC107',
  warningBackground: 'rgba(255, 193, 7, 0.15)',
  error: '#F87171',
  errorBackground: 'rgba(239, 68, 68, 0.15)',
  info: '#F59E0B',
  infoBackground: 'rgba(245, 158, 11, 0.15)',
  glowPrimary: 'rgba(255, 215, 0, 0.32)',
  glowSecondary: 'rgba(212, 175, 55, 0.25)',
  glowAccent: 'rgba(255, 160, 0, 0.25)',
  overlay: 'rgba(8, 7, 4, 0.82)',
};

