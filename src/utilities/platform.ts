import { Platform, PixelRatio } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const androidApiVersion = isAndroid ? (Platform.Version as number) : 0;

/**
 * Heuristic for identifying low-end Android devices
 * (low pixel density, older Android versions, or narrow screen).
 */
export function isLowEndDevice(): boolean {
  if (!isAndroid) {
    return false;
  }
  const lowDensity = PixelRatio.get() <= 1.5; // mdpi or hdpi
  const olderVersion = androidApiVersion < 28; // Below Android 9 Pie
  return lowDensity || olderVersion;
}
