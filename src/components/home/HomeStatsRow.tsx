import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { AppCard } from '../common/AppCard';
import { AppText } from '../common/AppText';
import { Badge } from '../common/Badge';
import { BirthdayIcon, TasksIcon } from '../../assets/icons';

export interface HomeStatsRowProps {
  birthdayCount: number;
  nearestBirthdayCountdown?: string | null;
  pendingTaskCount: number;
  completedTaskCount: number;
  totalTaskCount: number;
  onPressBirthdays: () => void;
  onPressTasks: () => void;
}

export const HomeStatsRow: React.FC<HomeStatsRowProps> = memo(({
  birthdayCount,
  nearestBirthdayCountdown,
  pendingTaskCount,
  completedTaskCount,
  totalTaskCount,
  onPressBirthdays,
  onPressTasks,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Birthday Metric Card */}
      <AppCard
        variant="elevated"
        style={styles.cardLeft}
        onPress={onPressBirthdays}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, styles.birthdayIconBox]}>
            <BirthdayIcon size={18} color={theme.colors.accent} />
          </View>
          <Badge
            label={nearestBirthdayCountdown || 'Next 30 Days'}
            variant="accent"
            showDot={Boolean(nearestBirthdayCountdown)}
            style={styles.headerBadge}
          />
        </View>

        <AppText variant="displayLarge" weight="700" style={styles.metricNumber}>
          {birthdayCount}
        </AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
          Upcoming Celebrations
        </AppText>
      </AppCard>

      {/* Task Metric Card */}
      <AppCard
        variant="elevated"
        style={styles.cardRight}
        onPress={onPressTasks}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, styles.taskIconBox]}>
            <TasksIcon size={18} color={theme.colors.primaryLight} />
          </View>
          <Badge
            label={totalTaskCount > 0 ? `${completedTaskCount}/${totalTaskCount} Done` : 'All Clean'}
            variant={pendingTaskCount === 0 && totalTaskCount > 0 ? 'success' : 'primary'}
            style={styles.headerBadge}
          />
        </View>

        <AppText variant="displayLarge" weight="700" style={styles.metricNumber}>
          {pendingTaskCount}
        </AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
          Pending Tasks Today
        </AppText>
      </AppCard>
    </View>
  );
});

HomeStatsRow.displayName = 'HomeStatsRow';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    padding: 14,
  },
  cardRight: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'nowrap',
  },
  headerBadge: {
    flexShrink: 1,
    maxWidth: '75%',
    marginLeft: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthdayIconBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  taskIconBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  metricNumber: {
    marginBottom: 2,
  },
});
