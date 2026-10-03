import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { ScreenContainer, AppCard, AppText, AppButton } from '../../components';
import { useTheme } from '../../theme';
import { notificationService } from '../../notifications/notificationService';
import { MusicIcon, MusicOffIcon, HeartIcon } from '../../assets/icons';

export interface UserBirthdayCelebrationProps {
  navigation: any;
  route: {
    params?: {
      name?: string;
      age?: number | null;
      photoUri?: string | null;
    };
  };
}

export const UserBirthdayCelebrationScreen: React.FC<UserBirthdayCelebrationProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const {
    name = 'You',
    age = null,
    photoUri = null,
  } = route.params || {};

  // Countdown states: 3 -> 2 -> 1 -> 'WISH' -> 'CELEBRATE'
  const [countdownStep, setCountdownStep] = useState<number | 'WISH' | 'DONE'>(3);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [candlesBlownOut, setCandlesBlownOut] = useState(false);

  // Animation values
  const countdownScale = useRef(new Animated.Value(0.4)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  // Candle flame flicker animations
  const flameAnim1 = useRef(new Animated.Value(1)).current;
  const flameAnim2 = useRef(new Animated.Value(1)).current;
  const flameAnim3 = useRef(new Animated.Value(1)).current;
  const flameScale = useRef(new Animated.Value(1)).current;

  // Background floating balloons
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // 1. Run Countdown sequence on mount
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const animateStep = () => {
      countdownScale.setValue(0.5);
      countdownOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(countdownScale, {
          toValue: 1.2,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(countdownOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (countdownStep === 3) {
      animateStep();
      timer = setTimeout(() => setCountdownStep(2), 1100);
    } else if (countdownStep === 2) {
      animateStep();
      timer = setTimeout(() => setCountdownStep(1), 1100);
    } else if (countdownStep === 1) {
      animateStep();
      timer = setTimeout(() => setCountdownStep('WISH'), 1100);
    } else if (countdownStep === 'WISH') {
      animateStep();
      timer = setTimeout(() => {
        setCountdownStep('DONE');
        // Play melodic Happy Birthday music box tune!
        notificationService.playBirthdayTune();
      }, 1300);
    }

    return () => clearTimeout(timer);
  }, [countdownStep, countdownScale, countdownOpacity]);

  // 2. Candle flame flicker animation loop
  useEffect(() => {
    if (countdownStep !== 'DONE' || candlesBlownOut) return;

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim1, { toValue: 1.3, duration: 250, useNativeDriver: true }),
        Animated.timing(flameAnim1, { toValue: 0.85, duration: 300, useNativeDriver: true }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim2, { toValue: 0.8, duration: 280, useNativeDriver: true }),
        Animated.timing(flameAnim2, { toValue: 1.25, duration: 260, useNativeDriver: true }),
      ])
    );

    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim3, { toValue: 1.2, duration: 320, useNativeDriver: true }),
        Animated.timing(flameAnim3, { toValue: 0.9, duration: 240, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [countdownStep, candlesBlownOut, flameAnim1, flameAnim2, flameAnim3]);

  // 3. Floating balloons in background
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: -20, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );
    const floatLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 18, duration: 3200, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ])
    );

    floatLoop.start();
    floatLoop2.start();

    return () => {
      floatLoop.stop();
      floatLoop2.stop();
    };
  }, [floatAnim1, floatAnim2]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      notificationService.stopBirthdayTune();
    };
  }, []);

  const handleToggleMusic = async () => {
    if (isMusicPlaying) {
      await notificationService.stopBirthdayTune();
      setIsMusicPlaying(false);
    } else {
      await notificationService.playBirthdayTune();
      setIsMusicPlaying(true);
    }
  };

  const handleBlowOutCandles = () => {
    if (candlesBlownOut) return;
    Animated.timing(flameScale, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setCandlesBlownOut(true);
    });
  };

  const handleClose = async () => {
    await notificationService.stopBirthdayTune();
    navigation.goBack();
  };

  // Phase 1: 3-2-1 Countdown Stage
  if (countdownStep !== 'DONE') {
    return (
      <ScreenContainer style={styles.countdownContainer}>
        {/* Skip Countdown action */}
        <View style={styles.skipRow}>
          <AppButton
            title="Skip"
            variant="ghost"
            size="sm"
            onPress={() => {
              setCountdownStep('DONE');
              notificationService.playBirthdayTune();
            }}
          />
        </View>

        <View style={styles.countdownCenter}>
          <Animated.View
            style={[
              styles.countdownNumberWrapper,
              {
                transform: [{ scale: countdownScale }],
                opacity: countdownOpacity,
              },
            ]}
          >
            {typeof countdownStep === 'number' ? (
              <AppText variant="displayLarge" weight="900" color="#F59E0B" style={styles.hugeCountdownNumber}>
                {countdownStep}
              </AppText>
            ) : (
              <AppText variant="headlineLarge" weight="900" color="#EC4899" style={styles.wishText}>
                MAKE A WISH! 🌟
              </AppText>
            )}
          </Animated.View>

          <AppText variant="bodyLarge" weight="600" color={theme.colors.textSecondary} style={styles.countdownSubtitle}>
            Get ready for your special Dayora celebration...
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  // Phase 2: Full-Screen Celebration Stage
  return (
    <ScreenContainer>
      {/* Floating Decorative Balloons */}
      <Animated.View
        style={[
          styles.balloon,
          styles.balloon1,
          { transform: [{ translateY: floatAnim1 }, { rotate: '-10deg' }] },
        ]}
      />
      <Animated.View
        style={[
          styles.balloon,
          styles.balloon2,
          { transform: [{ translateY: floatAnim2 }, { rotate: '14deg' }] },
        ]}
      />

      {/* Header bar: Music Toggle and Close */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleToggleMusic} style={styles.musicButton} accessibilityLabel="Toggle Music">
          {isMusicPlaying ? (
            <MusicIcon size={20} color="#F59E0B" />
          ) : (
            <MusicOffIcon size={20} color={theme.colors.textSecondary} />
          )}
          <AppText variant="labelSmall" weight="700" color={isMusicPlaying ? '#F59E0B' : theme.colors.textSecondary}>
            {isMusicPlaying ? 'Music On' : 'Muted'}
          </AppText>
        </Pressable>

        <AppButton title="✕" variant="ghost" size="sm" onPress={handleClose} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Avatar with Golden Glow Ring */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing} />
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AppText variant="displaySmall" weight="800" color="#FFFFFF">
                {name.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
          )}
          <View style={styles.starBadge}>
            <HeartIcon size={18} color="#F43F5E" filled />
          </View>
        </View>

        {/* Milestone Banner */}
        <View style={styles.celebrationBanner}>
          <AppText variant="labelMedium" weight="800" color="#F59E0B">
            ✨ TODAY IS YOUR SPECIAL DAY! ✨
          </AppText>
        </View>

        <AppText variant="headlineLarge" weight="900" style={styles.celebrationTitle}>
          {`Happy Birthday, ${name}!`}
        </AppText>

        {age !== null ? (
          <AppText variant="titleMedium" color={theme.colors.secondary} weight="700" style={styles.ageSubtitle}>
            {`Cheers to turning ${age} and shining brighter than ever! 🥂`}
          </AppText>
        ) : (
          <AppText variant="titleMedium" color={theme.colors.secondary} weight="700" style={styles.ageSubtitle}>
            Here is to another spectacular year of life and joy! 🥂
          </AppText>
        )}

        {/* Interactive Birthday Cake with Lit Candles */}
        <Pressable
          onPress={handleBlowOutCandles}
          style={styles.cakeContainer}
          accessibilityLabel="Birthday Cake. Tap to blow out candles."
        >
          {/* Candle Sticks & Flames */}
          <View style={styles.candlesRow}>
            {/* Candle 1 */}
            <View style={styles.singleCandle}>
              <Animated.View
                style={[
                  styles.flame,
                  { transform: [{ scale: flameScale }, { scaleY: flameAnim1 }] },
                  candlesBlownOut && styles.flameExtinguished,
                ]}
              />
              <View style={[styles.candleStick, styles.candlePink]} />
            </View>

            {/* Candle 2 (Center) */}
            <View style={styles.singleCandle}>
              <Animated.View
                style={[
                  styles.flame,
                  { transform: [{ scale: flameScale }, { scaleY: flameAnim2 }] },
                  candlesBlownOut && styles.flameExtinguished,
                ]}
              />
              <View style={[styles.candleStick, styles.candleYellow]} />
            </View>

            {/* Candle 3 */}
            <View style={styles.singleCandle}>
              <Animated.View
                style={[
                  styles.flame,
                  { transform: [{ scale: flameScale }, { scaleY: flameAnim3 }] },
                  candlesBlownOut && styles.flameExtinguished,
                ]}
              />
              <View style={[styles.candleStick, styles.candleBlue]} />
            </View>
          </View>

          {/* Cake Top Tier */}
          <View style={styles.cakeTierTop}>
            <View style={styles.frostingDrip} />
            <View style={[styles.frostingDrip, styles.frostingDrip2]} />
            <View style={[styles.frostingDrip, styles.frostingDrip3]} />
          </View>

          {/* Cake Bottom Tier */}
          <View style={styles.cakeTierBottom}>
            <View style={styles.cakeCreamStripe} />
          </View>

          {/* Cake Plate */}
          <View style={styles.cakePlate} />
        </Pressable>

        {/* Interactive Prompt or Wish Fulfilled Card */}
        {!candlesBlownOut ? (
          <AppCard variant="subtle" style={styles.interactionPromptCard}>
            <AppText variant="labelMedium" weight="700" color="#F59E0B" style={styles.promptText}>
              💨 Tap the cake to blow out your candles!
            </AppText>
          </AppCard>
        ) : (
          <AppCard variant="elevated" style={styles.wishCard}>
            <AppText variant="titleMedium" weight="800" color="#10B981" style={styles.wishCardTitle}>
              🎉 Wish Granted!
            </AppText>
            <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={styles.wishCardBody}>
              May all your dreams blossom into reality. The entire Dayora journey is dedicated to celebrating your moments!
            </AppText>
          </AppCard>
        )}

        {/* Bottom Action */}
        <AppButton
          title="Continue to Dayora 🚀"
          size="lg"
          onPress={handleClose}
          style={styles.continueBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  countdownCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  countdownNumberWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  hugeCountdownNumber: {
    fontSize: 120,
    lineHeight: 130,
  },
  wishText: {
    fontSize: 34,
    textAlign: 'center',
  },
  countdownSubtitle: {
    textAlign: 'center',
    marginTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
  },
  musicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  balloon: {
    position: 'absolute',
    borderRadius: 60,
    opacity: 0.12,
  },
  balloon1: {
    width: 100,
    height: 130,
    backgroundColor: '#EC4899',
    top: 50,
    left: -20,
  },
  balloon2: {
    width: 90,
    height: 120,
    backgroundColor: '#F59E0B',
    top: 130,
    right: -20,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 6,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  avatarPhoto: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  starBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E293B',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  celebrationBanner: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    marginBottom: 10,
  },
  celebrationTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  ageSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  cakeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    padding: 10,
  },
  candlesRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: -2,
    zIndex: 2,
  },
  singleCandle: {
    alignItems: 'center',
  },
  flame: {
    width: 12,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginBottom: 2,
  },
  flameExtinguished: {
    opacity: 0,
  },
  candleStick: {
    width: 6,
    height: 28,
    borderRadius: 3,
  },
  candlePink: {
    backgroundColor: '#EC4899',
  },
  candleYellow: {
    backgroundColor: '#F59E0B',
  },
  candleBlue: {
    backgroundColor: '#3B82F6',
  },
  cakeTierTop: {
    width: 120,
    height: 50,
    backgroundColor: '#7C3AED',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  frostingDrip: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: 12,
    backgroundColor: '#C084FC',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  frostingDrip2: {
    left: 40,
  },
  frostingDrip3: {
    left: 80,
  },
  cakeTierBottom: {
    width: 170,
    height: 60,
    backgroundColor: '#6D28D9',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginTop: -2,
    justifyContent: 'center',
  },
  cakeCreamStripe: {
    width: '100%',
    height: 8,
    backgroundColor: '#F472B6',
    opacity: 0.8,
  },
  cakePlate: {
    width: 200,
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    marginTop: -2,
  },
  interactionPromptCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  promptText: {
    textAlign: 'center',
  },
  wishCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  wishCardTitle: {
    marginBottom: 6,
  },
  wishCardBody: {
    textAlign: 'center',
    lineHeight: 22,
  },
  continueBtn: {
    width: '100%',
  },
});
