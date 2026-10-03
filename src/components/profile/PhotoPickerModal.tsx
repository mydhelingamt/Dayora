import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { AppAvatar } from '../common/AppAvatar';
import { PRESET_AVATARS, PresetAvatar, MediaService } from '../../services/mediaService';
import { CloseIcon, PlusIcon, CameraIcon } from '../../assets/icons';

export interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPhoto: (uri: string | null, thumbnailUri?: string | null) => void;
  currentPhotoUri?: string | null;
}

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  visible,
  onClose,
  onSelectPhoto,
  currentPhotoUri,
}) => {
  const { theme } = useTheme();

  const handleCaptureFromCamera = async () => {
    onClose();
    const result = await MediaService.captureProfileImage();
    if (result?.uri) {
      onSelectPhoto(result.uri, result.thumbnailUri);
    }
  };

  const handlePickFromGallery = async () => {
    onClose();
    const result = await MediaService.pickProfileImage();
    if (result?.uri) {
      onSelectPhoto(result.uri, result.thumbnailUri);
    }
  };

  const handleSelectPreset = (preset: PresetAvatar) => {
    onClose();
    onSelectPhoto(preset.id, null);
  };

  const handleRemovePhoto = () => {
    onClose();
    onSelectPhoto(null, null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
              <AppText variant="titleMedium" weight="700">
                Profile Photo
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.subtitle}>
                Choose a photo or select a signature avatar
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <CloseIcon size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Actions: Live Camera & Gallery */}
          <View style={styles.actionButtonsRow}>
            <AppButton
              title="Take Photo"
              variant="outline"
              onPress={handleCaptureFromCamera}
              leftIcon={<CameraIcon size={16} color={theme.colors.accent} />}
              style={styles.actionHalfBtn}
            />
            <AppButton
              title="From Gallery"
              variant="outline"
              onPress={handlePickFromGallery}
              leftIcon={<PlusIcon size={16} color={theme.colors.primaryLight} />}
              style={styles.actionHalfBtn}
            />
          </View>

          {/* Preset Avatars Section */}
          <AppText
            variant="labelMedium"
            weight="600"
            color={theme.colors.textSecondary}
            style={styles.sectionLabel}
          >
            SIGNATURE PRESETS
          </AppText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            {PRESET_AVATARS.map((preset) => {
              const isSelected = currentPhotoUri === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelectPreset(preset)}
                  style={[
                    styles.presetItem,
                    isSelected && [
                      styles.presetSelected,
                      { borderColor: theme.colors.accent },
                    ],
                  ]}
                >
                  <AppAvatar photoUri={preset.id} size="md" />
                  <AppText
                    variant="caption"
                    color={isSelected ? theme.colors.accent : theme.colors.textSecondary}
                    weight={isSelected ? '700' : '500'}
                    style={styles.presetLabel}
                  >
                    {preset.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Action: Remove photo if set */}
          {currentPhotoUri ? (
            <AppButton
              title="Remove Current Photo"
              variant="ghost"
              onPress={handleRemovePhoto}
              style={styles.removeBtn}
            />
          ) : null}

          {/* Close */}
          <AppButton
            title="Cancel"
            variant="ghost"
            onPress={onClose}
            style={styles.cancelBtn}
          />
        </View>
      </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 32,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionHalfBtn: {
    flex: 1,
  },
  actionBtn: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  presetsRow: {
    gap: 12,
    paddingBottom: 16,
  },
  presetItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetSelected: {
    borderWidth: 2,
  },
  presetLabel: {
    marginTop: 4,
  },
  removeBtn: {
    marginTop: 4,
  },
  cancelBtn: {
    marginTop: 6,
  },
});
