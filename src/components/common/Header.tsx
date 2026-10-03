import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    >
      {leftAction ? <View style={styles.leftAction}>{leftAction}</View> : null}
      <View style={styles.titleContainer}>
        <AppText variant="headlineLarge" weight="700" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="bodyMedium"
            color={theme.colors.textSecondary}
            numberOfLines={1}
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  leftAction: {
    marginRight: 12,
    flexShrink: 0,
  },
  rightAction: {
    marginLeft: 8,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 4,
  },
});
