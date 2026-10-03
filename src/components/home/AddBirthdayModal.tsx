import React, { useState, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { useKeyboardBottomPadding } from '../../utilities';
import { useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { AppCard } from '../common/AppCard';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { AppAvatar } from '../common/AppAvatar';
import { PhotoPickerModal } from '../profile/PhotoPickerModal';
import { CalendarPickerModal } from '../common/CalendarPickerModal';
import { DateService } from '../../services/dateService';
import { CloseIcon, CalendarIcon } from '../../assets/icons';
import { BirthdayEntity } from '../../repositories/types';

export interface AddBirthdayModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (birthday: BirthdayEntity) => Promise<void>;
}

const RELATIONSHIP_OPTIONS = ['Friend', 'Family', 'Partner', 'Work', 'Other'];

export const AddBirthdayModal: React.FC<AddBirthdayModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [birthMonth, setBirthMonth] = useState(new Date().getMonth() + 1);
  const [birthDay, setBirthDay] = useState(new Date().getDate());
  const [includeYear, setIncludeYear] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bottomPadding = useKeyboardBottomPadding(24);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const maxDaysInMonth = useMemo(() => {
    const yearNum = includeYear && birthYear.trim() ? parseInt(birthYear.trim(), 10) : null;
    return DateService.getDaysInMonth(birthMonth, yearNum);
  }, [birthMonth, includeYear, birthYear]);

  // Adjust day if month changed and current day > maxDaysInMonth
  React.useEffect(() => {
    if (birthDay > maxDaysInMonth) {
      setBirthDay(maxDaysInMonth);
    }
  }, [maxDaysInMonth, birthDay]);

  const resetForm = () => {
    setName('');
    setBirthMonth(new Date().getMonth() + 1);
    setBirthDay(new Date().getDate());
    setIncludeYear(false);
    setBirthYear('');
    setRelationship('Friend');
    setPhotoUri(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      setErrorMessage(
        `Please select a valid day for ${DateService.MONTH_NAMES[birthMonth - 1]} (1-${maxDaysInMonth}).`
      );
      return false;
    }

    if (includeYear && birthYear.trim()) {
      const yearNum = parseInt(birthYear.trim(), 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        setErrorMessage(`Please enter a valid year between 1900 and ${currentYear}.`);
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  };

  const handleCalendarSelect = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const yr = parts[0];
      const mo = parts[1];
      const dy = parts[2];
      if (mo) setBirthMonth(mo);
      if (dy) setBirthDay(dy);
      if (yr) {
        setIncludeYear(true);
        setBirthYear(String(yr));
      }
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedYear = includeYear && birthYear.trim() ? parseInt(birthYear.trim(), 10) : null;
      const now = new Date().toISOString();

      const birthDate = parsedYear
        ? `${parsedYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
        : `${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

      const entity: BirthdayEntity = {
        id: `bday_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        birth_date: birthDate,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: parsedYear,
        nickname: null,
        relationship,
        photo_uri: photoUri,
        is_favorite: 0,
        reminder_days_before: 1,
        notes: null,
        is_archived: 0,
        created_at: now,
        updated_at: now,
      };

      await onSave(entity);
      handleClose();
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to save birthday.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
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
                Add Birthday
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.subtitle}>
                Keep track of their special day
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
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Pressable
                onPress={() => setPhotoModalVisible(true)}
                style={styles.avatarWrapper}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppAvatar
                  name={name.trim() || 'Friend'}
                  photoUri={photoUri}
                  size="lg"
                  ringColor={theme.colors.accent}
                />
                <View
                  style={[
                    styles.cameraBadge,
                    {
                      backgroundColor: theme.colors.accent,
                      borderColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText variant="caption" color="#FFFFFF" weight="700">
                    +
                  </AppText>
                </View>
              </Pressable>
              <AppText variant="caption" color={theme.colors.textMuted} style={styles.photoHint}>
                {photoUri ? 'Tap to change photo' : 'Add photo (optional)'}
              </AppText>
            </View>

            {/* Inputs Card */}
            <AppCard style={styles.fieldsCard} variant="elevated">
              <AppInput
                label="Full Name *"
                placeholder="e.g., Sarah Jenkins"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="words"
                containerStyle={styles.inputSpacing}
              />

              {/* Date Selection Header with Calendar Quick Button */}
              <View style={styles.dateHeaderRow}>
                <AppText variant="labelMedium" weight="600" color={theme.colors.textSecondary}>
                  Celebration Date *
                </AppText>
                <Pressable
                  onPress={() => setCalendarModalVisible(true)}
                  style={[styles.calendarQuickBtn, { borderColor: theme.colors.primary }]}
                  hitSlop={6}
                >
                  <CalendarIcon size={14} color={theme.colors.primaryLight} />
                  <AppText variant="labelSmall" weight="700" color={theme.colors.primaryLight} style={styles.calendarBtnText}>
                    Calendar
                  </AppText>
                </Pressable>
              </View>

              {/* Month Selector */}
              <AppText variant="caption" color={theme.colors.textMuted} style={styles.subLabel}>
                Month
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
                {DateService.MONTH_ABBR.map((abbr, idx) => {
                  const mNum = idx + 1;
                  const isSelected = birthMonth === mNum;
                  return (
                    <Pressable
                      key={abbr}
                      onPress={() => setBirthMonth(mNum)}
                      style={[
                        styles.monthChip,
                        {
                          backgroundColor: isSelected ? theme.colors.accent : theme.colors.surfaceSubtle,
                          borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="labelMedium"
                        color={isSelected ? '#FFFFFF' : theme.colors.text}
                        weight={isSelected ? '700' : '500'}
                      >
                        {abbr}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Day Selector */}
              <AppText variant="caption" color={theme.colors.textMuted} style={styles.subLabel}>
                Day (1 - {maxDaysInMonth})
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
                {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = birthDay === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setBirthDay(d)}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceSubtle,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="labelMedium"
                        color={isSelected ? theme.colors.textInverse : theme.colors.text}
                        weight={isSelected ? '700' : '500'}
                      >
                        {d}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Optional Year Toggle */}
              <View style={styles.yearToggleRow}>
                <View style={styles.yearToggleInfo}>
                  <AppText variant="bodyMedium" weight="600">
                    Include Birth Year?
                  </AppText>
                  <AppText variant="caption" color={theme.colors.textSecondary}>
                    Optional. Age is only displayed when year is provided.
                  </AppText>
                </View>
                <Switch
                  value={includeYear}
                  onValueChange={setIncludeYear}
                  trackColor={{ false: theme.colors.surfaceSubtle, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {includeYear ? (
                <AppInput
                  label="Birth Year (Optional)"
                  placeholder="e.g., 1996"
                  value={birthYear}
                  onChangeText={(val) => {
                    setBirthYear(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  containerStyle={styles.inputSpacing}
                />
              ) : null}

              {/* Relationship Chips */}
              <AppText variant="labelMedium" weight="600" color={theme.colors.textSecondary} style={styles.relLabel}>
                Relationship
              </AppText>

              <View style={styles.relChips}>
                {RELATIONSHIP_OPTIONS.map((rel) => {
                  const isSelected = relationship === rel;
                  return (
                    <Pressable
                      key={rel}
                      onPress={() => setRelationship(rel)}
                      style={[
                        styles.relChip,
                        {
                          backgroundColor: isSelected ? theme.colors.surfaceSubtle : theme.colors.card,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="labelMedium"
                        color={isSelected ? theme.colors.primaryLight : theme.colors.textSecondary}
                        weight={isSelected ? '700' : '500'}
                        numberOfLines={1}
                      >
                        {rel}
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
                  title="Save Birthday"
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

      <PhotoPickerModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onSelectPhoto={(uri) => setPhotoUri(uri)}
        currentPhotoUri={photoUri}
      />

      <CalendarPickerModal
        visible={calendarModalVisible}
        initialDate={includeYear && birthYear ? `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}` : null}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={handleCalendarSelect}
        title="Select Birthday"
        allowPast={true}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '92%',
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    marginTop: 6,
  },
  fieldsCard: {
    padding: 16,
  },
  inputSpacing: {
    marginBottom: 14,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  calendarBtnText: {
    marginLeft: 4,
  },
  subLabel: {
    marginBottom: 6,
    marginTop: 4,
  },
  monthScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
  },
  dayChip: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
  },
  yearToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 6,
  },
  yearToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  relLabel: {
    marginBottom: 8,
    marginTop: 2,
  },
  relChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  relChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    flexWrap: 'nowrap',
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
