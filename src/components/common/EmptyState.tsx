import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { padding: theme.spacing.xxxl }, style]}>
      {icon ? <View style={[styles.iconWrapper, { marginBottom: theme.spacing.lg }]}>{icon}</View> : null}
      <AppText
        variant="titleLarge"
        weight="600"
        align="center"
        style={{ marginBottom: theme.spacing.xs }}
      >
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="bodyMedium"
          color={theme.colors.textSecondary}
          align="center"
          style={{ marginBottom: theme.spacing.xl }}
        >
          {description}
        </AppText>
      ) : null}
      {actionTitle && onAction ? (
        <AppButton title={actionTitle} onPress={onAction} size="md" />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
