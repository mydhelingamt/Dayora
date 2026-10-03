import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = React.memo(({
  label,
  variant = 'primary',
  showDot = false,
  style,
}) => {
  const { theme } = useTheme();

  const getColors = (): { bg: string; text: string; dot: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.colors.successBackground,
          text: theme.colors.success,
          dot: theme.colors.success,
        };
      case 'warning':
        return {
          bg: theme.colors.warningBackground,
          text: theme.colors.warning,
          dot: theme.colors.warning,
        };
      case 'error':
        return {
          bg: theme.colors.errorBackground,
          text: theme.colors.error,
          dot: theme.colors.error,
        };
      case 'accent':
        return {
          bg: theme.colors.warningBackground,
          text: theme.colors.accent,
          dot: theme.colors.accent,
        };
      case 'secondary':
        return {
          bg: theme.colors.infoBackground,
          text: theme.colors.secondary,
          dot: theme.colors.secondary,
        };
      case 'neutral':
        return {
          bg: theme.colors.surfaceSubtle,
          text: theme.colors.textSecondary,
          dot: theme.colors.textMuted,
        };
      case 'primary':
      default:
        return {
          bg: 'rgba(99, 102, 241, 0.15)',
          text: theme.colors.primaryLight,
          dot: theme.colors.primary,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderRadius: theme.radii.full,
          paddingHorizontal: theme.spacing.sm,
        },
        style,
      ]}
    >
      {showDot ? (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: colors.dot,
            },
          ]}
        />
      ) : null}
      <AppText
        variant="caption"
        color={colors.text}
        weight="600"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.badgeText}
      >
        {label}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    flexShrink: 1,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  badgeText: {
    flexShrink: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    flexShrink: 0,
  },
});
