import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  ListRenderItemInfo,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { AppCard } from '../../components/common/AppCard';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { AppAvatar } from '../../components/common/AppAvatar';
import { Badge } from '../../components/common/Badge';
import { useTheme } from '../../theme';
import { HomeTabScreenProps } from '../../navigation/types';
import { databaseClient } from '../../database';
import {
  BirthdayRepository,
  UpcomingBirthday,
  BirthdayStats,
  sortBirthdaysAlphabeticalWithFavorites,
} from '../../repositories/birthdayRepository';
import { SearchIcon, PlusIcon, HeartIcon, BirthdayIcon } from '../../assets/icons';

type FilterKey = 'all' | 'upcoming' | 'month' | 'favorites';

export const BirthdaysScreen: React.FC<HomeTabScreenProps<'Birthdays'>> = ({ navigation }) => {
  const { theme } = useTheme();
  const repo = useMemo(() => new BirthdayRepository(databaseClient), []);

  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [stats, setStats] = useState<BirthdayStats>({
    totalActive: 0,
    next30DaysCount: 0,
    thisMonthCount: 0,
    favoriteCount: 0,
    nearestBirthday: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [items, currentStats] = await Promise.all([
        repo.findAllWithOptions({
          filter: selectedFilter,
          search: searchQuery,
        }),
        repo.getBirthdayStats(),
      ]);

      setBirthdays(items);
      setStats(currentStats);
    } catch {
      // Handled cleanly
    } finally {
      setIsRefreshing(false);
    }
  }, [repo, selectedFilter, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleToggleFavorite = useCallback(
    async (item: UpcomingBirthday) => {
      const newFav = Number(item.is_favorite) === 1 ? 0 : 1;
      // Optimistic update with alphabetical + favorites sorting
      setBirthdays((prev) => {
        let updated = prev.map((b) => (b.id === item.id ? { ...b, is_favorite: newFav } : b));
        if (selectedFilter === 'favorites' && newFav === 0) {
          updated = updated.filter((b) => b.id !== item.id);
        }
        return sortBirthdaysAlphabeticalWithFavorites(updated);
      });
      setStats((prev) => ({
        ...prev,
        favoriteCount: newFav === 1 ? prev.favoriteCount + 1 : Math.max(0, prev.favoriteCount - 1),
      }));

      try {
        await repo.toggleFavorite(item.id, newFav === 1);
      } catch {
        loadData();
      }
    },
    [repo, loadData, selectedFilter]
  );

  const filters: Array<{ key: FilterKey; label: string }> = useMemo(
    () => [
      { key: 'all', label: `All (${stats.totalActive})` },
      { key: 'upcoming', label: `Next 30 Days (${stats.next30DaysCount})` },
      { key: 'month', label: `This Month (${stats.thisMonthCount})` },
      { key: 'favorites', label: `Favorites (${stats.favoriteCount})` },
    ],
    [stats.totalActive, stats.next30DaysCount, stats.thisMonthCount, stats.favoriteCount]
  );

  const renderBirthdayItem = useCallback(
    ({ item, index }: ListRenderItemInfo<UpcomingBirthday>) => {
      const isFav = Number(item.is_favorite) === 1;
      const prevItem = index > 0 ? birthdays[index - 1] : null;
      const prevIsFav = prevItem ? Number(prevItem.is_favorite) === 1 : false;

      // Show "FAVORITES" section header before the first favorite when non-favorites also exist
      const showFavoritesHeader =
        isFav && index === 0 && selectedFilter !== 'favorites' && birthdays.some((b) => Number(b.is_favorite) === 0);

      // Show "ALL BIRTHDAYS" section header before the first non-favorite when preceded by favorites
      const showOtherHeader = !isFav && prevIsFav;

      return (
        <View key={item.id}>
          {showFavoritesHeader ? (
            <View style={styles.sectionHeader}>
              <HeartIcon size={14} color="#F43F5E" filled />
              <AppText variant="labelSmall" weight="700" color={theme.colors.textSecondary} numberOfLines={1} style={styles.sectionHeaderText}>
                FAVORITES
              </AppText>
            </View>
          ) : null}

          {showOtherHeader ? (
            <View style={[styles.sectionHeader, { marginTop: theme.spacing.md }]}>
              <AppText variant="labelSmall" weight="700" color={theme.colors.textSecondary} numberOfLines={1} style={styles.sectionHeaderText}>
                ALL BIRTHDAYS (A–Z)
              </AppText>
            </View>
          ) : null}

          <AppCard
            variant="elevated"
            accessibilityRole="button"
            accessibilityLabel={`Birthday item ${item.name}`}
            style={styles.itemCard}
            onPress={() => navigation.navigate('BirthdayDetail', { birthdayId: item.id })}
          >
            <View style={styles.itemRow}>
              {/* Avatar */}
              <AppAvatar
                name={item.name}
                photoUri={item.photo_uri}
                thumbnailUri={item.photo_thumbnail_uri}
                size="md"
              />

              {/* Content Details */}
              <View style={styles.itemDetails}>
                <View style={styles.nameRow}>
                  <AppText variant="bodyLarge" weight="600" numberOfLines={1} style={styles.itemName}>
                    {item.name}
                  </AppText>
                  {item.nickname ? (
                    <AppText variant="caption" color={theme.colors.accent} weight="500" numberOfLines={1} style={styles.itemNickname}>
                      ({item.nickname})
                    </AppText>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1} style={styles.metaDateText}>
                    {item.shortBirthDate}
                  </AppText>

                  {/* Only display turning age if birth_year was provided! */}
                  {item.turningAge != null ? (
                    <AppText variant="bodySmall" color={theme.colors.textMuted} numberOfLines={1} style={styles.dotSeparator}>
                      • Turning {item.turningAge}
                    </AppText>
                  ) : null}

                  {item.relationship ? (
                    <Badge
                      label={item.relationship}
                      variant="neutral"
                      style={styles.relationshipBadge}
                    />
                  ) : null}
                </View>
              </View>

              {/* Countdown & Favorite Actions */}
              <View style={styles.itemActions}>
                <Badge
                  label={item.countdownLabel}
                  variant={item.daysUntil <= 3 ? 'accent' : 'secondary'}
                  style={styles.countdownBadge}
                />

                <Pressable
                  onPress={() => handleToggleFavorite(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={isFav ? 'Unfavorite' : 'Favorite'}
                  style={styles.starPressable}
                >
                  <HeartIcon size={16} color={isFav ? '#F43F5E' : theme.colors.textMuted} filled={isFav} />
                </Pressable>
              </View>
            </View>
          </AppCard>
        </View>
      );
    },
    [theme, navigation, handleToggleFavorite, birthdays, selectedFilter]
  );

  const nearest = stats.nearestBirthday;

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* Search Input */}
        <AppInput
          placeholder="Search by name or nickname..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearable
          onClear={() => setSearchQuery('')}
          prefixIcon={<SearchIcon size={18} color={theme.colors.textMuted} />}
          containerStyle={styles.searchContainer}
        />

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterContainer}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radii.full,
                  },
                ]}
              >
                <AppText
                  variant="labelMedium"
                  color={isSelected ? theme.colors.textInverse : theme.colors.textSecondary}
                  weight={isSelected ? '700' : '500'}
                  numberOfLines={1}
                >
                  {filter.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Nearest Celebration Hero Card (when not searching and when filter is 'all' or 'upcoming') */}
        {!searchQuery && (selectedFilter === 'all' || selectedFilter === 'upcoming') && nearest ? (
          <AppCard
            variant="glow"
            glowColor={theme.colors.glowAccent}
            style={styles.heroCard}
            onPress={() => navigation.navigate('BirthdayDetail', { birthdayId: nearest.id })}
          >
            <View style={styles.heroRow}>
              <View style={[styles.avatarGlowWrapper, { borderColor: theme.colors.accent }]}>
                <AppAvatar
                  name={nearest.name}
                  photoUri={nearest.photo_uri}
                  thumbnailUri={nearest.photo_thumbnail_uri}
                  size="lg"
                />
              </View>
              <View style={styles.heroInfo}>
                <View style={styles.heroBadgeRow}>
                  <Badge label="Next Celebration" variant="accent" showDot />
                  <AppText variant="caption" color={theme.colors.accent} weight="700">
                    {nearest.countdownLabel}
                  </AppText>
                </View>
                <AppText variant="headlineSmall" weight="700" numberOfLines={1} style={styles.heroName}>
                  {nearest.name}
                </AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.heroDate}>
                  {nearest.formattedBirthDate}
                  {nearest.turningAge != null ? ` • Turning ${nearest.turningAge}` : ''}
                </AppText>
              </View>
            </View>
          </AppCard>
        ) : null}
      </View>
    ),
    [searchQuery, selectedFilter, filters, nearest, theme, navigation]
  );

  const ListEmptyComponent = useMemo(
    () => (
      <AppCard variant="subtle" style={styles.emptyCard}>
        <View style={styles.emptyIconBox}>
          <BirthdayIcon size={24} color={theme.colors.accent} />
        </View>
        <AppText variant="titleSmall" weight="700" style={styles.emptyTitle}>
          {searchQuery
            ? `No birthdays found for "${searchQuery}"`
            : selectedFilter === 'favorites'
            ? 'No Favorite Birthdays'
            : selectedFilter === 'month'
            ? 'No Birthdays This Month'
            : 'No Birthdays Added Yet'}
        </AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.emptySubtitle}>
          {searchQuery
            ? 'Try checking for a typo or clearing your search filters.'
            : 'Add friends, family, and loved ones to track milestones and receive countdown alerts.'}
        </AppText>
        <AppButton
          title="+ Add Birthday"
          variant="outline"
          size="sm"
          onPress={() => navigation.navigate('AddEditBirthday', {})}
          style={styles.emptyBtn}
        />
      </AppCard>
    ),
    [searchQuery, selectedFilter, theme, navigation]
  );

  return (
    <ScreenContainer>
      <Header
        title="Birthdays"
        subtitle="Celebrate milestones & never miss a date"
        rightAction={
          <AppButton
            title="Add"
            size="sm"
            variant="primary"
            onPress={() => navigation.navigate('AddEditBirthday', {})}
            leftIcon={<PlusIcon size={14} color="#FFFFFF" />}
          />
        }
      />

      <FlatList
        data={birthdays}
        keyExtractor={(item) => item.id}
        renderItem={renderBirthdayItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    marginBottom: 12,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroCard: {
    padding: 16,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlowWrapper: {
    borderWidth: 2,
    borderRadius: 36,
    padding: 2,
    marginRight: 14,
  },
  heroInfo: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    marginTop: 2,
    flexShrink: 1,
  },
  heroDate: {
    marginTop: 2,
  },
  itemCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  itemName: {
    marginRight: 6,
    flexShrink: 1,
  },
  itemNickname: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    marginTop: 3,
    gap: 4,
  },
  metaDateText: {
    flexShrink: 0,
  },
  dotSeparator: {
    marginLeft: 2,
    flexShrink: 1,
  },
  relationshipBadge: {
    marginLeft: 4,
    flexShrink: 1,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
    gap: 6,
  },
  countdownBadge: {},
  starPressable: {
    padding: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 12,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderText: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
