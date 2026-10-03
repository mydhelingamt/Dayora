import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Share,
  ScrollView,
} from 'react-native';
import { ScreenContainer, AppCard, AppText, AppButton } from '../../components';
import { useTheme } from '../../theme';
import { HeartIcon } from '../../assets/icons';

export interface BirthdayCelebrationProps {
  navigation: any;
  route: {
    params: {
      birthdayId?: string;
      name: string;
      turningAge?: number | null;
      relationship?: string;
      photoUri?: string | null;
      message?: string;
    };
  };
}

export const BirthdayCelebrationScreen: React.FC<BirthdayCelebrationProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const {
    birthdayId,
    name = 'Friend',
    turningAge = null,
    relationship = 'Friend',
    photoUri = null,
    message,
  } = route.params || {};

  // Lightweight native-driven floating animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth floating balloon loops
    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 12,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle scale pulse on avatar ring
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    pulseLoop.start();

    return () => {
      loop1.stop();
      loop2.stop();
      pulseLoop.stop();
    };
  }, [floatAnim1, floatAnim2, pulseAnim]);

  const handleSendWishes = async () => {
    try {
      const shareMessage =
        turningAge !== null
          ? `Happy ${turningAge}${getOrdinalSuffix(turningAge)} Birthday, ${name}! 🎂 Wishing you a year full of joy, good health, and wonderful adventures!`
          : `Happy Birthday, ${name}! 🎂 Wishing you a fabulous day filled with love and laughter!`;

      await Share.share({
        message: shareMessage,
        title: `Happy Birthday ${name}!`,
      });
    } catch {
      // User cancelled or dismissed
    }
  };

  const handleViewProfile = () => {
    if (birthdayId) {
      navigation.navigate('BirthdayDetail', { birthdayId });
    } else {
      navigation.goBack();
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <ScreenContainer>
      {/* Decorative Floating Balloons (Zero Asset Bloat) */}
      <Animated.View
        style={[
          styles.balloon,
          styles.balloonLeft,
          styles.balloonPurple,
          { transform: [{ translateY: floatAnim1 }, { rotate: '-8deg' }] },
        ]}
      />
      <Animated.View
        style={[
          styles.balloon,
          styles.balloonRight,
          styles.balloonPink,
          { transform: [{ translateY: floatAnim2 }, { rotate: '12deg' }] },
        ]}
      />
      <Animated.View
        style={[
          styles.balloon,
          styles.balloonCenter,
          styles.balloonBlue,
          { transform: [{ translateY: floatAnim1 }, { rotate: '5deg' }] },
        ]}
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Top Dismiss Action */}
        <View style={styles.topBar}>
          <AppButton
            title="Done"
            variant="ghost"
            size="sm"
            onPress={() => navigation.goBack()}
          />
        </View>

        {/* Celebratory Hero Avatar with Glowing Ring */}
        <View style={styles.avatarWrapper}>
          <Animated.View
            style={[
              styles.avatarGlowRing,
              {
                borderColor: theme.colors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
              <AppText variant="displaySmall" weight="800" color={theme.colors.primary}>
                {name.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
          )}
          <View style={styles.starBadge}>
            <HeartIcon size={16} color="#F43F5E" filled />
          </View>
        </View>

        {/* Milestone Tag */}
        {turningAge !== null ? (
          <View style={[styles.milestoneBadge, styles.milestonePurple]}>
            <AppText variant="labelMedium" weight="800" color="#C084FC">
              {`🎉 CELEBRATING THEIR ${turningAge}${getOrdinalSuffix(turningAge).toUpperCase()} BIRTHDAY!`}
            </AppText>
          </View>
        ) : (
          <View style={[styles.milestoneBadge, styles.milestoneBlue]}>
            <AppText variant="labelMedium" weight="800" color="#60A5FA">
              🎉 TODAY IS THEIR SPECIAL DAY!
            </AppText>
          </View>
        )}

        {/* Person Name & Relationship */}
        <AppText variant="headlineLarge" weight="800" style={styles.nameText}>
          Happy Birthday, {name}!
        </AppText>

        <View style={styles.relationshipPill}>
          <AppText variant="labelSmall" weight="700" color={theme.colors.textSecondary}>
            {relationship.toUpperCase()}
          </AppText>
        </View>

        {/* Warm Greeting Message Card */}
        <AppCard variant="elevated" style={styles.messageCard}>
          <AppText variant="titleMedium" weight="700" style={styles.messageTitle}>
            Warm Birthday Wishes ✨
          </AppText>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={styles.messageBody}>
            {message ||
              `Wishing ${name} a magnificent birthday full of sweet celebrations, joy, laughter, and an extraordinary year ahead!`}
          </AppText>
        </AppCard>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AppButton
            title="Send Wishes 💬"
            size="lg"
            onPress={handleSendWishes}
            style={styles.actionBtn}
          />

          {birthdayId ? (
            <AppButton
              title="View Profile Details"
              variant="outline"
              size="lg"
              onPress={handleViewProfile}
              style={styles.actionBtn}
            />
          ) : null}

          <AppButton
            title="Back to Dayora"
            variant="ghost"
            size="md"
            onPress={() => navigation.goBack()}
            style={styles.dismissBtn}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 10,
  },
  balloon: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.15,
  },
  balloonLeft: {
    width: 90,
    height: 120,
    top: 60,
    left: -20,
  },
  balloonRight: {
    width: 80,
    height: 110,
    top: 140,
    right: -15,
  },
  balloonCenter: {
    width: 60,
    height: 80,
    bottom: 180,
    left: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    opacity: 0.6,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadge: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    backgroundColor: '#1E293B',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  milestoneBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  nameText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  relationshipPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
  },
  messageCard: {
    width: '100%',
    padding: 22,
    borderRadius: 20,
    marginBottom: 28,
  },
  messageTitle: {
    marginBottom: 8,
  },
  messageBody: {
    lineHeight: 22,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    width: '100%',
  },
  dismissBtn: {
    marginTop: 4,
  },
  balloonPurple: {
    backgroundColor: '#A855F7',
  },
  balloonPink: {
    backgroundColor: '#EC4899',
  },
  balloonBlue: {
    backgroundColor: '#3B82F6',
  },
  milestonePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#A855F7',
  },
  milestoneBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: '#3B82F6',
  },
});
