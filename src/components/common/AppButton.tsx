import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  leftIcon,
  rightIcon,
}) => {
  const { theme } = useTheme();

  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean): string => {
    if (isDisabled) {
      return theme.colors.surfaceSubtle;
    }
    switch (variant) {
      case 'primary':
        return pressed ? theme.colors.primaryDark : theme.colors.primary;
      case 'secondary':
        return pressed ? theme.colors.surfaceSubtle : theme.colors.cardElevated;
      case 'accent':
        return pressed ? '#D97706' : theme.colors.accent;
      case 'outline':
      case 'ghost':
        return pressed ? theme.colors.surfaceSubtle : 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) {
      return theme.colors.textMuted;
    }
    switch (variant) {
      case 'primary':
      case 'accent':
        return theme.colors.textInverse;
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.primaryLight;
      case 'ghost':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textInverse;
    }
  };

  const getDimensions = (): { minHeight: number; minWidth?: number; paddingHorizontal: number } => {
    switch (size) {
      case 'sm':
        return {
          minHeight: theme.dimensions.buttonHeightSm,
          minWidth: fullWidth ? undefined : 68,
          paddingHorizontal: theme.spacing.md,
        };
      case 'lg':
        return {
          minHeight: theme.dimensions.buttonHeightLg,
          minWidth: fullWidth ? undefined : 100,
          paddingHorizontal: theme.spacing.xxl,
        };
      case 'md':
      default:
        return {
          minHeight: theme.dimensions.buttonHeightMd,
          minWidth: fullWidth ? undefined : 84,
          paddingHorizontal: theme.spacing.lg,
        };
    }
  };

  const dims = getDimensions();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{
        color: variant === 'primary' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: dims.minHeight,
          minWidth: dims.minWidth,
          paddingHorizontal: dims.paddingHorizontal,
          backgroundColor: getBackgroundColor(pressed),
          borderRadius: theme.radii.md,
          borderColor: variant === 'outline' ? theme.colors.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}
          <AppText
            variant={size === 'sm' ? 'labelMedium' : 'labelLarge'}
            color={getTextColor()}
            weight="600"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.buttonText}
          >
            {title}
          </AppText>
          {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  buttonText: {
    textAlign: 'center',
    flexShrink: 1,
  },
  leftIconWrapper: {
    marginRight: 6,
    flexShrink: 0,
  },
  rightIconWrapper: {
    marginLeft: 6,
    flexShrink: 0,
  },
});
