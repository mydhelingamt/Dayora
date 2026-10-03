import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppText } from '../../components/common/AppText';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { AppAvatar } from '../../components/common/AppAvatar';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';
import { CalendarPickerModal } from '../../components/common/CalendarPickerModal';
import { useTheme } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { databaseClient } from '../../database';
import { BirthdayRepository } from '../../repositories/birthdayRepository';
import { BirthdayEntity } from '../../repositories/types';
import { DateService } from '../../services/dateService';
import {
  ChevronLeftIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
  PeopleGroupIcon,
  HashIcon,
  TextLinesIcon,
  ChevronDownIcon,
  SaveDiskIcon,
  CameraIcon,
  CloseIcon,
  CheckIcon,
  PlusIcon,
} from '../../assets/icons';
import { useKeyboardBottomPadding } from '../../utilities';

const RELATIONSHIP_OPTIONS = ['Friend', 'Family', 'Work', 'Partner', 'Other'];

export const AddEditBirthdayScreen: React.FC<RootStackScreenProps<'AddEditBirthday'>> = ({
  route,
  navigation,
}) => {
  const { birthdayId, initialData } = route.params ?? {};
  const isEditing = Boolean(birthdayId);
  const { theme } = useTheme();

  const repo = useMemo(() => new BirthdayRepository(databaseClient), []);

  const [loading, setLoading] = useState(isEditing);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [birthMonth, setBirthMonth] = useState(new Date().getMonth() + 1);
  const [birthDay, setBirthDay] = useState(new Date().getDate());
  const [birthYear, setBirthYear] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoThumbnailUri, setPhotoThumbnailUri] = useState<string | null>(null);

  const [activePicker, setActivePicker] = useState<'day' | 'month' | 'relationship' | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bottomPadding = useKeyboardBottomPadding(40);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const handleCalendarSelect = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const yr = parts[0];
      const mo = Number(parts[1]);
      const dy = Number(parts[2]);
      setBirthMonth(mo);
      setBirthDay(dy);
      if (yr) {
        setBirthYear(yr);
      }
    }
  };

  // Load existing birthday for editing
  const loadExistingBirthday = useCallback(async () => {
    if (!birthdayId) return;
    try {
      const existing = await repo.findById(birthdayId);
      if (existing) {
        setName(existing.name);
        setNickname(existing.nickname || '');
        setRelationship(existing.relationship || 'Friend');
        setBirthMonth(existing.birth_month || 1);
        setBirthDay(existing.birth_day || 1);
        if (existing.birth_year != null && existing.birth_year > 0) {
          setBirthYear(String(existing.birth_year));
        } else {
          setBirthYear('');
        }
        setNotes(existing.notes || '');
        setIsFavorite(Number(existing.is_favorite) === 1);
        setPhotoUri(existing.photo_uri || null);
        setPhotoThumbnailUri(existing.photo_thumbnail_uri || null);
      }
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  }, [repo, birthdayId]);

  useEffect(() => {
    if (isEditing) {
      loadExistingBirthday();
    } else if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.relationship) setRelationship(initialData.relationship);
    }
  }, [isEditing, initialData, loadExistingBirthday]);

  // Adjust day if selected month has fewer days than current birthDay
  const maxDaysInMonth = useMemo(() => {
    const yearNum = birthYear.trim() ? parseInt(birthYear.trim(), 10) : null;
    return DateService.getDaysInMonth(birthMonth, isNaN(Number(yearNum)) ? null : yearNum);
  }, [birthMonth, birthYear]);

  useEffect(() => {
    if (birthDay > maxDaysInMonth) {
      setBirthDay(maxDaysInMonth);
    }
  }, [maxDaysInMonth, birthDay]);

  const validate = (): boolean => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter a name (at least 2 characters).');
      return false;
    }

    if (birthMonth < 1 || birthMonth > 12) {
      setErrorMessage('Please select a valid month.');
      return false;
    }

    if (birthDay < 1 || birthDay > maxDaysInMonth) {
      setErrorMessage(`Please select a valid day for ${DateService.MONTH_NAMES[birthMonth - 1]} (1-${maxDaysInMonth}).`);
      return false;
    }

    if (birthYear.trim()) {
      const yearNum = parseInt(birthYear.trim(), 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        setErrorMessage(`Please enter a valid birth year between 1900 and ${currentYear}.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      const parsedYear = birthYear.trim() ? parseInt(birthYear.trim(), 10) : null;

      const birthDate = parsedYear
        ? `${parsedYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
        : `${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      const entity: BirthdayEntity = {
        id: birthdayId || `bday_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        birth_date: birthDate,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: parsedYear,
        nickname: nickname.trim() || null,
        relationship,
        photo_uri: photoUri,
        photo_thumbnail_uri: photoThumbnailUri,
        is_favorite: isFavorite ? 1 : 0,
        reminder_days_before: 1,
        notes: notes.trim() || null,
        is_archived: 0,
        created_at: now,
        updated_at: now,
      };

      if (isEditing) {
        await repo.update(entity);
      } else {
        await repo.create(entity);
      }

      navigation.goBack();
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to save birthday.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

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
            {isEditing ? 'Edit Birthday' : 'Add Birthday'}
          </AppText>
          <View style={styles.navRightPlaceholder} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg, paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Avatar Photo Selector */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setPhotoModalVisible(true)}
              style={[
                styles.avatarCircle,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.card,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose Photo"
            >
              {photoUri ? (
                <AppAvatar
                  name={name || 'Dayora'}
                  photoUri={photoUri}
                  size="xl"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <CameraIcon size={32} color={theme.colors.primaryLight} />
                </View>
              )}
              <View style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary }]}>
                <PlusIcon size={12} color="#FFFFFF" />
              </View>
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AppText variant="bodySmall" color={theme.colors.error}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          {/* 1. Name * */}
          <AppInput
            label="Name *"
            placeholder="e.g. Sarah Jenkins"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errorMessage) setErrorMessage(null);
            }}
            prefixIcon={<UserIcon size={18} color={theme.colors.textSecondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* 2. Side-by-side Day * and Month * */}
          <View style={styles.sideBySideRow}>
            <View style={styles.halfCol}>
              <AppText variant="labelMedium" color={theme.colors.textSecondary} style={styles.inputLabel}>
                Day *
              </AppText>
              <Pressable
                onPress={() => setActivePicker('day')}
                style={[
                  styles.dropdownBox,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <AppText variant="bodyMedium" weight="600" color={theme.colors.text}>
                  {birthDay}
                </AppText>
                <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.halfCol}>
              <AppText variant="labelMedium" color={theme.colors.textSecondary} style={styles.inputLabel}>
                Month *
              </AppText>
              <Pressable
                onPress={() => setActivePicker('month')}
                style={[
                  styles.dropdownBox,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <AppText
                  variant="bodyMedium"
                  weight="600"
                  color={theme.colors.text}
                  numberOfLines={1}
                  style={styles.flexOne}
                >
                  {DateService.MONTH_NAMES[birthMonth - 1]}
                </AppText>
                <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* 3. Birth Year (optional) */}
          <AppInput
            label="Birth Year (optional)"
            placeholder="e.g. 1995"
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="numeric"
            maxLength={4}
            prefixIcon={<CalendarIcon size={18} color={theme.colors.textSecondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* 4. Relationship */}
          <View style={styles.fieldSpacing}>
            <AppText variant="labelMedium" color={theme.colors.textSecondary} style={styles.inputLabel}>
              Relationship
            </AppText>
            <Pressable
              onPress={() => setActivePicker('relationship')}
              style={[
                styles.dropdownBox,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.dropdownPrefixRow}>
                <PeopleGroupIcon size={18} color={theme.colors.textSecondary} />
                <AppText variant="bodyMedium" weight="600" color={theme.colors.text} style={styles.dropdownValueWithIcon}>
                  {relationship}
                </AppText>
              </View>
              <ChevronDownIcon size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* 5. Nickname */}
          <AppInput
            label="Nickname"
            placeholder="e.g. Sari or Mom"
            value={nickname}
            onChangeText={setNickname}
            prefixIcon={<HashIcon size={18} color={theme.colors.textSecondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* 6. Notes */}
          <AppInput
            label="Notes"
            placeholder="Favorite items, sizes, preferences..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            prefixIcon={<TextLinesIcon size={18} color={theme.colors.textSecondary} />}
            containerStyle={styles.fieldSpacing}
          />

          {/* Favorite Toggle Row */}
          <Pressable
            onPress={() => setIsFavorite(!isFavorite)}
            style={[
              styles.favoriteRow,
              {
                borderColor: isFavorite ? '#F43F5E' : theme.colors.border,
                backgroundColor: isFavorite ? 'rgba(244, 63, 94, 0.12)' : theme.colors.surfaceSubtle,
              },
            ]}
          >
            <HeartIcon size={20} color={isFavorite ? '#F43F5E' : theme.colors.textSecondary} filled={isFavorite} />
            <AppText variant="bodyMedium" weight="600" color={isFavorite ? '#F43F5E' : theme.colors.textSecondary} numberOfLines={1} style={styles.favoriteText}>
              {isFavorite ? 'Marked as Favorite' : 'Mark as Favorite'}
            </AppText>
          </Pressable>

          {/* 7. Bottom Save Button */}
          <AppButton
            title={isSubmitting ? 'Saving...' : 'Save Birthday'}
            leftIcon={<SaveDiskIcon size={18} color="#FFFFFF" />}
            onPress={handleSave}
            loading={isSubmitting}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selection Modal for Day / Month / Relationship */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setActivePicker(null)} />
          <View style={[styles.modalContentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <AppText variant="titleMedium" weight="700" color={theme.colors.text}>
                {activePicker === 'day'
                  ? 'Select Day'
                  : activePicker === 'month'
                  ? 'Select Month'
                  : 'Select Relationship'}
              </AppText>
              <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                <CloseIcon size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {activePicker === 'day' ? (
              <ScrollView contentContainerStyle={styles.dayGrid} showsVerticalScrollIndicator={false}>
                {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = birthDay === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        setBirthDay(d);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.dayGridItem,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="labelMedium"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? '#FFFFFF' : theme.colors.text}
                      >
                        {d}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : activePicker === 'month' ? (
              <ScrollView contentContainerStyle={styles.pickerList} showsVerticalScrollIndicator={false}>
                {DateService.MONTH_NAMES.map((mName, idx) => {
                  const mNum = idx + 1;
                  const isSelected = birthMonth === mNum;
                  return (
                    <Pressable
                      key={mName}
                      onPress={() => {
                        setBirthMonth(mNum);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.pickerListItem,
                        {
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodyMedium"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? theme.colors.primary : theme.colors.text}
                      >
                        {mName}
                      </AppText>
                      {isSelected ? <CheckIcon size={16} color={theme.colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : activePicker === 'relationship' ? (
              <View style={styles.pickerList}>
                {RELATIONSHIP_OPTIONS.map((opt) => {
                  const isSelected = relationship === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        setRelationship(opt);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.pickerListItem,
                        {
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodyMedium"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? theme.colors.primary : theme.colors.text}
                      >
                        {opt}
                      </AppText>
                      {isSelected ? <CheckIcon size={16} color={theme.colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Reusable Photo Picker Modal */}
      <PhotoPickerModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onSelectPhoto={(uri, thumbUri) => {
          setPhotoUri(uri);
          setPhotoThumbnailUri(thumbUri || null);
        }}
        currentPhotoUri={photoUri}
      />

      {/* Calendar Picker Modal */}
      <CalendarPickerModal
        visible={calendarModalVisible}
        initialDate={`${birthYear && birthYear.length === 4 ? birthYear : '2000'}-${String(
          birthMonth
        ).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={handleCalendarSelect}
        title="Select Birthday"
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
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
    marginLeft: 8,
  },
  flexOne: {
    flex: 1,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  favoriteText: {
    marginLeft: 6,
  },
  saveBtn: {
    marginTop: 10,
    minHeight: 50,
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
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  dayGridItem: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
