import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useKeyboardBottomPadding } from '../../utilities';
import {
  ScreenContainer,
  AppText,
  AppButton,
  AppInput,
  CalendarPickerModal,
  ClockPickerModal,
} from '../../components';
import { useTheme } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import {
  TaskEntity,
  TaskPriority,
  TaskCategory,
  TaskRepeatInterval,
} from '../../repositories/types';
import { TaskRepository } from '../../repositories';
import { databaseClient } from '../../database';
import { TaskService } from '../../services/taskService';
import { MediaService } from '../../services/mediaService';
import {
  ChevronLeftIcon,
  CloseIcon,
  PinIcon,
  RepeatIcon,
  ClockIcon,
  CalendarIcon,
  CameraIcon,
  SaveDiskIcon,
  DocumentCheckIcon,
  TextLinesIcon,
  CategoryShapesIcon,
  BellIcon,
  ChevronDownIcon,
  CheckIcon,
} from '../../assets/icons';

const CATEGORIES: Array<{ key: TaskCategory; label: string }> = [
  { key: 'personal', label: 'Personal' },
  { key: 'work', label: 'Work' },
  { key: 'celebration', label: 'Celebration' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'health', label: 'Health' },
  { key: 'other', label: 'Other' },
];

const PRIORITIES: Array<{ key: TaskPriority; label: string }> = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

