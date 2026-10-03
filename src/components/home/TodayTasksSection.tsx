import React, { memo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { SectionHeader } from '../common/SectionHeader';
import { AppCard } from '../common/AppCard';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { Badge, BadgeVariant } from '../common/Badge';
import { TaskEntity, TaskPriority } from '../../repositories/types';
import { CheckIcon, PlusIcon } from '../../assets/icons';

export interface TodayTasksSectionProps {
  tasks: TaskEntity[];
  onToggleTask: (id: string, isCompleted: boolean) => void;
  onSeeAll: () => void;
  onAddTask: () => void;
  onPressTask?: (id: string) => void;
}

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = memo(({
  tasks,
  onToggleTask,
  onSeeAll,
  onAddTask,
  onPressTask,
}) => {
  const { theme } = useTheme();

  const getPriorityVariant = (priority: TaskPriority): BadgeVariant => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'primary';
      case 'low':
      default:
        return 'neutral';
    }
  };

  const pendingCount = tasks.filter((t) => Number(t.is_completed) === 0).length;

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Today's Priorities"
        badge={tasks.length > 0 ? <Badge label={`${pendingCount} Pending`} variant="primary" /> : undefined}
        actionText="See All"
        onAction={onSeeAll}
      />

      {tasks.length === 0 ? (
        <AppCard variant="subtle" style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <CheckIcon size={22} color={theme.colors.success} />
          </View>
          <AppText variant="titleSmall" weight="700" style={styles.emptyTitle}>
            All Caught Up for Today!
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.emptySubtitle}>
            No tasks due today. Relax and enjoy your day, or get ahead on upcoming goals.
          </AppText>
          <AppButton
            title="New Task"
            leftIcon={<PlusIcon size={14} color={theme.colors.success} />}
            variant="outline"
            size="sm"
            onPress={onAddTask}
            style={styles.emptyBtn}
          />
        </AppCard>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {tasks.map((task) => {
            const isDone = Number(task.is_completed) === 1;

            return (
              <AppCard
                key={task.id}
                variant="elevated"
                style={[
                  styles.horizontalTaskCard,
                  isDone && styles.itemCardDone,
                ]}
                onPress={() => (onPressTask ? onPressTask(task.id) : onToggleTask(task.id, !isDone))}
              >
                <View style={styles.cardHeader}>
                  <Pressable
                    onPress={() => onToggleTask(task.id, !isDone)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="checkbox"
                    accessibilityLabel="Toggle Task"
                    style={[
                      styles.checkbox,
                      isDone ? styles.checkboxDone : styles.checkboxPending,
                      { borderColor: isDone ? theme.colors.success : theme.colors.border },
                    ]}
                  >
                    {isDone ? <CheckIcon size={12} color={theme.colors.success} /> : null}
                  </Pressable>
                  <Badge
                    label={task.priority.toUpperCase()}
                    variant={getPriorityVariant(task.priority)}
                  />
                </View>

                <View style={styles.cardBody}>
                  <AppText
                    variant="bodyMedium"
                    weight="600"
                    numberOfLines={2}
                    style={[styles.taskTitle, isDone && styles.strikethrough]}
                  >
                    {task.title}
                  </AppText>

                  {task.description ? (
                    <AppText
                      variant="caption"
                      color={theme.colors.textSecondary}
                      numberOfLines={1}
                      style={styles.descriptionText}
                    >
                      {task.description}
                    </AppText>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <AppText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
                      {task.due_date ? task.due_date.slice(11, 16) || 'Today' : 'Today'}
                    </AppText>
                    {task.category ? (
                      <Badge label={task.category} variant="neutral" />
                    ) : null}
                  </View>
                </View>
              </AppCard>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

TodayTasksSection.displayName = 'TodayTasksSection';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  horizontalList: {
    gap: 10,
    paddingRight: 8,
    paddingBottom: 4,
  },
  horizontalTaskCard: {
    width: 145,
    minHeight: 110,
    padding: 12,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemCard: {
    padding: 12,
    marginBottom: 8,
  },
  itemCardDone: {
    opacity: 0.65,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 6,
  },
  checkboxPending: {
    backgroundColor: 'transparent',
  },
  checkboxDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  itemDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  descriptionText: {
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  emptyBtn: {
    minHeight: 38,
    paddingHorizontal: 18,
  },
});
