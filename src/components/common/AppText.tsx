import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme, TypographyVariant } from '../../theme';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<AppTextProps> = React.memo(({
  children,
  variant = 'bodyMedium',
  color,
  weight,
  align,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const token = (variant ? theme.typography[variant] : undefined) ?? theme.typography.bodyMedium ?? {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: undefined,
  };

  return (
    <RNText
      maxFontSizeMultiplier={rest.maxFontSizeMultiplier ?? 1.3}
      style={[
        styles.base,
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: weight || token.fontWeight,
          letterSpacing: token.letterSpacing,
          color: color || theme.colors.text,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
});

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
