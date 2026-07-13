import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
} from 'react-native-svg';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(0.8)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const ringAnim = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.3,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    ringAnim(ring1Scale, ring1Opacity, 500);
    ringAnim(ring2Scale, ring2Opacity, 1000);
    ringAnim(ring3Scale, ring3Opacity, 1500);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('Main');
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowBg, { opacity: glowOpacity }]} />

      <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring3, { transform: [{ scale: ring3Scale }], opacity: ring3Opacity }]} />

        <View style={styles.logoBox}>
          <View style={styles.waveContainer}>
            <Svg width="200" height="40" viewBox="0 0 400 80">
              <Path
                d="M0 35 Q25 15 50 35 Q75 55 100 35 Q125 15 150 35 Q175 55 200 35 Q225 15 250 35 Q275 55 300 35 Q325 15 350 35 Q375 55 400 35 L400 70 L0 70Z"
                fill="rgba(0,87,255,0.18)"
              />
            </Svg>
          </View>

          <Svg width="90" height="90" viewBox="0 0 95 95" fill="none">
            <Defs>
              <LinearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="45%" stopColor="#00E5FF" />
                <Stop offset="100%" stopColor="#0057FF" />
              </LinearGradient>
              <LinearGradient id="g3" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="#00E5FF" />
              </LinearGradient>
              <LinearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#0057FF" stopOpacity="0" />
                <Stop offset="30%" stopColor="#00E5FF" />
                <Stop offset="70%" stopColor="#0057FF" />
                <Stop offset="100%" stopColor="#0057FF" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            <Path
              d="M17 16 L17 80 Q17 84 21 84 L31 84 Q35 84 35 80 L35 60 Q46 65 55 61 Q73 54 74 38 Q75 18 58 12 Q48 8 36 9 Q25 9 20 11 Z"
              fill="url(#g1)"
            />
            <Path
              d="M35 17 L35 52 Q43 57 52 53 Q65 47 65 36 Q65 22 52 18 Q43 14 35 17 Z"
              fill="#050B1A"
              opacity="0.9"
            />
            <Path
              d="M8 72 Q20 62 32 72 Q44 82 56 72 Q66 64 80 70"
              stroke="url(#g4)"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
              opacity="0.95"
            />
            <Path
              d="M78 10 C78 5 82 2 82 2 C82 2 86 5 86 10 C86 15 84 18 82 18 C80 18 78 15 78 10 Z"
              fill="url(#g3)"
            />
             <Circle cx="80.5" cy="8" r="2" fill="white" opacity="0.7" /> 
          </Svg>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.appName}>DropPing</Text>
        <Text style={styles.tagline}>Drop Anything. Instantly.</Text>
      </Animated.View>
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
  glowBg: {
  position: 'absolute',
  width: 500,
  height: 500,
  borderRadius: 250,
  backgroundColor: colors.primary,
  opacity: 0.06,
  shadowColor: colors.primary,
  shadowOpacity: 1,
  shadowRadius: 150,
  elevation: 0,
},
  logoWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: colors.accent,
    opacity: 0.3,
  },
  ring2: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderColor: colors.primary,
  },
  ring3: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderColor: colors.accent,
  },
  logoBox: {
    width: 160,
    height: 160,
    borderRadius: 36,
    backgroundColor: colors.bgCards,
    borderWidth: 2,
    borderColor: 'rgba(0,87,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 36,
    fontFamily: typography.fonts.extrabold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});