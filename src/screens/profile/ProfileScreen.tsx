import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ScreenContainer,
  Header,
  AppCard,
  AppText,
  AppAvatar,
  Badge,
  SectionHeader,
  AppButton,
} from '../../components';
import { useTheme } from '../../theme';
import { HomeTabScreenProps } from '../../navigation/types';
import { useApp } from '../../state';
import { databaseClient } from '../../database';
import { DateService } from '../../services/dateService';
import { MediaService, StorageMetrics, formatBytes } from '../../services/mediaService';
import { BackupService, DayoraBackupPayload } from '../../services/backupService';
import { ExportIcon, ImportIcon } from '../../assets/icons';
import { EditProfileModal } from './EditProfileModal';

export const ProfileScreen: React.FC<HomeTabScreenProps<'Profile'>> = () => {
  const { theme, isDark, isGolden, toggleTheme } = useTheme();
  const { state, updateNotifications, updateTheme, reloadProfile } = useApp();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dataCounts, setDataCounts] = useState<{ birthdays: number; tasks: number }>({
    birthdays: 0,
    tasks: 0,
  });

  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics>({
    cacheSizeBytes: 0,
    mediaSizeBytes: 0,
    thumbnailSizeBytes: 0,
    databaseSizeBytes: 0,
    totalAppSizeBytes: 0,
    mediaCount: 0,
    thumbnailCount: 0,
    formattedCache: '0 B',
    formattedMedia: '0 B',
    formattedThumbnail: '0 B',
    formattedDatabase: '0 B',
    formattedTotal: '0 B',
  });

  const loadStorageMetrics = useCallback(async () => {
    try {
      const metrics = await MediaService.getStorageMetrics();
      setStorageMetrics(metrics);
    } catch {
      // Handled cleanly
    }
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        databaseClient.execute<{ count: number }>(
          'SELECT COUNT(*) as count FROM birthdays WHERE is_archived = 0;'
        ),
        databaseClient.execute<{ count: number }>('SELECT COUNT(*) as count FROM tasks;'),
      ]);
      setDataCounts({
        birthdays: bRes.rows?.[0]?.count ?? 0,
        tasks: tRes.rows?.[0]?.count ?? 0,
      });
    } catch {
      // Handled cleanly
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStorageMetrics();
      loadCounts();
    }, [loadStorageMetrics, loadCounts])
  );

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await BackupService.exportBackup();
      Alert.alert(
        'Backup Exported Successfully',
        `Exported ${result.birthdayCount} birthdays and ${result.taskCount} tasks.\n\nFile: ${result.fileName}${
          result.savedToDownloads ? '\nSaved copy to: Downloads/Dayora/' : ''
        }`
      );
    } catch (error) {
      Alert.alert('Export Error', (error as Error).message || 'Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    setIsImporting(true);
    try {
      const payload = await BackupService.pickAndValidateBackup();
      const bCount = payload.summary.birthday_count;
      const tCount = payload.summary.task_count;
      const profileName = payload.data.user_profile?.name || 'User Profile';

      Alert.alert(
        'Restore Backup File',
        `Backup contains:\n• ${bCount} Birthdays\n• ${tCount} Tasks\n• Profile: ${profileName}\n\nChoose how you want to restore:`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsImporting(false),
          },
          {
            text: 'Merge',
            onPress: async () => {
              try {
                const res = await BackupService.restoreBackup(payload, 'merge');
                await reloadProfile();
                await loadStorageMetrics();
                await loadCounts();
                Alert.alert(
                  'Data Restored',
                  `Successfully merged ${res.birthdaysRestored} birthdays and ${res.tasksRestored} tasks into your app.`
                );
              } catch (err) {
                Alert.alert('Restore Error', (err as Error).message || 'Failed to merge backup.');
              } finally {
                setIsImporting(false);
              }
            },
          },
          {
            text: 'Replace All',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await BackupService.restoreBackup(payload, 'replace');
                await reloadProfile();
                await loadStorageMetrics();
                await loadCounts();
                Alert.alert(
                  'Data Restored',
                  `Successfully replaced and restored ${res.birthdaysRestored} birthdays and ${res.tasksRestored} tasks.`
                );
              } catch (err) {
                Alert.alert('Restore Error', (err as Error).message || 'Failed to restore backup.');
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setIsImporting(false);
      if ((error as Error).message !== 'Import cancelled by user.') {
        Alert.alert('Import Failed', (error as Error).message || 'Unable to import file.');
      }
    }
  };

  const handleClearCache = async () => {
    setIsCleaning(true);
    try {
      const result = await MediaService.cleanupCache();
      await loadStorageMetrics();
      Alert.alert(
        'Cache Cleaned',
        `Freed ${formatBytes(result.bytesCleared)} across ${result.filesDeleted} temporary files. Persistent photos and database records were completely protected.`
      );
    } catch {
      Alert.alert('Error', 'Failed to clear cache.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleOptimizeStorage = async () => {
    setIsOptimizing(true);
    try {
      const result = await MediaService.optimizeStorage();
      await MediaService.releaseMemory();
      await loadStorageMetrics();
      Alert.alert(
        'Storage Optimized',
        `Reclaimed ${formatBytes(result.reclaimedBytes + result.bytesCleared)} total storage (${result.deletedFilesCount} orphaned files removed). Active photos and database links remain 100% intact.`
      );
    } catch {
      Alert.alert('Error', 'Failed to optimize storage.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const profile = state.userProfile;
  const displayName = profile?.name || profile?.display_name || 'Alex Morgan';
  const dob = profile?.date_of_birth;

  const age = dob ? DateService.getAge(dob) : null;
  const formattedDob = dob ? DateService.formatDisplayDate(dob) : null;

  const formatGender = (gender?: string): string => {
    switch (gender) {
      case 'female':
        return 'Female';
      case 'male':
        return 'Male';
      case 'non_binary':
        return 'Non-Binary';
      case 'other':
        return 'Other';
      case 'prefer_not_to_say':
      default:
        return 'Not specified';
    }
  };

  return (
    <ScreenContainer>
      <Header
        title="Settings & Profile"
        subtitle="Preferences, storage, and system settings"
      />

      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Hero Card */}
        <AppCard
          variant="glow"
          glowColor={theme.colors.glowPrimary}
          style={[styles.profileHero, { marginBottom: theme.spacing.lg }]}
        >
          <View style={styles.profileRow}>
            <AppAvatar
              name={displayName}
              photoUri={profile?.photo_uri}
              thumbnailUri={profile?.photo_thumbnail_uri}
              size="lg"
              ringColor={theme.colors.primaryLight}
            />
            <View style={styles.profileDetails}>
              <View style={styles.nameBadgeRow}>
                <AppText variant="titleLarge" weight="700" numberOfLines={1} style={styles.nameText}>
                  {displayName}
                </AppText>
                <Badge label="DAYORA PRO" variant="primary" />
              </View>
              {formattedDob ? (
                <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
                  {formattedDob} {age !== null ? `(Age ${age})` : ''} • {formatGender(profile?.gender)}
                </AppText>
              ) : (
                <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
                  alex.morgan@dayora.app
                </AppText>
              )}
              <AppText variant="caption" color={theme.colors.textMuted} numberOfLines={1} style={styles.subtext}>
                Local SQLite Persistence Active
              </AppText>
            </View>
          </View>

          {/* Edit Profile Action Button */}
          <AppButton
            title="Edit Profile"
            variant="outline"
            onPress={() => setEditModalVisible(true)}
            style={styles.editBtn}
          />
        </AppCard>

        {/* Appearance Section */}
        <SectionHeader title="Appearance" subtitle="Visual styles and contrast" />
        <AppCard style={{ marginBottom: theme.spacing.lg }}>
          {isGolden ? (
            <View style={[styles.goldenStatusBanner, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceSubtle }]}>
              <AppText variant="labelMedium" weight="700" color={theme.colors.primary}>
                ✨ Golden Birthday Theme Active
              </AppText>
              <AppText variant="caption" color={theme.colors.textSecondary} style={styles.goldenStatusDesc}>
                Active for your special day! Automatically returns to your selected theme tomorrow.
              </AppText>
            </View>
          ) : null}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <AppText variant="bodyLarge" weight="600" numberOfLines={1}>
                Dark Navy Theme
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                High-contrast near-black navy interface optimized for OLED screens
              </AppText>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => {
                const nextMode = val ? 'dark' : 'light';
                updateTheme(nextMode);
                toggleTheme();
              }}
              trackColor={{ false: theme.colors.surfaceSubtle, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AppCard>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" subtitle="Alerts and celebration reminders" />
        <AppCard style={{ marginBottom: theme.spacing.lg }}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <AppText variant="bodyLarge" weight="600" numberOfLines={1}>
                Birthday & Task Reminders
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                Alerts and push notifications for upcoming deadlines
              </AppText>
            </View>
            <Switch
              value={state.notificationsEnabled}
              onValueChange={(val) => updateNotifications(val)}
              trackColor={{ false: theme.colors.surfaceSubtle, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AppCard>

        {/* Data & Storage Section */}
        <SectionHeader title="Storage & Media Optimization" subtitle="Bounded cache & persistent media metrics" />
        <AppCard style={{ marginBottom: theme.spacing.lg }}>
          {/* Storage Breakdown */}
          <View style={styles.infoRow}>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1} style={styles.infoRowLabel}>
              Temporary Cache
            </AppText>
            <AppText variant="bodySmall" weight="700" color={theme.colors.accent} numberOfLines={1} style={styles.infoRowValue}>
              {storageMetrics.formattedCache}
            </AppText>
          </View>

          <View style={[styles.infoRow, { marginTop: theme.spacing.xs }]}>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1} style={styles.infoRowLabel}>
              Persistent Media ({storageMetrics.mediaCount} items)
            </AppText>
            <AppText variant="bodySmall" weight="600" numberOfLines={1} style={styles.infoRowValue}>
              {storageMetrics.formattedMedia}
            </AppText>
          </View>

          <View style={[styles.infoRow, { marginTop: theme.spacing.xs }]}>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1} style={styles.infoRowLabel}>
              Thumbnails Cache ({storageMetrics.thumbnailCount} items)
            </AppText>
            <AppText variant="bodySmall" weight="600" numberOfLines={1} style={styles.infoRowValue}>
              {storageMetrics.formattedThumbnail}
            </AppText>
          </View>

          <View style={[styles.infoRow, { marginTop: theme.spacing.xs }]}>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1} style={styles.infoRowLabel}>
              SQLite Database (dayora.db)
            </AppText>
            <AppText variant="bodySmall" weight="600" numberOfLines={1} style={styles.infoRowValue}>
              {storageMetrics.formattedDatabase}
            </AppText>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <View style={styles.infoRow}>
            <AppText variant="bodyMedium" weight="700" numberOfLines={1} style={styles.infoRowLabel}>
              Total App Footprint
            </AppText>
            <Badge label={storageMetrics.formattedTotal} variant="primary" style={styles.infoRowValue} />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          {/* Action Buttons */}
          <View style={styles.storageActionRow}>
            <AppButton
              title={isCleaning ? 'Cleaning...' : 'Clear Temp Cache'}
              variant="outline"
              size="sm"
              onPress={handleClearCache}
              disabled={isCleaning || isOptimizing}
              style={styles.storageBtn}
            />
            <AppButton
              title={isOptimizing ? 'Optimizing...' : 'Optimize Storage'}
              variant="primary"
              size="sm"
              onPress={handleOptimizeStorage}
              disabled={isCleaning || isOptimizing}
              style={styles.storageBtn}
            />
          </View>
        </AppCard>

        {/* Backup & Restore Data Section */}
        <SectionHeader
          title="Backup & Restore Data"
          subtitle="Export and import your birthdays, tasks, and settings"
        />
        <AppCard style={{ marginBottom: theme.spacing.lg }}>
          <View style={styles.infoRow}>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1} style={styles.infoRowLabel}>
              Active Records
            </AppText>
            <AppText variant="bodySmall" weight="700" color={theme.colors.accent} numberOfLines={1} style={styles.infoRowValue}>
              {dataCounts.birthdays} Birthdays • {dataCounts.tasks} Tasks
            </AppText>
          </View>

          <AppText variant="caption" color={theme.colors.textMuted} style={styles.backupDesc}>
            Save all birthdays, tasks, and settings to a JSON file. Store it in Google Drive, email it, or restore it on any device anytime.
          </AppText>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <View style={styles.storageActionRow}>
            <AppButton
              title={isExporting ? 'Exporting...' : 'Export File'}
              leftIcon={<ExportIcon size={16} color={theme.colors.primaryLight} />}
              variant="outline"
              size="sm"
              onPress={handleExportData}
              disabled={isExporting || isImporting}
              style={styles.storageBtn}
            />
            <AppButton
              title={isImporting ? 'Importing...' : 'Import File'}
              leftIcon={<ImportIcon size={16} color="#FFFFFF" />}
              variant="primary"
              size="sm"
              onPress={handleImportData}
              disabled={isExporting || isImporting}
              style={styles.storageBtn}
            />
          </View>
        </AppCard>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={profile}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  profileHero: {
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: 14,
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  nameText: {
    flexShrink: 1,
    marginRight: 8,
  },
  subtext: {
    marginTop: 2,
  },
  editBtn: {
    marginTop: 14,
    minHeight: 40,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  goldenStatusBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  goldenStatusDesc: {
    marginTop: 3,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  infoRowLabel: {
    flexShrink: 1,
    marginRight: 8,
  },
  infoRowValue: {
    flexShrink: 0,
  },
  storageActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  storageBtn: {
    flex: 1,
  },
  backupDesc: {
    marginTop: 6,
    lineHeight: 18,
  },
});
