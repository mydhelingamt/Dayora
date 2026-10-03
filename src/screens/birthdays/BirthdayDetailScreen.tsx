import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppCard } from '../../components/common/AppCard';
import { AppText } from '../../components/common/AppText';
import { AppAvatar } from '../../components/common/AppAvatar';
import { AppButton } from '../../components/common/AppButton';
import { Badge } from '../../components/common/Badge';
import { useTheme } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { databaseClient } from '../../database';
import { BirthdayRepository, UpcomingBirthday } from '../../repositories/birthdayRepository';
import { DateService } from '../../services/dateService';
import {
  ChevronLeftIcon,
  HeartIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
} from '../../assets/icons';

export const BirthdayDetailScreen: React.FC<RootStackScreenProps<'BirthdayDetail'>> = ({
  route,
  navigation,
}) => {
  const { birthdayId } = route.params;
  const { theme } = useTheme();

  const repo = useMemo(() => new BirthdayRepository(databaseClient), []);
  const [birthday, setBirthday] = useState<UpcomingBirthday | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBirthday = useCallback(async () => {
    try {
      const item = await repo.findUpcomingBirthdayById(birthdayId);
      setBirthday(item);
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  }, [repo, birthdayId]);

  useFocusEffect(
    useCallback(() => {
      loadBirthday();
    }, [loadBirthday])
  );

  const handleToggleFavorite = async () => {
    if (!birthday) return;
    const newFav = Number(birthday.is_favorite) === 1 ? 0 : 1;
    // Optimistic update
    setBirthday({ ...birthday, is_favorite: newFav });
    try {
      await repo.toggleFavorite(birthday.id, newFav === 1);
    } catch {
      loadBirthday();
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddEditBirthday', { birthdayId });
  };

  const handleDelete = () => {
    if (!birthday) return;
    Alert.alert(
      'Delete Birthday',
      `Are you sure you want to delete ${birthday.name}'s birthday? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await repo.delete(birthday.id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete birthday. Please try again.');
            }
          },
        },
      ]
    );
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

  if (!birthday) {
    return (
      <ScreenContainer>
        <View style={styles.centerBox}>
          <AppText variant="titleMedium" color={theme.colors.textSecondary}>
            Birthday not found
          </AppText>
          <AppButton
            title="Go Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.notFoundBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  const isFav = Number(birthday.is_favorite) === 1;

  return (
    <ScreenContainer>
      {/* Top Header Bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.navActionBtn}
        >
          <ChevronLeftIcon size={20} color={theme.colors.text} />
        </Pressable>

        <View style={styles.navRightRow}>
          <Pressable
            onPress={handleToggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Unfavorite' : 'Favorite'}
            style={[styles.navIconBtn, isFav && styles.favBtnActive]}
          >
            <HeartIcon size={18} color={isFav ? '#F43F5E' : theme.colors.textMuted} filled={isFav} />
          </Pressable>

          <Pressable
            onPress={handleEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Edit Birthday"
            style={[styles.actionChipBtn, { borderColor: theme.colors.border }]}
          >
            <EditIcon size={14} color={theme.colors.text} />
            <AppText variant="labelSmall" weight="600" color={theme.colors.text} numberOfLines={1}>
              Edit
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Delete Birthday"
            style={[styles.actionChipBtn, styles.deleteChipBtn]}
          >
            <TrashIcon size={14} color={theme.colors.error} />
            <AppText variant="labelSmall" weight="600" color={theme.colors.error} numberOfLines={1}>
              Delete
            </AppText>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar & Hero Information */}
        <View style={styles.heroSection}>
          <View style={[styles.avatarRing, { borderColor: theme.colors.accent }]}>
            <AppAvatar
              name={birthday.name}
              photoUri={birthday.photo_uri}
              thumbnailUri={birthday.photo_thumbnail_uri}
              size="xl"
            />
          </View>

          <AppText variant="headlineLarge" weight="700" style={styles.nameText}>
            {birthday.name}
          </AppText>

          {birthday.nickname ? (
            <AppText variant="titleMedium" color={theme.colors.accent} weight="600" style={styles.nicknameText}>
              "{birthday.nickname}"
            </AppText>
          ) : null}

          <View style={styles.badgeRow}>
            <Badge label={birthday.relationship || 'Friend'} variant="primary" />
            {isFav ? <Badge label="Favorite" variant="accent" showDot /> : null}
            {birthday.isLeapDay ? <Badge label="Leap Day (Feb 29)" variant="secondary" /> : null}
          </View>
        </View>

        {/* Countdown Hero Card */}
        <AppCard
          variant="glow"
          glowColor={theme.colors.glowAccent}
          style={styles.countdownCard}
        >
          <View style={styles.countdownRow}>
            <View style={styles.countdownIconBox}>
              <CalendarIcon size={24} color={theme.colors.accent} />
            </View>
            <View style={styles.countdownInfo}>
              <AppText variant="labelMedium" color={theme.colors.accent} weight="700">
                {birthday.countdownLabel.toUpperCase()}
              </AppText>
              <AppText variant="titleLarge" weight="700" style={styles.dateTitle}>
                {birthday.formattedBirthDate}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Age & Milestone Card */}
        <AppCard variant="elevated" style={styles.infoCard}>
          <AppText variant="labelMedium" color={theme.colors.textMuted} weight="700" style={styles.cardHeaderLabel}>
            MILESTONE & AGE
          </AppText>

          {birthday.birth_year ? (
            <View style={styles.ageDetails}>
              <AppText variant="displayLarge" weight="700" color={theme.colors.primaryLight}>
                Turning {birthday.turningAge}
              </AppText>
              <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={styles.ageSubtext}>
                Born in {birthday.birth_year} • Currently {birthday.currentAge} years old
              </AppText>
              {DateService.getDetailedAge(
                birthday.birth_year,
                birthday.birth_month,
                birthday.birth_day
              ) && (
                <View style={styles.detailedAgeBox}>
                  <AppText variant="labelSmall" color={theme.colors.accent} weight="700">
                    EXACT AGE (YEARS, MONTHS, DAYS)
                  </AppText>
                  <AppText variant="titleMedium" weight="700" color={theme.colors.text} style={styles.detailedAgeText}>
                    {
                      DateService.getDetailedAge(
                        birthday.birth_year,
                        birthday.birth_month,
                        birthday.birth_day
                      )?.formattedFull
                    }
                  </AppText>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.ageDetails}>
              <AppText variant="titleMedium" weight="600" color={theme.colors.textSecondary}>
                Age Not Displayed
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textMuted} style={styles.ageSubtext}>
                Birth year was omitted for this person. Dayora respects privacy and only tracks celebration dates.
              </AppText>
            </View>
          )}
        </AppCard>

        {/* Astrological Zodiac Card */}
        <AppCard variant="elevated" style={styles.infoCard}>
          <AppText variant="labelMedium" color={theme.colors.textMuted} weight="700" style={styles.cardHeaderLabel}>
            ZODIAC SIGN
          </AppText>

          <View style={styles.zodiacRow}>
            <AppText variant="headlineMedium" weight="700">
              {birthday.zodiacSign.symbol} {birthday.zodiacSign.name}
            </AppText>
            <Badge label={`${birthday.zodiacSign.element} Sign`} variant="secondary" />
          </View>
        </AppCard>

        {/* Notes Card (if present) */}
        {birthday.notes ? (
          <AppCard variant="elevated" style={styles.infoCard}>
            <AppText variant="labelMedium" color={theme.colors.textMuted} weight="700" style={styles.cardHeaderLabel}>
              NOTES & GIFT IDEAS
            </AppText>
            <AppText variant="bodyMedium" color={theme.colors.text} style={styles.notesText}>
              {birthday.notes}
            </AppText>
          </AppCard>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundBtn: {
    marginTop: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B0F19',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    gap: 5,
  },
  deleteChipBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  favBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
  },
  content: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarRing: {
    borderWidth: 2.5,
    borderRadius: 56,
    padding: 3,
    marginBottom: 14,
  },
  nameText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  nicknameText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  countdownCard: {
    marginTop: 16,
    marginBottom: 12,
    padding: 18,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  countdownInfo: {
    flex: 1,
  },
  dateTitle: {
    marginTop: 2,
  },
  infoCard: {
    marginTop: 12,
    padding: 16,
  },
  cardHeaderLabel: {
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  ageDetails: {
    marginTop: 2,
  },
  ageSubtext: {
    marginTop: 4,
  },
  detailedAgeBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  detailedAgeText: {
    marginTop: 4,
  },
  zodiacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  notesText: {
    lineHeight: 22,
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  editBtn: {
    minHeight: 46,
  },
  deleteBtn: {
    minHeight: 46,
  },
});
