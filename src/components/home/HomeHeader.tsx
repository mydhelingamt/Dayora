import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { AppAvatar } from '../common/AppAvatar';

export interface HomeHeaderProps {
  userName?: string | null;
  photoUri?: string | null;
  thumbnailUri?: string | null;
  onAvatarPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = memo(({
  userName,
  photoUri,
  thumbnailUri,
  onAvatarPress,
}) => {
  const { theme } = useTheme();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = (): string => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  };

  const displayName = userName && userName.trim() ? userName.trim() : 'Friend';

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <AppText variant="labelMedium" color={theme.colors.accent} weight="700" numberOfLines={1} style={styles.dateText}>
          {getFormattedDate().toUpperCase()}
        </AppText>
        <AppText variant="headlineLarge" weight="700" numberOfLines={1}>
          {getGreeting()}, {displayName}
        </AppText>
      </View>

      <Pressable
        onPress={onAvatarPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="View Profile"
        style={styles.avatarPressable}
      >
        <AppAvatar
          name={displayName}
          photoUri={photoUri}
          thumbnailUri={thumbnailUri}
          size="md"
          ringColor={theme.colors.primaryLight}
        />
      </Pressable>
    </View>
  );
});

HomeHeader.displayName = 'HomeHeader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 14,
  },
  dateText: {
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  avatarPressable: {
    borderRadius: 24,
  },
});
