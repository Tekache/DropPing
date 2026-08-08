import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(0.8)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const ringAnim = (
      scale: Animated.Value,
      opacity: Animated.Value,
      delay: number
    ) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.5,
              duration: 2200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    ringAnim(ring1Scale, ring1Opacity, 300);
    ringAnim(ring2Scale, ring2Opacity, 900);
    ringAnim(ring3Scale, ring3Opacity, 1500);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => navigation.replace('Main'));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity }]} />

      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring3, { transform: [{ scale: ring3Scale }], opacity: ring3Opacity }]} />

        <View style={styles.logoBox}>
          <View style={styles.waveContainer}>
            <Svg width="220" height="50" viewBox="0 0 440 80">
              <Path
                d="M0 35 Q27 15 55 35 Q82 55 110 35 Q137 15 165 35 Q192 55 220 35 Q247 15 275 35 Q302 55 330 35 Q357 15 385 35 Q412 55 440 35 L440 80 L0 80Z"
                fill="rgba(0,87,255,0.2)"
              />
              <Path
                d="M0 48 Q27 28 55 48 Q82 68 110 48 Q137 28 165 48 Q192 68 220 48 Q247 28 275 48 Q302 68 330 48 Q357 28 385 48 Q412 68 440 48 L440 80 L0 80Z"
                fill="rgba(0,229,255,0.1)"
              />
            </Svg>
          </View>

          <Svg width={100} height={100} viewBox="0 0 95 95" fill="none">
            <Defs>
              <LinearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="45%" stopColor="#00E5FF" />
                <Stop offset="100%" stopColor="#0057FF" />
              </LinearGradient>
              <LinearGradient id="sg3" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="#00E5FF" />
              </LinearGradient>
              <LinearGradient id="sg4" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#0057FF" stopOpacity="0" />
                <Stop offset="30%" stopColor="#00E5FF" />
                <Stop offset="70%" stopColor="#0057FF" />
                <Stop offset="100%" stopColor="#0057FF" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            <Path
              d="M17 16 L17 80 Q17 84 21 84 L31 84 Q35 84 35 80 L35 60 Q46 65 55 61 Q73 54 74 38 Q75 18 58 12 Q48 8 36 9 Q25 9 20 11 Z"
              fill="url(#sg1)"
            />
            <Path
              d="M35 17 L35 52 Q43 57 52 53 Q65 47 65 36 Q65 22 52 18 Q43 14 35 17 Z"
              fill="#050B1A"
              opacity="0.9"
            />
            <Path
              d="M8 72 Q20 62 32 72 Q44 82 56 72 Q66 64 80 70"
              stroke="url(#sg4)"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              opacity="0.95"
            />
            <Path
              d="M78 10 C78 5 82 2 82 2 C82 2 86 5 86 10 C86 15 84 18 82 18 C80 18 78 15 78 10 Z"
              fill="url(#sg3)"
            />
            <Ellipse cx="80.5" cy="8" rx="1.2" ry="2" fill="white" opacity="0.7" />
          </Svg>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        DropPing
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        DROP ANYTHING. INSTANTLY.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: colors.primary,
    opacity: 0.06,
  },
  logoWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ring1: {
    width: 170,
    height: 170,
    borderColor: '#00E5FF',
  },
  ring2: {
    width: 200,
    height: 200,
    borderColor: '#0057FF',
    borderWidth: 1,
  },
  ring3: {
    width: 230,
    height: 230,
    borderColor: '#00E5FF',
    borderWidth: 0.8,
  },
  logoBox: {
    width: 160,
    height: 160,
    borderRadius: 36,
    backgroundColor: colors.bgCards,
    borderWidth: 2,
    borderColor: 'rgba(0,87,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 20,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  appName: {
    fontSize: 38,
    fontFamily: typography.fonts.extrabold,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: colors.accent,
    letterSpacing: 4,
  },
});