const REPEAT_OPTIONS: Array<{ key: TaskRepeatInterval; label: string }> = [
  { key: 'none', label: 'Does not repeat' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const REMINDER_OPTIONS: Array<{ minutes: number | null; label: string }> = [
  { minutes: null, label: 'None' },
  { minutes: 0, label: 'At time of event' },
  { minutes: 15, label: '15 mins before' },
  { minutes: 30, label: '30 mins before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 1440, label: '1 day before' },
];

type TaskPickerType = 'category' | 'reminder' | 'repeat' | null;

export const AddEditTaskScreen: React.FC<RootStackScreenProps<'AddEditTask'>> = ({
  route,
  navigation,
}) => {
  const { theme } = useTheme();
  const repo = useMemo(() => new TaskRepository(databaseClient), []);
  const taskId = route.params?.taskId;
  const initialData = route.params?.initialData;
  const isEditing = Boolean(taskId);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<TaskCategory>(initialData?.category || 'personal');
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || 'medium');
  const [dueDate, setDueDate] = useState<string>(
    initialData?.due_date || TaskService.toDateString(new Date())
  );
  const [dueTime, setDueTime] = useState<string>(initialData?.due_time || '');
  const [repeatInterval, setRepeatInterval] = useState<TaskRepeatInterval>(
    initialData?.repeat_interval || 'none'
  );
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(
    initialData?.reminder_minutes ?? null
  );
  const [location, setLocation] = useState(initialData?.location || '');
  const [photoUri, setPhotoUri] = useState<string | null>(initialData?.photo_uri || null);
  const [photoThumbnailUri, setPhotoThumbnailUri] = useState<string | null>(
    initialData?.photo_thumbnail_uri || null
  );

  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [clockModalVisible, setClockModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<TaskPickerType>(null);

  const bottomPadding = useKeyboardBottomPadding(40);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const loadExistingTask = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const task = await repo.findById(id);
        if (task) {
          setTitle(task.title);
          setDescription(task.description || '');
          setCategory(task.category || 'personal');
          setPriority(task.priority || 'medium');
          setDueDate(task.due_date || TaskService.toDateString(new Date()));
          setDueTime(task.due_time || '');
          setRepeatInterval(task.repeat_interval || 'none');
          setReminderMinutes(task.reminder_minutes ?? null);
          setLocation(task.location || '');
          setPhotoUri(task.photo_uri || null);
          setPhotoThumbnailUri(task.photo_thumbnail_uri || null);
        }
      } catch {
        Alert.alert('Error', 'Failed to load task details.');
      } finally {
        setLoading(false);
      }
    },
    [repo]
  );

  useEffect(() => {
    if (taskId) {
      loadExistingTask(taskId);
    }
  }, [taskId, loadExistingTask]);

  const handlePickPhoto = async () => {
    try {
      const result = await MediaService.pickTaskPhoto(taskId || 'new');
      if (result?.uri) {
        setPhotoUri(result.uri);
        setPhotoThumbnailUri(result.thumbnailUri || null);
      }
    } catch {
      Alert.alert('Photo Error', 'Failed to pick photo.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoThumbnailUri(null);
  };

  const validate = (): boolean => {
    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage('Please enter a task name (at least 2 characters).');
      return false;
    }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      setErrorMessage('Due date must be in YYYY-MM-DD format.');
      return false;
    }
    if (dueTime && !/^\d{2}:\d{2}$/.test(dueTime.trim())) {
      setErrorMessage('Due time must be in HH:mm format (e.g. 14:30).');
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
        id: taskId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate.trim() || null,
        due_time: dueTime.trim() || null,
        priority,
        category,
        repeat_interval: repeatInterval,
        reminder_minutes: reminderMinutes,
        location: location.trim() || null,
        photo_uri: photoUri || null,
        photo_thumbnail_uri: photoThumbnailUri || null,
        status: 'pending',
        is_completed: 0,
        completed_at: null,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      };

      if (isEditing && taskId) {
        await repo.update(entity);
      } else {
        await repo.create(entity);
      }

      navigation.goBack();
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText
            variant="bodyMedium"
            color={theme.colors.textSecondary}
            style={styles.loadingText}
          >
            Loading task...
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  const selectedCategoryObj = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  const selectedCategoryConfig = TaskService.getCategoryConfig(category);
  const selectedReminderObj = REMINDER_OPTIONS.find((r) => r.minutes === reminderMinutes);
  const selectedRepeatObj = REPEAT_OPTIONS.find((ro) => ro.key === repeatInterval);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Top Header */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.navBackBtn}
          >
            <ChevronLeftIcon size={20} color={theme.colors.text} />
          </Pressable>
          <AppText variant="titleMedium" weight="700" numberOfLines={1}>
            {isEditing ? 'Edit Task' : 'Add Task'}
          </AppText>
          <View style={styles.navRightPlaceholder} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: theme.spacing.lg, paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AppText variant="bodySmall" color={theme.colors.error}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          {/* 1. Task Name * */}
          <AppInput
            label="Task Name *"
            placeholder="e.g. Order custom birthday cake"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errorMessage) setErrorMessage(null);
            }}
            prefixIcon={<DocumentCheckIcon size={18} color={theme.colors.textSecondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* 2. Description */}
          <AppInput
            label="Description"
            placeholder="Add specific instructions, contact info, or steps..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            prefixIcon={<TextLinesIcon size={18} color={theme.colors.textSecondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* 3. Side-by-side Date * and Time * */}
          <View style={styles.sideBySideRow}>
            <View style={styles.halfCol}>
              <AppText
                variant="labelMedium"
                color={theme.colors.textSecondary}
                style={styles.inputLabel}
              >
                Date *
              </AppText>
              <Pressable
                onPress={() => setCalendarModalVisible(true)}
                style={[
                  styles.dropdownBox,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select Due Date"
              >
                <View style={styles.dropdownPrefixRow}>
                  <CalendarIcon size={18} color={theme.colors.primary} />
                  <AppText
                    variant="bodyMedium"
                    weight="600"
                    color={theme.colors.text}
                    style={styles.dropdownValueWithIcon}
                    numberOfLines={1}
                  >
                    {dueDate || 'Select date'}
                  </AppText>
                </View>
                <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.halfCol}>
              <AppText
                variant="labelMedium"
                color={theme.colors.textSecondary}
                style={styles.inputLabel}
              >
                Time *
              </AppText>
              <Pressable
                onPress={() => setClockModalVisible(true)}
                style={[
                  styles.dropdownBox,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select Due Time"
              >
                <View style={styles.dropdownPrefixRow}>
                  <ClockIcon size={18} color={theme.colors.warning} />
                  <AppText
                    variant="bodyMedium"
                    weight="600"
                    color={theme.colors.text}
                    style={styles.dropdownValueWithIcon}
                    numberOfLines={1}
                  >
                    {dueTime
                      ? (() => {
                          const parts = dueTime.split(':');
                          const h = parseInt(parts[0] ?? '0', 10);
                          const m = parts[1] ?? '00';
                          const period = h >= 12 ? 'PM' : 'AM';
                          const dispH = h % 12 === 0 ? 12 : h % 12;
                          return `${String(dispH).padStart(2, '0')}:${m} ${period}`;
                        })()
                      : 'Set time'}
                  </AppText>
                </View>
                {dueTime ? (
                  <Pressable
                    onPress={() => setDueTime('')}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear due time"
                  >
                    <CloseIcon size={14} color={theme.colors.textSecondary} />
                  </Pressable>
                ) : (
                  <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          {/* 4. Priority */}
          <View style={styles.fieldSpacing}>
            <AppText
              variant="labelMedium"
              color={theme.colors.textSecondary}
              style={styles.inputLabel}
            >
              Priority
            </AppText>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.key;
                const pConf = TaskService.getPriorityConfig(p.key);
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPriority(p.key)}
                    style={[
                      styles.priorityChip,
                      {
                        borderColor: isSelected ? pConf.color : theme.colors.border,
                        backgroundColor: isSelected ? pConf.bgColor : theme.colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <AppText
                      variant="labelSmall"
                      weight={isSelected ? '700' : '600'}
                      color={isSelected ? pConf.color : theme.colors.textSecondary}
                      numberOfLines={1}
                    >
                      {p.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Category Dropdown */}
          <View style={styles.fieldSpacing}>
            <AppText
              variant="labelMedium"
              color={theme.colors.textSecondary}
              style={styles.inputLabel}
            >
              Category
            </AppText>
            <Pressable
              onPress={() => setActivePicker('category')}
              style={[
                styles.dropdownBox,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select Category"
            >
              <View style={styles.dropdownPrefixRow}>
                <CategoryShapesIcon size={18} color={selectedCategoryConfig.color} />
                <AppText
                  variant="bodyMedium"
                  weight="600"
                  color={theme.colors.text}
                  numberOfLines={1}
                  style={styles.dropdownValueWithIcon}
                >
                  {selectedCategoryObj?.label || 'Personal'}
                </AppText>
              </View>
              <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* 6. Reminder Dropdown */}
          <View style={styles.fieldSpacing}>
            <AppText
              variant="labelMedium"
              color={theme.colors.textSecondary}
              style={styles.inputLabel}
            >
              Reminder
            </AppText>
            <Pressable
              onPress={() => setActivePicker('reminder')}
              style={[
                styles.dropdownBox,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select Reminder"
            >
              <View style={styles.dropdownPrefixRow}>
                <BellIcon size={18} color={theme.colors.warning} />
                <AppText
                  variant="bodyMedium"
                  weight="600"
                  color={theme.colors.text}
                  style={styles.dropdownValueWithIcon}
                >
                  {selectedReminderObj ? selectedReminderObj.label : 'None'}
                </AppText>
              </View>
              <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* 7. Repeat Dropdown */}
          <View style={styles.fieldSpacing}>
            <AppText
              variant="labelMedium"
              color={theme.colors.textSecondary}
              style={styles.inputLabel}
            >
              Repeat
            </AppText>
            <Pressable
              onPress={() => setActivePicker('repeat')}
              style={[
                styles.dropdownBox,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select Repeat"
            >
              <View style={styles.dropdownPrefixRow}>
                <RepeatIcon size={18} color={theme.colors.primary} />
                <AppText
                  variant="bodyMedium"
                  weight="600"
                  color={theme.colors.text}
                  style={styles.dropdownValueWithIcon}
                >
                  {selectedRepeatObj ? selectedRepeatObj.label : 'Does not repeat'}
                </AppText>
              </View>
              <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* 8. Location */}
          <AppInput
            label="Location"
            placeholder="e.g. Downtown Bakery, 5th Ave"
            value={location}
            onChangeText={setLocation}
            prefixIcon={<PinIcon size={18} color={theme.colors.secondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* 9. Photo Attachment */}
          <View style={styles.fieldSpacing}>
            <AppText
              variant="labelMedium"
              color={theme.colors.textSecondary}
              style={styles.inputLabel}
            >
              Attachment (Optional)
            </AppText>
            {photoUri ? (
              <View style={styles.photoPreviewBox}>
                <Image source={{ uri: photoUri }} style={styles.attachedImage} />
                <Pressable
                  onPress={handleRemovePhoto}
                  style={styles.removePhotoBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Remove attached photo"
                >
                  <CloseIcon size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickPhoto}
                style={[styles.attachPhotoBtn, { borderColor: theme.colors.border }]}
              >
                <CameraIcon size={20} color={theme.colors.primary} />
                <AppText
                  variant="labelMedium"
                  color={theme.colors.primary}
                  style={styles.attachText}
                >
                  Attach Photo
                </AppText>
              </Pressable>
            )}
          </View>

          {/* 10. Bottom Action Buttons */}
          <View style={styles.actionsRow}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.actionBtn}
            />
            <AppButton
              title={isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Task'}
              variant="primary"
              onPress={handleSave}
              disabled={isSubmitting}
              leftIcon={<SaveDiskIcon size={18} color="#FFFFFF" />}
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modal for Category, Reminder, Repeat */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setActivePicker(null)} />
          <View
            style={[
              styles.modalContentCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="titleMedium" weight="700" color={theme.colors.text}>
                {activePicker === 'category'
                  ? 'Select Category'
                  : activePicker === 'reminder'
                  ? 'Select Reminder'
                  : 'Select Repeat'}
              </AppText>
              <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                <CloseIcon size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.pickerList}
              showsVerticalScrollIndicator={false}
            >
              {activePicker === 'category' &&
                CATEGORIES.map((cat) => {
                  const isSelected = category === cat.key;
                  const conf = TaskService.getCategoryConfig(cat.key);
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        setCategory(cat.key);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.pickerListItem,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'transparent',
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={styles.modalOptionPrefix}>
                        <View style={[styles.catColorDot, { backgroundColor: conf.color }]} />
                        <AppText
                          variant="bodyMedium"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? conf.color : theme.colors.text}
                        >
                          {cat.label}
                        </AppText>
                      </View>
                      {isSelected ? <CheckIcon size={16} color={theme.colors.primary} /> : null}
                    </Pressable>
                  );
                })}

              {activePicker === 'reminder' &&
                REMINDER_OPTIONS.map((rem, idx) => {
                  const isSelected = reminderMinutes === rem.minutes;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setReminderMinutes(rem.minutes);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.pickerListItem,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'transparent',
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodyMedium"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? theme.colors.warning : theme.colors.text}
                      >
                        {rem.label}
                      </AppText>
                      {isSelected ? <CheckIcon size={16} color={theme.colors.warning} /> : null}
                    </Pressable>
                  );
                })}

              {activePicker === 'repeat' &&
                REPEAT_OPTIONS.map((opt) => {
                  const isSelected = repeatInterval === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        setRepeatInterval(opt.key);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.pickerListItem,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'transparent',
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodyMedium"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? theme.colors.primary : theme.colors.text}
                      >
                        {opt.label}
                      </AppText>
                      {isSelected ? <CheckIcon size={16} color={theme.colors.primary} /> : null}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date & Time Modals */}
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  navRightPlaceholder: {
    width: 40,
  },
  content: {
    paddingBottom: 40,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginBottom: 16,
  },
  fieldSpacing: {
    marginBottom: 14,
  },
  inputLabel: {
    marginBottom: 6,
  },
  sideBySideRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownPrefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownValueWithIcon: {
    marginLeft: 4,
    flex: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOptionPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoPreviewBox: {
    position: 'relative',
    width: 120,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
  },
  attachedImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  attachText: {
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
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
  modalContentCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  pickerList: {
    gap: 4,
    paddingBottom: 8,
  },
  pickerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
});
