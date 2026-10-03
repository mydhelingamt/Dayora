import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppText } from '../../components/common/AppText';
import { AppCard } from '../../components/common/AppCard';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { AppAvatar } from '../../components/common/AppAvatar';
import { CalendarPickerModal } from '../../components/common/CalendarPickerModal';
import { PhotoPickerModal } from '../../components/profile/PhotoPickerModal';
import { useApp } from '../../state';
import { Gender } from '../../repositories/types';
import { Images } from '../../assets';
import { CalendarIcon } from '../../assets/icons';
import { DateService } from '../../services/dateService';
import { useKeyboardBottomPadding } from '../../utilities';

export interface ProfileSetupScreenProps {
  onComplete: () => void;
}

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const { saveProfile } = useApp();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoThumbnailUri, setPhotoThumbnailUri] = useState<string | null>(null);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bottomPadding = useKeyboardBottomPadding(40);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

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
      setErrorMessage('Invalid date format. Please use YYYY-MM-DD (e.g., 1998-05-24).');
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

  const handleComplete = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveProfile({
        name: name.trim(),
        date_of_birth: dob.trim(),
        gender,
        photo_uri: photoUri,
        photo_thumbnail_uri: photoThumbnailUri,
      });
      onComplete();
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Branding Header */}
        <View style={styles.header}>
          <Image source={Images.logoOptimized} style={styles.logo} resizeMode="contain" />
          <AppText variant="headlineLarge" weight="700" style={styles.title}>
            Set Up Your Profile
          </AppText>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={styles.subtitle}>
            Welcome to Dayora! Personalize your profile to unlock custom birthday countdowns and daily priorities.
          </AppText>
        </View>

        {/* Profile Photo Selector Card */}
        <AppCard style={styles.photoCard} variant="elevated">
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
                EDIT
              </AppText>
            </View>
          </Pressable>

          <AppText variant="labelMedium" weight="600" style={styles.photoHint}>
            {photoUri ? 'Tap to change photo' : 'Add a profile photo (optional)'}
          </AppText>
        </AppCard>

        {/* Form Fields Card */}
        <AppCard style={styles.formCard} variant="elevated">
          <AppInput
            label="Your Name *"
            placeholder="e.g., Alex Morgan"
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
            placeholder="YYYY-MM-DD (e.g., 1998-05-24)"
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

          {/* Gender Selection */}
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

          {/* Error message */}
          {errorMessage ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorBackground }]}>
              <AppText variant="bodySmall" color={theme.colors.error} weight="600">
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          {/* Action Button */}
          <AppButton
            title="Continue to Dayora"
            variant="primary"
            onPress={handleComplete}
            loading={isSubmitting}
            style={styles.submitBtn}
          />
        </AppCard>

        {/* Photo Picker Modal */}
        <PhotoPickerModal
          visible={photoModalVisible}
          onClose={() => setPhotoModalVisible(false)}
          onSelectPhoto={(uri, thumbUri) => {
            setPhotoUri(uri);
            setPhotoThumbnailUri(thumbUri || null);
          }}
          currentPhotoUri={photoUri}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Picker Modal */}
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    paddingVertical: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  logo: {
    width: 54,
    height: 54,
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  photoCard: {
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
  photoHint: {
    marginTop: 10,
  },
  formCard: {
    padding: 18,
    marginBottom: 24,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 4,
  },
});
