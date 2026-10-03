import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { PlusIcon } from '../../assets/icons';

export interface QuickActionButtonProps {
  type: 'birthday' | 'task';
  title: string;
  subtitle: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  type,
  title,
  subtitle,
  onPress,
  icon,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const isBirthday = type === 'birthday';

  // Purple/Violet gradient styling for Birthday; Pink/Orange/Amber gradient styling for Task
  const bgStyle = isBirthday ? styles.bgBirthday : styles.bgTask;
  const accentColor = isBirthday ? '#A78BFA' : '#FBBF24';
  const glowBorder = isBirthday
    ? { borderColor: 'rgba(167, 139, 250, 0.4)' }
    : { borderColor: 'rgba(251, 191, 36, 0.4)' };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          bgStyle,
          glowBorder,
          { borderRadius: theme.radii.lg },
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconWrapper, isBirthday ? styles.iconBirthday : styles.iconTask]}>
            {icon || <PlusIcon size={16} color={accentColor} />}
          </View>
          <View style={styles.arrowPill}>
            <PlusIcon size={12} color={accentColor} />
          </View>
        </View>

        <AppText variant="titleSmall" weight="700" color="#FFFFFF" numberOfLines={1} style={styles.titleText}>
          {title}
        </AppText>
        <AppText variant="caption" color="rgba(255, 255, 255, 0.75)" numberOfLines={1}>
          {subtitle}
        </AppText>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    padding: 14,
    minHeight: 104,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  bgBirthday: {
    // Rich Dark Navy/Violet gradient simulation
    backgroundColor: '#1E1B4B',
  },
  bgTask: {
    // Rich Dark Navy/Amber gradient simulation
    backgroundColor: '#3B1828',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBirthday: {
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
  },
  iconTask: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  arrowPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    marginBottom: 2,
  },
});
