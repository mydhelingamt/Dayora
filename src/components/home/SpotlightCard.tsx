import React, { memo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../theme';
import { AppCard } from '../common/AppCard';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { Badge } from '../common/Badge';
import { AppButton } from '../common/AppButton';
import { UpcomingBirthday } from '../../repositories/birthdayRepository';
import { DateService } from '../../services/dateService';
import { Images } from '../../assets';
import { PlusIcon } from '../../assets/icons';

export interface SpotlightCardProps {
  birthday: UpcomingBirthday | null;
  onPressCard?: () => void;
  onAddBirthday: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = memo(({
  birthday,
  onPressCard,
  onAddBirthday,
}) => {
  const { theme } = useTheme();

  const getCountdownLabel = (days: number): string => {
    if (days === 0) return 'TODAY! 🎉';
    if (days === 1) return 'TOMORROW 🎂';
    return `IN ${days} DAYS`;
  };

  if (!birthday) {
    return (
      <AppCard
        variant="glow"
        glowColor={theme.colors.glowPrimary}
        style={styles.card}
      >
        <View style={styles.emptyRow}>
          <Image source={Images.logoOptimized} style={styles.emptyLogo} resizeMode="contain" />
          <View style={styles.emptyTextContainer}>
            <AppText variant="titleMedium" weight="700" numberOfLines={1}>
              Moments That Matter
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.emptySubtitle}>
              Add loved ones to see live celebration countdowns and smart reminders.
            </AppText>
          </View>
        </View>

        <AppButton
          title="Add First Birthday"
          leftIcon={<PlusIcon size={14} color={theme.colors.primaryLight} />}
          variant="outline"
          onPress={onAddBirthday}
          style={styles.emptyButton}
        />
      </AppCard>
    );
  }

  const formattedDate = DateService.formatDisplayDate(birthday.birth_date);
  const countdownLabel = getCountdownLabel(birthday.daysUntil);
  const detailedAge = DateService.getDetailedAge(
    birthday.birth_year,
    birthday.birth_month,
    birthday.birth_day
  );

  return (
    <AppCard
      variant="glow"
      glowColor={theme.colors.glowPrimary}
      style={styles.card}
      onPress={onPressCard}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <Badge label="SPOTLIGHT" variant="primary" />
          <Badge
            label={countdownLabel}
            variant="accent"
            showDot={birthday.daysUntil <= 3}
          />
        </View>
        <Badge label={birthday.relationship || 'Friend'} variant="neutral" style={styles.relationshipBadge} />
      </View>

      <View style={styles.personRow}>
        <View style={[styles.avatarRing, { borderColor: theme.colors.accent }]}>
          <AppAvatar
            name={birthday.name}
            photoUri={birthday.photo_uri}
            thumbnailUri={birthday.photo_thumbnail_uri}
            size="lg"
          />
        </View>

        <View style={styles.personDetails}>
          <AppText variant="headlineMedium" weight="700" numberOfLines={1}>
            {birthday.name}
          </AppText>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} numberOfLines={1} style={styles.turningText}>
            {birthday.turningAge != null ? `Turning ${birthday.turningAge} • ` : ''}{formattedDate}
          </AppText>
          {detailedAge && (
            <AppText variant="caption" color={theme.colors.primary} weight="600" numberOfLines={1} style={styles.detailedAgeText}>
              {detailedAge.formattedFull}
            </AppText>
          )}
        </View>
      </View>
    </AppCard>
  );
});

SpotlightCard.displayName = 'SpotlightCard';

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'nowrap',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  relationshipBadge: {
    flexShrink: 0,
    marginLeft: 6,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    borderWidth: 2,
    borderRadius: 36,
    padding: 2,
    marginRight: 14,
  },
  personDetails: {
    flex: 1,
  },
  turningText: {
    marginTop: 2,
  },
  detailedAgeText: {
    marginTop: 3,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyLogo: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  emptyTextContainer: {
    flex: 1,
  },
  emptySubtitle: {
    marginTop: 2,
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 4,
    minHeight: 40,
  },
});
