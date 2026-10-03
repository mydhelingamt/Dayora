import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  badge?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  badge,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.md }, style]}>
      <View style={styles.titleRow}>
        <View style={styles.headingBlock}>
          <View style={styles.titleWithBadge}>
            <AppText variant="titleMedium" weight="700" numberOfLines={1} ellipsizeMode="tail" style={styles.headerTitle}>
              {title}
            </AppText>
            {badge ? <View style={styles.badgeWrapper}>{badge}</View> : null}
          </View>
          {subtitle ? (
            <AppText
              variant="bodySmall"
              color={theme.colors.textSecondary}
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {actionText && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionText}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionPressable}
          >
            <AppText variant="labelMedium" color={theme.colors.primaryLight} weight="600" numberOfLines={1}>
              {actionText}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headingBlock: {
    flex: 1,
    marginRight: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  headerTitle: {
    flexShrink: 1,
  },
  badgeWrapper: {
    marginLeft: 8,
    flexShrink: 0,
  },
  subtitle: {
    marginTop: 2,
  },
  actionPressable: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexShrink: 0,
    marginLeft: 8,
  },
});
