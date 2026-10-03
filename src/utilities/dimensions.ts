import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard mobile baseline dimensions (typical modern Android/iOS viewport)
const BASELINE_WIDTH = 375;
const BASELINE_HEIGHT = 812;

export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallPhone: SCREEN_WIDTH < 360,
  isStandardPhone: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 412,
  isLargePhone: SCREEN_WIDTH >= 412 && SCREEN_WIDTH < 600,
  isTablet: SCREEN_WIDTH >= 600,
  pixelRatio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
  touchTargetMin: 48,
  containerPadding: SCREEN_WIDTH < 360 ? 12 : 16,
};

/**
 * Scales a dimension proportionally to screen width.
 */
export function scale(size: number): number {
  return Math.round((SCREEN_WIDTH / BASELINE_WIDTH) * size);
}

/**
 * Scales a dimension proportionally to screen height.
 */
export function verticalScale(size: number): number {
  return Math.round((SCREEN_HEIGHT / BASELINE_HEIGHT) * size);
}

/**
 * Moderate scale that balances proportionality with fixed constraints.
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  return Math.round(size + (scale(size) - size) * factor);
}

/**
 * Clamps a number within an inclusive min and max range.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Returns responsive column widths for 2-column or 3-column layouts.
 */
export function getColumnWidth(columns: number = 2, totalMargin: number = 32, gap: number = 12): number {
  const availableWidth = SCREEN_WIDTH - totalMargin - (columns - 1) * gap;
  return Math.floor(availableWidth / columns);
}
