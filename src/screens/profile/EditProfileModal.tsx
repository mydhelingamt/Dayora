import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useKeyboardBottomPadding } from '../../utilities';
import { useTheme } from '../../theme';
import { AppText } from '../../components/common/AppText';
import { AppCard } from '../../components/common/AppCard';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { AppAvatar } from '../../components/common/AppAvatar';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';
import { CalendarPickerModal } from '../../components/common/CalendarPickerModal';
import { useApp } from '../../state';
import { Gender, UserProfileEntity } from '../../repositories/types';
import { DateService } from '../../services/dateService';
import { CloseIcon, CalendarIcon } from '../../assets/icons';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfileEntity | null;
}

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  profile,
}) => {
  const { theme } = useTheme();
  const { saveProfile } = useApp();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoThumbnailUri, setPhotoThumbnailUri] = useState<string | null>(null);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bottomPadding = useKeyboardBottomPadding(24);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.display_name || '');
      setDob(profile.date_of_birth || '');
      setGender(profile.gender || 'prefer_not_to_say');
      setPhotoUri(profile.photo_uri || null);
      setPhotoThumbnailUri(profile.photo_thumbnail_uri || null);
      setErrorMessage(null);
    }
  }, [profile, visible]);

  const validate = (): boolean => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your name (at least 2 characters).');
      return false;
    }

    if (!dob.trim()) {
      setErrorMessage('Please enter your date of birth (YYYY-MM-DD).');
      return false;
    }

    if (!DateService.isValidIsoDate(dob.trim())) {
      setErrorMessage('Invalid date format. Please use YYYY-MM-DD.');
      return false;
    }

    const birthDate = new Date(dob.trim());
    const now = new Date();
    if (birthDate > now) {
      setErrorMessage('Date of birth cannot be in the future.');
      return false;
    }

    if (birthDate.getFullYear() < 1900) {
      setErrorMessage('Please enter a valid birth year (1900 or later).');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile({
        name: name.trim(),
        date_of_birth: dob.trim(),
        gender,
        photo_uri: photoUri,
        photo_thumbnail_uri: photoThumbnailUri,
      });
      onClose();
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
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
                Edit Profile
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.subtitle}>
                Update your personal information
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
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
                  name={name.trim() || 'Dayora'}
                  photoUri={photoUri}
                  size="xl"
                  ringColor={theme.colors.accent}
                />
                <View
                  style={[
                    styles.cameraBadge,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText variant="caption" color="#FFFFFF" weight="700">
                    CHANGE
                  </AppText>
                </View>
              </Pressable>
            </View>

            {/* Fields Card */}
            <AppCard style={styles.fieldsCard} variant="elevated">
              <AppInput
                label="Full Name *"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="words"
                containerStyle={styles.inputSpacing}
              />

              <AppInput
                label="Date of Birth *"
                value={dob}
                onChangeText={(val) => {
                  setDob(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                suffixIcon={
                  <Pressable
                    onPress={() => setCalendarVisible(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Select birth date from calendar"
                  >
                    <CalendarIcon size={18} color={theme.colors.accent} />
                  </Pressable>
                }
                containerStyle={styles.inputSpacing}
              />

              <AppText
                variant="labelMedium"
                weight="600"
                color={theme.colors.textSecondary}
                style={styles.genderLabel}
              >
                Gender
              </AppText>

              <View style={styles.genderChips}>
                {GENDER_OPTIONS.map((opt) => {
                  const isSelected = gender === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setGender(opt.value)}
                      style={[
                        styles.genderChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.surfaceSubtle
                            : theme.colors.card,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="labelMedium"
                        color={isSelected ? theme.colors.primaryLight : theme.colors.textSecondary}
                        weight={isSelected ? '700' : '500'}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {errorMessage ? (
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: theme.colors.errorBackground },
                  ]}
                >
                  <AppText variant="bodySmall" color={theme.colors.error} weight="600">
                    {errorMessage}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.buttonRow}>
                <AppButton
                  title="Cancel"
                  variant="ghost"
                  onPress={onClose}
                  style={styles.flexBtn}
                />
                <AppButton
                  title="Save Changes"
                  variant="primary"
                  onPress={handleSave}
                  loading={isSaving}
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
        onSelectPhoto={(uri, thumbUri) => {
          setPhotoUri(uri);
          setPhotoThumbnailUri(thumbUri || null);
        }}
        currentPhotoUri={photoUri}
      />

      <CalendarPickerModal
        visible={calendarVisible}
        initialDate={dob}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={(date) => {
          setDob(date);
          if (errorMessage) setErrorMessage(null);
        }}
        title="Select Date of Birth"
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
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fieldsCard: {
    padding: 16,
  },
  inputSpacing: {
    marginBottom: 14,
  },
  genderLabel: {
    marginBottom: 8,
    marginTop: 2,
  },
  genderChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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
