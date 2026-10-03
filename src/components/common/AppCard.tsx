import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
  GestureResponderEvent,
  AccessibilityRole,
} from 'react-native';
import { useTheme } from '../../theme';

export type CardVariant = 'default' | 'elevated' | 'glow' | 'subtle';

export interface AppCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  glowColor?: string;
  onPress?: (event: GestureResponderEvent) => void;
  padding?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  testID?: string;
}

export const AppCard: React.FC<AppCardProps> = React.memo(({
  children,
  variant = 'default',
  style,
  elevation = 'sm',
  bordered = true,
  glowColor,
  onPress,
  padding,
  accessibilityRole,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'elevated':
        return theme.colors.cardElevated;
      case 'subtle':
        return theme.colors.surfaceSubtle;
      case 'glow':
      case 'default':
      default:
        return theme.colors.card;
    }
  };

  const getBorderColor = (): string => {
    if (!bordered) {
      return 'transparent';
    }
    if (variant === 'glow') {
      return glowColor || theme.colors.glowPrimary;
    }
    return theme.colors.border;
  };

  const cardPadding = padding !== undefined ? padding : theme.spacing.lg;

  const cardStyle = [
    styles.card,
    bordered ? styles.bordered : styles.unbordered,
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: theme.radii.lg,
      padding: cardPadding,
      borderColor: getBorderColor(),
    },
    variant === 'glow' ? { borderWidth: 1.5 } : undefined,
    theme.shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={({ pressed }) => [cardStyle, pressed ? styles.pressed : undefined]}
        android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={cardStyle}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 1,
  },
  unbordered: {
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
