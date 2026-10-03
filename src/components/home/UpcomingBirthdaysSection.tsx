import React, { memo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { SectionHeader } from '../common/SectionHeader';
import { AppCard } from '../common/AppCard';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';
import { AppButton } from '../common/AppButton';
import { Badge } from '../common/Badge';
import { UpcomingBirthday } from '../../repositories/birthdayRepository';
import { DateService } from '../../services/dateService';
import { BirthdayIcon, PlusIcon } from '../../assets/icons';

export interface UpcomingBirthdaysSectionProps {
  birthdays: UpcomingBirthday[];
  onSeeAll: () => void;
  onAddBirthday: () => void;
  onSelectBirthday?: (b: UpcomingBirthday) => void;
}

export const UpcomingBirthdaysSection: React.FC<UpcomingBirthdaysSectionProps> = memo(({
  birthdays,
  onSeeAll,
  onAddBirthday,
  onSelectBirthday,
}) => {
  const { theme } = useTheme();

  const getCountdownString = (days: number): string => {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days}d left`;
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Upcoming Birthdays"
        badge={birthdays.length > 0 ? <Badge label={`${birthdays.length}`} variant="accent" /> : undefined}
        actionText="See All"
        onAction={onSeeAll}
      />

      {birthdays.length === 0 ? (
        <AppCard variant="subtle" style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <BirthdayIcon size={24} color={theme.colors.accent} />
          </View>
          <AppText variant="titleSmall" weight="700" style={styles.emptyTitle}>
            No Upcoming Birthdays
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.emptySubtitle}>
            Keep track of special dates and receive gentle countdown reminders.
          </AppText>
          <AppButton
            title="Add Birthday"
            leftIcon={<PlusIcon size={14} color={theme.colors.accent} />}
            variant="outline"
            size="sm"
            onPress={onAddBirthday}
            style={styles.emptyBtn}
          />
        </AppCard>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {birthdays.map((item) => {
            const formattedDate = DateService.formatDisplayDate(item.birth_date);
            const isUrgent = item.daysUntil <= 3;
            const detailedAge = DateService.getDetailedAge(
              item.birth_year,
              item.birth_month,
              item.birth_day
            );

            return (
              <AppCard
                key={item.id}
                variant="elevated"
                style={styles.horizontalCard}
                onPress={() => onSelectBirthday?.(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarRing, { borderColor: theme.colors.accent }]}>
                    <AppAvatar
                      name={item.name}
                      photoUri={item.photo_uri}
                      thumbnailUri={item.photo_thumbnail_uri}
                      size="sm"
                    />
                  </View>
                  <Badge
                    label={getCountdownString(item.daysUntil)}
                    variant={isUrgent ? 'accent' : 'neutral'}
                    showDot={isUrgent}
                  />
                </View>

                <View style={styles.cardBody}>
                  <AppText variant="titleSmall" weight="700" numberOfLines={1} style={styles.personName}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1} style={styles.relationText}>
                    {item.relationship || 'Friend'}{item.turningAge != null ? ` • Turning ${item.turningAge}` : ''}
                  </AppText>
                  {detailedAge ? (
                    <AppText variant="caption" color={theme.colors.primary} weight="600" numberOfLines={1} style={styles.detailedAgeShort}>
                      {detailedAge.formattedShort}
                    </AppText>
                  ) : (
                    <AppText variant="caption" color={theme.colors.textMuted} numberOfLines={1} style={styles.dateText}>
                      {formattedDate}
                    </AppText>
                  )}
                </View>
              </AppCard>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

UpcomingBirthdaysSection.displayName = 'UpcomingBirthdaysSection';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  horizontalList: {
    gap: 10,
    paddingRight: 8,
    paddingBottom: 4,
  },
  horizontalCard: {
    width: 145,
    padding: 12,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarRing: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 1.5,
  },
  cardBody: {
    gap: 1,
  },
  personName: {
    marginTop: 2,
    fontSize: 14,
  },
  relationText: {
    marginTop: 1,
    fontSize: 11,
  },
  detailedAgeShort: {
    marginTop: 3,
    fontSize: 11,
  },
  dateText: {
    marginTop: 3,
    fontSize: 11,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  emptyBtn: {
    minHeight: 38,
    paddingHorizontal: 18,
  },
});
