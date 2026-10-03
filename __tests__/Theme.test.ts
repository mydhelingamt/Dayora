import { lightTheme, darkTheme, goldenTheme, spacing, typography, radii } from '../src/theme';

describe('Theme Primitives', () => {
  it('defines consistent spacing values', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
  });

  it('defines valid corner radii', () => {
    expect(radii.sm).toBe(10);
    expect(radii.md).toBe(14);
    expect(radii.lg).toBe(18);
    expect(radii.full).toBe(9999);
  });

  it('provides complete light, dark, and golden palettes', () => {
    expect(lightTheme.isDark).toBe(false);
    expect(darkTheme.isDark).toBe(true);
    expect(goldenTheme.isDark).toBe(true);
    expect(lightTheme.colors.primary).toBeDefined();
    expect(darkTheme.colors.primary).toBeDefined();
    expect(goldenTheme.colors.primary).toBe('#FFD700');
    expect(goldenTheme.colors.surface).toBe('#18140B');
    expect(goldenTheme.colors.text).toBe('#FFFBF0');
    expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
    expect(goldenTheme.colors.background).not.toBe(darkTheme.colors.background);
  });

  it('defines typography scale tokens with sizes and line heights', () => {
    expect(typography.bodyMedium?.fontSize).toBe(14);
    expect(typography.bodyMedium?.lineHeight).toBe(20);
    expect(typography.titleLarge?.fontSize).toBe(18);
  });
});
