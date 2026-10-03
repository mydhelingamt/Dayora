import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Images } from '../../assets';
import { AppText } from '../../components';
import { useTheme } from '../../theme';
import { scale } from '../../utilities/dimensions';

export interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1900,
}) => {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Responsive logo size bounded for all Android form factors (small phones, tall screens, tablets)
  const logoSize = Math.round(
    Math.min(screenWidth * 0.44, screenHeight * 0.24, scale(175))
  );

  // Animation values using native driver for fluid 60fps UI thread execution
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Elegant choreographed entrance sequence
    const animation = Animated.sequence([
      // 1. Fluid radial glow and logo spring reveal
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.85,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 42,
          useNativeDriver: true,
        }),
      ]),

      // 2. Subtle text reveal with upward translation
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 3. Settling pause
      Animated.delay(350),
    ]);

    animation.start(() => {
      onFinish?.();
    });

    const timeout = setTimeout(() => {
      onFinish?.();
    }, durationMs);

    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [durationMs, onFinish, logoScale, logoOpacity, glowOpacity, textOpacity, textTranslateY]);

  const glowSize = Math.round(logoSize * 1.35);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Ambient background glow */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: theme.colors.glowPrimary,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Main Logo Container - Centered and fitted with exact proportions */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: logoSize,
            height: logoSize,
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <Animated.Image
          source={Images.logoOptimized}
          style={[styles.logoImage, { width: logoSize, height: logoSize }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Branding typography */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <AppText
          variant="displayMedium"
          weight="700"
          color="#F1F5F9"
          align="center"
          maxFontSizeMultiplier={1.25}
        >
          Dayora
        </AppText>
        <AppText
          variant="bodyMedium"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.slogan}
          maxFontSizeMultiplier={1.25}
        >
          Organize your life, celebrate every moment
        </AppText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    alignSelf: 'center',
  },
  textContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slogan: {
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
export default SplashScreen;
