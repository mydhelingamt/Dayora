import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, AppCard, AppText } from '../../components';
import { useTheme } from '../../theme';
import { HomeTabScreenProps } from '../../navigation/types';
import { useApp } from '../../state';
import { databaseClient } from '../../database';
import {
  BirthdayRepository,
  UpcomingBirthday,
  BirthdayStats,
} from '../../repositories/birthdayRepository';
import {
  TaskRepository,
  TaskStats,
} from '../../repositories/taskRepository';
import { TaskEntity } from '../../repositories/types';
import {
  HomeHeader,
  QuickActionButton,
  HomeStatsRow,
  SpotlightCard,
  UpcomingBirthdaysSection,
  TodayTasksSection,
} from '../../components/home';
import { BirthdayIcon, TasksIcon } from '../../assets/icons';
import { DateService } from '../../services/dateService';

export const HomeScreen: React.FC<HomeTabScreenProps<'Home'>> = ({ navigation }) => {
  const { theme, isGolden } = useTheme();
  const { state } = useApp();

  const birthdayRepo = useMemo(() => new BirthdayRepository(databaseClient), []);
  const taskRepo = useMemo(() => new TaskRepository(databaseClient), []);

  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [birthdayStats, setBirthdayStats] = useState<BirthdayStats>({
    totalActive: 0,
    next30DaysCount: 0,
    thisMonthCount: 0,
    favoriteCount: 0,
    nearestBirthday: null,
  });

  const [todayTasks, setTodayTasks] = useState<TaskEntity[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0,
    overdueCount: 0,
    upcomingCount: 0,
    completionRatio: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const [birthdays, bStats, tasks, tStats] = await Promise.all([
        birthdayRepo.findUpcoming(10),
        birthdayRepo.getBirthdayStats(),
        taskRepo.findTodayTasks(),
        taskRepo.getTaskStats(),
      ]);

      setUpcomingBirthdays(birthdays);
      setBirthdayStats(bStats);
      setTodayTasks(tasks);
      setTaskStats(tStats);
    } catch {
      // Fallback
    }
  }, [birthdayRepo, taskRepo]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleTask = useCallback(
    async (id: string, isCompleted: boolean) => {
      // Optimistic update
      setTodayTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_completed: isCompleted ? 1 : 0 } : t))
      );
      setTaskStats((prev) => {
        const completed = isCompleted ? prev.completedToday + 1 : Math.max(0, prev.completedToday - 1);
        const pending = Math.max(0, prev.totalToday - completed);
        return {
          ...prev,
          completedToday: completed,
          pendingToday: pending,
          completionRatio: prev.totalToday > 0 ? completed / prev.totalToday : 0,
        };
      });

      try {
        await taskRepo.toggleComplete(id, isCompleted);
      } catch {
        loadData();
      }
    },
    [taskRepo, loadData]
  );

  const nearestBirthdayCountdown = useMemo(() => {
    if (!birthdayStats.nearestBirthday) return null;
    const days = birthdayStats.nearestBirthday.daysUntil;
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }, [birthdayStats.nearestBirthday]);

  const isUserBirthdayToday = useMemo(() => {
    return isGolden || DateService.isDobToday(state.userProfile?.date_of_birth);
  }, [isGolden, state.userProfile?.date_of_birth]);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Header */}
        <HomeHeader
          userName={state.userProfile?.name}
          photoUri={state.userProfile?.photo_uri}
          thumbnailUri={state.userProfile?.photo_thumbnail_uri}
          onAvatarPress={() => navigation.navigate('Profile')}
        />

        {/* Main User Birthday Celebration Banner */}
        {isUserBirthdayToday ? (
          <Pressable
            onPress={() =>
              navigation.navigate('UserBirthdayCelebration', {
                name: state.userProfile?.name,
                photoUri: state.userProfile?.photo_uri || undefined,
              })
            }
            style={styles.userBirthdayBanner}
          >
            <AppCard variant="elevated" style={styles.userBirthdayCard}>
              <View style={styles.userBirthdayRow}>
                <View style={styles.userBirthdayIconBox}>
                  <BirthdayIcon size={24} color="#F59E0B" />
                </View>
                <View style={styles.userBirthdayTextCol}>
                  <AppText variant="titleSmall" weight="800" color="#F59E0B" numberOfLines={1}>
                    🎉 It's Your Birthday Today, {state.userProfile?.name}!
                  </AppText>
                  <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
                    Tap to open your personal celebration! 🎂
                  </AppText>
                </View>
              </View>
            </AppCard>
          </Pressable>
        ) : null}

        {/* Two Primary Gradient Quick Actions */}
        <View style={styles.quickActionsRow}>
          <QuickActionButton
            type="birthday"
            title="+ Add Birthday"
            subtitle="Never miss a celebration"
            icon={<BirthdayIcon size={16} color="#A78BFA" />}
            onPress={() => navigation.navigate('AddEditBirthday', {})}
          />
          <QuickActionButton
            type="task"
            title="+ Add Task"
            subtitle="Plan today's priorities"
            icon={<TasksIcon size={16} color="#FBBF24" />}
            onPress={() => navigation.navigate('AddEditTask', {})}
          />
        </View>

        {/* Hero Spotlight Celebration Card */}
        <SpotlightCard
          birthday={upcomingBirthdays[0] ?? null}
          onPressCard={() => navigation.navigate('Birthdays')}
          onAddBirthday={() => navigation.navigate('AddEditBirthday', {})}
        />

        {/* Summary Statistics Cards */}
        <HomeStatsRow
          birthdayCount={birthdayStats.next30DaysCount}
          nearestBirthdayCountdown={nearestBirthdayCountdown}
          pendingTaskCount={taskStats.pendingToday}
          completedTaskCount={taskStats.completedToday}
          totalTaskCount={taskStats.totalToday}
          onPressBirthdays={() => navigation.navigate('Birthdays')}
          onPressTasks={() => navigation.navigate('Tasks')}
        />

        {/* Upcoming Birthdays Section */}
        <UpcomingBirthdaysSection
          birthdays={upcomingBirthdays}
          onSeeAll={() => navigation.navigate('Birthdays')}
          onAddBirthday={() => navigation.navigate('AddEditBirthday', {})}
          onSelectBirthday={(item) => {
            if (item.daysUntil === 0) {
              navigation.navigate('BirthdayCelebration', {
                birthdayId: item.id,
                name: item.name,
                turningAge: item.turningAge,
                relationship: item.relationship || undefined,
                photoUri: item.photo_uri || undefined,
              });
            } else {
              navigation.navigate('BirthdayDetail', { birthdayId: item.id });
            }
          }}
        />

        {/* Today's Tasks Section */}
        <TodayTasksSection
          tasks={todayTasks}
          onToggleTask={handleToggleTask}
          onSeeAll={() => navigation.navigate('Tasks')}
          onAddTask={() => navigation.navigate('AddEditTask', {})}
          onPressTask={(taskId) => navigation.navigate('TaskDetail', { taskId })}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  userBirthdayBanner: {
    marginBottom: 16,
  },
  userBirthdayCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  userBirthdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userBirthdayIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBirthdayTextCol: {
    flex: 1,
    gap: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
});
