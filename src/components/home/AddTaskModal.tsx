import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useKeyboardBottomPadding } from '../../utilities';
import { useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { AppCard } from '../common/AppCard';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { CalendarPickerModal } from '../common/CalendarPickerModal';
import { ClockPickerModal } from '../common/ClockPickerModal';
import { CloseIcon, CalendarIcon, ClockIcon } from '../../assets/icons';
import { TaskEntity, TaskPriority, TaskCategory, TaskRepeatInterval } from '../../repositories/types';

export interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: TaskEntity) => Promise<void>;
}

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CATEGORY_OPTIONS: Array<{ value: TaskCategory; label: string }> = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [repeatInterval, setRepeatInterval] = useState<TaskRepeatInterval>('none');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [clockModalVisible, setClockModalVisible] = useState(false);

  const bottomPadding = useKeyboardBottomPadding(24);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().slice(0, 10));
    setDueTime('');
    setCategory('personal');
    setPriority('medium');
    setRepeatInterval('none');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage('Please enter a task title (at least 2 characters).');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const entity: TaskEntity = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate.trim() || null,
        due_time: dueTime.trim() || null,
        priority,
        category,
        repeat_interval: repeatInterval,
        reminder_minutes: null,
        location: null,
        photo_uri: null,
        status: 'pending',
        is_completed: 0,
        completed_at: null,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      };

      await onSave(entity);
      handleClose();
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="titleLarge" weight="700">
                New Task
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.subtitle}>
                Stay focused on today's goals
              </AppText>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <CloseIcon size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollBody, { paddingBottom: bottomPadding }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={true}
          >
            <AppCard style={styles.fieldsCard} variant="elevated">
              <AppInput
                label="Task Title *"
                placeholder="e.g., Buy birthday gift for Sarah"
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="sentences"
                containerStyle={styles.inputSpacing}
              />

              <AppInput
                label="Description (optional)"
                placeholder="Notes or details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                containerStyle={styles.inputSpacing}
              />

              <View style={styles.inputWithButtonRow}>
                <View style={styles.inputFlex}>
                  <AppInput
                    label="Due Date (YYYY-MM-DD)"
                    placeholder="YYYY-MM-DD"
                    value={dueDate}
                    onChangeText={setDueDate}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                </View>
                <Pressable
                  onPress={() => setCalendarModalVisible(true)}
                  style={[
                    styles.pickerIconBtn,
                    { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366F1' },
                  ]}
                  hitSlop={6}
                  accessibilityLabel="Pick due date"
                >
                  <CalendarIcon size={20} color="#6366F1" />
                </Pressable>
              </View>

              <View style={styles.inputWithButtonRow}>
                <View style={styles.inputFlex}>
                  <AppInput
                    label="Due Time (Optional, e.g. 14:30)"
                    placeholder="HH:mm"
                    value={dueTime}
                    onChangeText={setDueTime}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
                <Pressable
                  onPress={() => setClockModalVisible(true)}
                  style={[
                    styles.pickerIconBtn,
                    { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' },
                  ]}
                  hitSlop={6}
                  accessibilityLabel="Pick due time"
                >
                  <ClockIcon size={20} color="#F59E0B" />
                </Pressable>
              </View>

              <AppText variant="labelMedium" weight="600" color={theme.colors.textSecondary} style={styles.priorityLabel}>
                Category
              </AppText>

              <View style={styles.priorityChips}>
                {CATEGORY_OPTIONS.map((opt) => {
                  const isSelected = category === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setCategory(opt.value)}
                      style={[
                        styles.priorityChip,
                        isSelected ? styles.chipActive : styles.chipInactive,
                      ]}
                    >
                      <AppText
                        variant="labelSmall"
                        color={isSelected ? theme.colors.primaryLight : theme.colors.textSecondary}
                        weight={isSelected ? '700' : '500'}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <AppText variant="labelMedium" weight="600" color={theme.colors.textSecondary} style={styles.priorityLabel}>
                Priority Level
              </AppText>

              <View style={styles.priorityChips}>
                {PRIORITY_OPTIONS.map((opt) => {
                  const isSelected = priority === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setPriority(opt.value)}
                      style={[
                        styles.priorityChip,
                        isSelected ? styles.chipActive : styles.chipInactive,
                      ]}
                    >
                      <AppText
                        variant="labelMedium"
                        color={isSelected ? theme.colors.primaryLight : theme.colors.textSecondary}
                        weight={isSelected ? '700' : '500'}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {errorMessage ? (
                <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorBackground }]}>
                  <AppText variant="bodySmall" color={theme.colors.error} weight="600">
                    {errorMessage}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <AppButton
                  title="Cancel"
                  variant="ghost"
                  onPress={handleClose}
                  style={styles.flexBtn}
                />
                <AppButton
                  title="Create Task"
                  variant="primary"
                  onPress={handleSave}
                  loading={isSubmitting}
                  style={styles.flexBtn}
                />
              </View>
            </AppCard>
          </ScrollView>
        </View>
      </View>

      <CalendarPickerModal
        visible={calendarModalVisible}
        initialDate={dueDate}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(dateStr) => setDueDate(dateStr)}
      />

      <ClockPickerModal
        visible={clockModalVisible}
        initialTime={dueTime}
        onClose={() => setClockModalVisible(false)}
        onSelectTime={(timeStr) => setDueTime(timeStr)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  inputWithButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputFlex: {
    flex: 1,
  },
  pickerIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingBottom: 16,
  },
  fieldsCard: {
    padding: 16,
  },
  inputSpacing: {
    marginBottom: 14,
  },
  priorityLabel: {
    marginBottom: 8,
    marginTop: 2,
  },
  priorityChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: '#818CF8',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  chipInactive: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  errorContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexBtn: {
    flex: 1,
  },
});
