import { ColorPalette, lightColors, darkColors, goldenColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radii } from './radii';
import { shadows } from './shadows';

export const themeDimensions = {
  buttonHeightSm: 36,
  buttonHeightMd: 48,
  buttonHeightLg: 56,
  inputHeight: 52,
  avatarXs: 28,
  avatarSm: 36,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 80,
  tabBarHeight: 64,
  touchTargetMin: 48,
  cardMinHeight: 72,
} as const;

export interface AppTheme {
  isDark: boolean;
  colors: ColorPalette;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  shadows: typeof shadows;
  dimensions: typeof themeDimensions;
}

export const lightTheme: AppTheme = {
  isDark: false,
  colors: lightColors,
  spacing,
  typography,
  radii,
  shadows,
  dimensions: themeDimensions,
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: darkColors,
  spacing,
  typography,
  radii,
  shadows,
  dimensions: themeDimensions,
};

export const goldenTheme: AppTheme = {
  isDark: true,
  colors: goldenColors,
  spacing,
  typography,
  radii,
  shadows,
  dimensions: themeDimensions,
};

export type ThemeMode = 'light' | 'dark' | 'system';
