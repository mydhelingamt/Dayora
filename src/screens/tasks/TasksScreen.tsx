import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScreenContainer,
  Header,
  AppCard,
  AppText,
  AppButton,
  AppInput,
  AppAvatar,
} from '../../components';
import { useTheme } from '../../theme';
import { HomeTabScreenProps } from '../../navigation/types';
import {
  TaskEntity,
  TaskCategory,
} from '../../repositories/types';
import {
  TaskFilter,
  TaskStats,
  TaskRepository,
} from '../../repositories';
import { databaseClient } from '../../database';
import { TaskService } from '../../services/taskService';
import {
  SearchIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  RepeatIcon,
  ClockIcon,
  PinIcon,
  AlertCircleIcon,
  PlusIcon,
} from '../../assets/icons';

const CATEGORY_OPTIONS: Array<{ key: TaskCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'work', label: 'Work' },
  { key: 'personal', label: 'Personal' },
  { key: 'celebration', label: 'Celebration' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'health', label: 'Health' },
  { key: 'other', label: 'Other' },
];

export const TasksScreen: React.FC<HomeTabScreenProps<'Tasks'>> = ({ navigation }) => {
  const { theme } = useTheme();
  const repo = useMemo(() => new TaskRepository(databaseClient), []);

  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0,
    overdueCount: 0,
    upcomingCount: 0,
    completionRatio: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [allTasks, taskStats] = await Promise.all([
        repo.findAllWithOptions({
          filter: selectedFilter,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          searchQuery: searchQuery.trim() || undefined,
        }),
        repo.getTaskStats(),
      ]);

      setTasks(allTasks);
      setStats(taskStats);
    } catch {
      // safe fallback
    } finally {
      setIsRefreshing(false);
    }
  }, [repo, selectedFilter, selectedCategory, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        setSelectedTaskIds(new Set());
      };
    }, [loadData])
  );

  const handleToggleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const handleBatchComplete = useCallback(() => {
    if (selectedTaskIds.size === 0) return;
    const count = selectedTaskIds.size;
    Alert.alert(
      'Complete Selected Tasks',
      `Are you sure you want to mark ${count} selected task${count > 1 ? 's' : ''} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            for (const id of selectedTaskIds) {
              try {
                await repo.completeTask(id);
              } catch {
                // proceed
              }
            }
            setSelectedTaskIds(new Set());
            await loadData();
          },
        },
      ]
    );
  }, [selectedTaskIds, repo, loadData]);

  const handleBatchDelete = useCallback(() => {
    if (selectedTaskIds.size === 0) return;
    const count = selectedTaskIds.size;
    Alert.alert(
      'Delete Selected Tasks',
      `Are you sure you want to delete ${count} selected task${count > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedTaskIds) {
              try {
                await repo.delete(id);
              } catch {
                // proceed
              }
            }
            setSelectedTaskIds(new Set());
            await loadData();
          },
        },
      ]
    );
  }, [selectedTaskIds, repo, loadData]);

  const filterTabs: Array<{ key: TaskFilter; label: string; count?: number; isAlert?: boolean }> = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today', count: stats.pendingToday },
    { key: 'upcoming', label: 'Upcoming', count: stats.upcomingCount },
    {
      key: 'overdue',
      label: 'Overdue',
      count: stats.overdueCount,
      isAlert: stats.overdueCount > 0,
    },
    { key: 'completed', label: 'Completed' },
  ];

  const renderEmptyState = useCallback(() => {
    if (isRefreshing) return null;

    let title = 'No tasks found';
    let subtitle = 'Get organized by adding a new focused priority.';

    if (searchQuery.trim()) {
      title = 'No matches found';
      subtitle = `No tasks matching "${searchQuery}".`;
    } else if (selectedFilter === 'today') {
      title = 'All caught up for today!';
      subtitle = 'You have no pending tasks scheduled for today.';
    } else if (selectedFilter === 'overdue') {
      title = 'No overdue tasks!';
      subtitle = 'Awesome! You are completely on track with your goals.';
    } else if (selectedFilter === 'upcoming') {
      title = 'No upcoming tasks';
      subtitle = 'Plan ahead by scheduling tasks for the future.';
    } else if (selectedFilter === 'completed') {
      title = 'No completed tasks yet';
      subtitle = 'Finish tasks to see your accomplished milestones here.';
    }

    return (
      <AppCard variant="subtle" style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <CheckIcon size={24} color={theme.colors.primary} />
        </View>
        <AppText variant="titleMedium" weight="700" style={styles.emptyTitle}>
          {title}
        </AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.emptySubtitle}>
          {subtitle}
        </AppText>
        <AppButton
          title="Add Task"
          leftIcon={<PlusIcon size={14} color={theme.colors.primary} />}
          variant="outline"
          size="sm"
          onPress={() => navigation.navigate('AddEditTask', {})}
          style={styles.emptyBtn}
        />
      </AppCard>
    );
  }, [isRefreshing, searchQuery, selectedFilter, theme, navigation]);

  const renderItem = useCallback(
    ({ item }: { item: TaskEntity }) => {
      const isDone = item.status === 'completed' || Number(item.is_completed) === 1;
      const isCancelled = item.status === 'cancelled';
      const isSelected = selectedTaskIds.has(item.id);
      const dueInfo = TaskService.formatDueDisplay(item.due_date, item.due_time);
      const isOverdue = dueInfo.isOverdue && !isDone && !isCancelled;
      const catConf = TaskService.getCategoryConfig(item.category);
      const priorityConf = TaskService.getPriorityConfig(item.priority);

      return (
        <AppCard
          variant="elevated"
          style={[
            styles.itemCard,
            isDone && styles.itemCardDone,
            isOverdue && styles.itemCardOverdue,
            isSelected && {
              borderColor: theme.colors.primary,
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
            },
          ]}
          onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
        >
          <View style={styles.itemRow}>
            {/* Checkbox - Select task (not complete) */}
            <Pressable
              onPress={() => handleToggleSelectTask(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="checkbox"
              accessibilityLabel={`Select ${item.title}`}
              style={[
                styles.checkbox,
                isSelected ? styles.checkboxSelected : styles.checkboxPending,
                {
                  borderColor: isSelected
                    ? theme.colors.primary
                    : isOverdue
                    ? theme.colors.error
                    : theme.colors.border,
                  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {isSelected ? <CheckIcon size={12} color="#FFFFFF" /> : null}
            </Pressable>

            {/* Main Info */}
            <View style={styles.itemContent}>
              {/* Top Badges */}
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.miniBadge,
                    { backgroundColor: catConf.bgColor, borderColor: catConf.color },
                  ]}
                >
                  <AppText variant="labelSmall" weight="700" color={catConf.color} numberOfLines={1}>
                    {catConf.label}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.miniBadge,
                    { backgroundColor: priorityConf.bgColor, borderColor: priorityConf.color },
                  ]}
                >
                  <AppText variant="labelSmall" weight="700" color={priorityConf.color} numberOfLines={1}>
                    {priorityConf.label}
                  </AppText>
                </View>

                {isOverdue ? (
                  <View style={[styles.miniBadge, styles.overdueBadge]}>
                    <AppText variant="labelSmall" weight="700" color="#EF4444" numberOfLines={1}>
                      OVERDUE
                    </AppText>
                  </View>
                ) : null}
              </View>

              {/* Title */}
              <AppText
                variant="titleSmall"
                weight="600"
                color={isDone ? theme.colors.textMuted : theme.colors.text}
                style={[styles.itemTitle, isDone && styles.strikethrough]}
                numberOfLines={2}
              >
                {item.title}
              </AppText>

              {/* Description Snippet */}
              {item.description ? (
                <AppText
                  variant="bodySmall"
                  color={theme.colors.textSecondary}
                  numberOfLines={1}
                  style={styles.snippetText}
                >
                  {item.description}
                </AppText>
              ) : null}

              {/* Footer Row: Timing, Repeat, Location */}
              <View style={styles.footerRow}>
                <View style={styles.footerItem}>
                  <ClockIcon
                    size={13}
                    color={isOverdue ? '#EF4444' : dueInfo.isToday ? theme.colors.warning : theme.colors.textSecondary}
                  />
                  <AppText
                    variant="labelSmall"
                    weight={isOverdue || dueInfo.isToday ? '600' : '400'}
                    color={isOverdue ? '#EF4444' : dueInfo.isToday ? theme.colors.warning : theme.colors.textSecondary}
                    numberOfLines={1}
                  >
                    {dueInfo.label}
                  </AppText>
                </View>

                {item.repeat_interval && item.repeat_interval !== 'none' ? (
                  <View style={styles.footerItem}>
                    <RepeatIcon size={12} color={theme.colors.textSecondary} />
                    <AppText variant="labelSmall" color={theme.colors.textSecondary} numberOfLines={1}>
                      {item.repeat_interval}
                    </AppText>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.footerItem}>
                    <PinIcon size={12} color={theme.colors.textSecondary} />
                    <AppText variant="labelSmall" color={theme.colors.textSecondary} numberOfLines={1}>
                      {item.location}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Optional Thumbnail Photo */}
            {item.photo_uri || item.photo_thumbnail_uri ? (
              <AppAvatar
                photoUri={item.photo_uri}
                thumbnailUri={item.photo_thumbnail_uri}
                preferThumbnail={true}
                size="sm"
              />
            ) : null}
          </View>
        </AppCard>
      );
    },
    [selectedTaskIds, handleToggleSelectTask, navigation, theme]
  );

  return (
    <ScreenContainer>
      <Header
        title="Tasks"
        subtitle={`${stats.pendingToday} pending today • ${stats.completedToday} completed`}
        rightAction={
          <AppButton
            title="New"
            size="sm"
            leftIcon={<PlusIcon size={14} color="#FFFFFF" />}
            onPress={() => navigation.navigate('AddEditTask', {})}
          />
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Search tasks, descriptions, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          prefixIcon={<SearchIcon size={18} color={theme.colors.textSecondary} />}
        />
      </View>

      {/* Status Filter Horizontal Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedFilter(tab.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : tab.isAlert
                      ? 'rgba(239, 68, 68, 0.15)'
                      : theme.colors.surfaceSubtle,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : tab.isAlert
                      ? 'rgba(239, 68, 68, 0.4)'
                      : theme.colors.border,
                  },
                ]}
              >
                <AppText
                  variant="labelSmall"
                  weight={isSelected ? '700' : '600'}
                  color={isSelected ? '#FFFFFF' : tab.isAlert ? '#EF4444' : theme.colors.textSecondary}
                  numberOfLines={1}
                  style={styles.filterText}
                >
                  {tab.label}
                </AppText>
                {tab.count !== undefined && tab.count > 0 ? (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.25)'
                          : tab.isAlert
                          ? '#EF4444'
                          : theme.colors.card,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight="700"
                      color={isSelected ? '#FFFFFF' : tab.isAlert ? '#FFFFFF' : theme.colors.textSecondary}
                      numberOfLines={1}
                    >
                      {tab.count}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Horizontal Filter Chips */}
      <View style={styles.categoryChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <AppText
                  variant="labelSmall"
                  weight={isSelected ? '700' : '600'}
                  color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
                  numberOfLines={1}
                  style={styles.filterText}
                >
                  {cat.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Overdue Warning Alert Banner (if overdue tasks exist and not on overdue view) */}
      {stats.overdueCount > 0 && selectedFilter !== 'overdue' && selectedFilter !== 'completed' ? (
        <Pressable
          onPress={() => setSelectedFilter('overdue')}
          style={styles.overdueBannerPressable}
        >
          <AppCard variant="subtle" style={styles.overdueBannerCard}>
            <AlertCircleIcon size={18} color="#EF4444" />
            <View style={styles.overdueBannerTextCol}>
              <AppText variant="labelMedium" weight="700" color="#EF4444">
                {stats.overdueCount} Overdue {stats.overdueCount === 1 ? 'Task' : 'Tasks'}
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                Tap to review and complete overdue items.
              </AppText>
            </View>
          </AppCard>
        </Pressable>
      ) : null}

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* Floating Batch Action Bar when tasks are selected */}
      {selectedTaskIds.size > 0 ? (
        <View style={styles.batchBarContainer}>
          <View
            style={[
              styles.batchBar,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <View style={styles.batchInfo}>
              <View style={[styles.batchBadge, { backgroundColor: theme.colors.primary }]}>
                <AppText variant="labelSmall" weight="700" color="#FFFFFF">
                  {selectedTaskIds.size}
                </AppText>
              </View>
              <AppText variant="bodyMedium" weight="600" color={theme.colors.text}>
                Selected
              </AppText>
            </View>

            <View style={styles.batchActions}>
              <Pressable
                onPress={handleBatchComplete}
                style={[styles.batchBtn, { backgroundColor: 'rgba(16, 185, 129, 0.16)', borderColor: '#10B981' }]}
                hitSlop={6}
              >
                <CheckIcon size={14} color="#10B981" />
                <AppText variant="labelSmall" weight="700" color="#10B981" style={styles.batchBtnText}>
                  Complete
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleBatchDelete}
                style={[styles.batchBtn, { backgroundColor: 'rgba(239, 68, 68, 0.16)', borderColor: '#EF4444' }]}
                hitSlop={6}
              >
                <TrashIcon size={14} color="#EF4444" />
                <AppText variant="labelSmall" weight="700" color="#EF4444" style={styles.batchBtnText}>
                  Delete
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleClearSelection}
                style={styles.batchCloseBtn}
                hitSlop={8}
                accessibilityLabel="Deselect All"
              >
                <CloseIcon size={16} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: 10,
  },
  filterTabsContainer: {
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    flexShrink: 0,
  },
  filterText: {
    flexShrink: 0,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeAlert: {
    backgroundColor: '#EF4444',
  },
  countBadgeSelected: {
    backgroundColor: '#6366F1',
  },
  countBadgeNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryChipsContainer: {
    marginBottom: 12,
  },
  catScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  overdueBannerPressable: {
    marginBottom: 12,
  },
  overdueBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
  },
  overdueBannerTextCol: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
    borderRadius: 16,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyBtn: {
    minWidth: 120,
  },
  itemCard: {
    padding: 14,
    borderRadius: 16,
  },
  itemCardDone: {
    opacity: 0.65,
  },
  itemCardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  checkboxPending: {
    backgroundColor: 'transparent',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    gap: 6,
    marginBottom: 2,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  overdueBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  itemTitle: {
    lineHeight: 20,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  snippetText: {
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  thumbnailPhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
  },
  batchBarContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  batchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  batchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  batchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  batchBtnText: {
    fontSize: 12,
  },
  batchCloseBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
