import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ScreenContainer,
  Header,
  AppCard,
  AppText,
  AppButton,
  Badge,
} from '../../components';
import { useTheme } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { TaskEntity } from '../../repositories/types';
import { TaskRepository } from '../../repositories';
import { databaseClient } from '../../database';
import { TaskService } from '../../services/taskService';
import {
  ChevronLeftIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  RepeatIcon,
  PinIcon,
} from '../../assets/icons';

export const TaskDetailScreen: React.FC<RootStackScreenProps<'TaskDetail'>> = ({
  route,
  navigation,
}) => {
  const { theme } = useTheme();
  const repo = useMemo(() => new TaskRepository(databaseClient), []);
  const { taskId } = route.params;

  const [task, setTask] = useState<TaskEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | null>(null);

  const loadTask = useCallback(async () => {
    try {
      const entity = await repo.findById(taskId);
      setTask(entity);
      setPhotoError(false);
    } catch {
      Alert.alert('Error', 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }, [repo, taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handlePromptComplete = () => {
    if (!task) return;
    setConfirmAction('complete');
  };

  const executeComplete = async () => {
    if (!task) return;
    setConfirmAction(null);
    setActionLoading(true);
    try {
      const { nextRecurringTask } = await repo.completeTask(task.id);
      if (nextRecurringTask) {
        Alert.alert(
          'Task Completed',
          `Task completed! Next occurrence scheduled for ${nextRecurringTask.due_date}.`
        );
      }
      await loadTask();
    } catch {
      Alert.alert('Error', 'Failed to complete task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromptCancel = () => {
    if (!task) return;
    setConfirmAction('cancel');
  };

  const executeCancel = async () => {
    if (!task) return;
    setConfirmAction(null);
    setActionLoading(true);
    try {
      await repo.cancelTask(task.id);
      await loadTask();
    } catch {
      Alert.alert('Error', 'Failed to cancel task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await repo.reopenTask(task.id);
      await loadTask();
    } catch {
      Alert.alert('Error', 'Failed to reopen task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert(
      'Delete Task',
      'Are you sure you want to permanently delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await repo.delete(task.id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete task.');
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!task) return;
    navigation.navigate('AddEditTask', { taskId: task.id });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={styles.loadingText}>
            Loading task details...
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  if (!task) {
    return (
      <ScreenContainer>
        <Header
          title="Task Details"
          leftAction={
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Back"
            >
              <ChevronLeftIcon size={20} color={theme.colors.text} />
            </Pressable>
          }
        />
        <View style={styles.centerBox}>
          <AppText variant="titleMedium" color={theme.colors.textSecondary}>
            Task not found.
          </AppText>
          <AppButton
            title="Go Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.goBackBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  const categoryConf = TaskService.getCategoryConfig(task.category);
  const priorityConf = TaskService.getPriorityConfig(task.priority);
  const dueInfo = TaskService.formatDueDisplay(task.due_date, task.due_time);
  const isCompleted = task.status === 'completed' || Number(task.is_completed) === 1;
  const isCancelled = task.status === 'cancelled';
  const isOverdue = dueInfo.isOverdue && !isCompleted && !isCancelled;

  return (
    <ScreenContainer>
      <Header
        title="Task Details"
        subtitle={categoryConf.label}
        leftAction={
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Back"
          >
            <ChevronLeftIcon size={20} color={theme.colors.text} />
          </Pressable>
        }
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleEdit}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: 'rgba(99, 102, 241, 0.16)',
                  borderColor: '#818CF8',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Edit Task"
            >
              <EditIcon size={18} color="#818CF8" />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.16)',
                  borderColor: '#EF4444',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Delete Task"
            >
              <TrashIcon size={18} color="#EF4444" />
            </Pressable>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Badges Bar */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryConf.bgColor, borderColor: categoryConf.color },
            ]}
          >
            <AppText variant="labelSmall" weight="700" color={categoryConf.color}>
              {categoryConf.label.toUpperCase()}
            </AppText>
          </View>

          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityConf.bgColor, borderColor: priorityConf.color },
            ]}
          >
            <AppText variant="labelSmall" weight="700" color={priorityConf.color}>
              {priorityConf.label.toUpperCase()} PRIORITY
            </AppText>
          </View>

          {isCompleted ? (
            <Badge label="COMPLETED" variant="success" />
          ) : isCancelled ? (
            <Badge label="CANCELLED" variant="neutral" />
          ) : isOverdue ? (
            <Badge label="OVERDUE" variant="error" />
          ) : null}
        </View>

        {/* Task Title Card */}
        <AppCard variant="elevated" style={styles.card}>
          <AppText
            variant="headlineSmall"
            weight="700"
            color={isCompleted ? theme.colors.textMuted : theme.colors.text}
            style={[styles.taskTitle, isCompleted && styles.strikethrough]}
          >
            {task.title}
          </AppText>

          {task.description ? (
            <AppText
              variant="bodyMedium"
              color={theme.colors.textSecondary}
              style={styles.descriptionText}
            >
              {task.description}
            </AppText>
          ) : null}
        </AppCard>

        {/* Attached Photo Card (if present) */}
        {task.photo_uri ? (
          <AppCard variant="elevated" style={styles.card}>
            <AppText variant="labelMedium" color={theme.colors.textSecondary} style={styles.cardHeader}>
              ATTACHMENT
            </AppText>
            <View style={styles.photoContainer}>
              {!photoError ? (
                <Image
                  source={{ uri: task.photo_uri }}
                  style={styles.photoImage}
                  resizeMode="cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <View style={styles.photoErrorBox}>
                  <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                    Image could not be loaded
                  </AppText>
                </View>
              )}
            </View>
          </AppCard>
        ) : null}

        {/* Schedule & Timing Card */}
        <AppCard variant="elevated" style={styles.card}>
          <AppText variant="labelMedium" color={theme.colors.textSecondary} style={styles.cardHeader}>
            SCHEDULE & TIMING
          </AppText>

          {/* Due date row */}
          <View style={styles.infoRow}>
            <ClockIcon
              size={20}
              color={isOverdue ? theme.colors.error : dueInfo.isToday ? theme.colors.warning : theme.colors.primary}
            />
            <View style={styles.infoTextCol}>
              <AppText
                variant="titleSmall"
                weight="700"
                color={isOverdue ? theme.colors.error : theme.colors.text}
              >
                {dueInfo.label}
              </AppText>
              {task.due_date ? (
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  Due Date: {task.due_date}
                  {task.due_time ? ` at ${task.due_time}` : ''}
                </AppText>
              ) : null}
            </View>
          </View>

          {/* Repeat row */}
          {task.repeat_interval && task.repeat_interval !== 'none' ? (
            <View style={[styles.infoRow, styles.topDivider, { borderTopColor: theme.colors.border }]}>
              <RepeatIcon size={20} color={theme.colors.primary} />
              <View style={styles.infoTextCol}>
                <AppText variant="titleSmall" weight="700" color={theme.colors.text}>
                  Repeats {task.repeat_interval}
                </AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  Advances to the next schedule when marked completed.
                </AppText>
              </View>
            </View>
          ) : null}

          {/* Reminder row */}
          {task.reminder_minutes !== null && task.reminder_minutes !== undefined ? (
            <View style={[styles.infoRow, styles.topDivider, { borderTopColor: theme.colors.border }]}>
              <ClockIcon size={20} color={theme.colors.warning} />
              <View style={styles.infoTextCol}>
                <AppText variant="titleSmall" weight="700" color={theme.colors.text}>
                  Reminder set
                </AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {TaskService.formatReminderLabel(task.reminder_minutes)}
                </AppText>
              </View>
            </View>
          ) : null}
        </AppCard>

        {/* Location Card (if set) */}
        {task.location ? (
          <AppCard variant="elevated" style={styles.card}>
            <AppText variant="labelMedium" color={theme.colors.textSecondary} style={styles.cardHeader}>
              LOCATION
            </AppText>
            <View style={styles.infoRow}>
              <PinIcon size={20} color={theme.colors.secondary} />
              <View style={styles.infoTextCol}>
                <AppText variant="titleSmall" weight="700" color={theme.colors.text}>
                  {task.location}
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}

        {/* Lifecycle Actions */}
        <View style={styles.actionsBox}>
          {!isCompleted && !isCancelled ? (
            <>
              <AppButton
                title={actionLoading ? 'Completing...' : 'Mark as Completed'}
                variant="primary"
                leftIcon={<CheckIcon size={18} color="#FFFFFF" />}
                onPress={handlePromptComplete}
                disabled={actionLoading}
                style={styles.lifecycleBtn}
              />
              <AppButton
                title="Cancel Task"
                variant="outline"
                leftIcon={<CloseIcon size={16} color={theme.colors.textSecondary} />}
                onPress={handlePromptCancel}
                disabled={actionLoading}
                style={styles.lifecycleBtn}
              />
            </>
          ) : (
            <AppButton
              title="Reopen Task"
              variant="outline"
              leftIcon={<CheckIcon size={18} color={theme.colors.primary} />}
              onPress={handleReopen}
              disabled={actionLoading}
              style={styles.lifecycleBtn}
            />
          )}
        </View>
      </ScrollView>

      {/* Confirmation Popup Modal */}
      <Modal
        visible={confirmAction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmAction(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setConfirmAction(null)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.card,
                borderColor:
                  confirmAction === 'complete'
                    ? 'rgba(16, 185, 129, 0.5)'
                    : 'rgba(239, 68, 68, 0.5)',
              },
            ]}
          >
            <View
              style={[
                styles.modalIconBox,
                {
                  backgroundColor:
                    confirmAction === 'complete'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  borderColor:
                    confirmAction === 'complete'
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'rgba(239, 68, 68, 0.4)',
                },
              ]}
            >
              {confirmAction === 'complete' ? (
                <CheckIcon size={24} color="#10B981" />
              ) : (
                <CloseIcon size={20} color="#EF4444" />
              )}
            </View>

            <AppText variant="headlineSmall" weight="700" style={styles.modalTitle}>
              {confirmAction === 'complete' ? 'Complete Task?' : 'Cancel Task?'}
            </AppText>

            <AppText
              variant="bodyMedium"
              color={theme.colors.textSecondary}
              style={styles.modalMessage}
            >
              {confirmAction === 'complete'
                ? `Are you sure you want to mark "${task.title}" as completed?${
                    task.repeat_interval && task.repeat_interval !== 'none'
                      ? '\n\nA new recurring occurrence will be automatically scheduled.'
                      : ''
                  }`
                : `Are you sure you want to mark "${task.title}" as cancelled? You can reopen it at any time.`}
            </AppText>

            <View style={styles.modalButtonCol}>
              <AppButton
                title={
                  actionLoading
                    ? confirmAction === 'complete'
                      ? 'Completing...'
                      : 'Cancelling...'
                    : confirmAction === 'complete'
                    ? 'Yes, Mark Completed'
                    : 'Yes, Cancel Task'
                }
                variant={confirmAction === 'complete' ? 'primary' : 'outline'}
                onPress={confirmAction === 'complete' ? executeComplete : executeCancel}
                disabled={actionLoading}
                style={[
                  styles.modalMainBtn,
                  confirmAction === 'cancel' && {
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.16)',
                  },
                ]}
              />
              <AppButton
                title="Go Back"
                variant="ghost"
                onPress={() => setConfirmAction(null)}
                disabled={actionLoading}
                style={styles.modalCancelBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    gap: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  goBackBtn: {
    marginTop: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  taskTitle: {
    marginBottom: 8,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  descriptionText: {
    lineHeight: 22,
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoErrorBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  infoTextCol: {
    flex: 1,
    gap: 2,
  },
  topDivider: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  actionsBox: {
    gap: 12,
    marginTop: 8,
  },
  lifecycleBtn: {
    width: '100%',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonCol: {
    width: '100%',
    gap: 10,
  },
  modalMainBtn: {
    width: '100%',
  },
  modalCancelBtn: {
    width: '100%',
  },
});
