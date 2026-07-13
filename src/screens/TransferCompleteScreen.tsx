import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/layout';
import { formatFileSize } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferComplete'>;

export default function TransferCompleteScreen({ navigation, route }: Props) {
  const { fileName, fileSize, deviceName } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.checkmark, { transform: [{ scale: scaleAnim }] }]}>
        ✅
      </Animated.Text>

      <Animated.View style={[styles.textContainer, { opacity: opacityAnim }]}>
        <Text style={styles.title}>Transfer Complete</Text>
        <Text style={styles.subtitle}>
          {fileName} ({formatFileSize(fileSize)}) sent to {deviceName}
        </Text>
      </Animated.View>

      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => navigation.replace('Main')}
      >
        <Text style={styles.dismissText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  checkmark: { fontSize: 80, marginBottom: spacing.xl },
  textContainer: { alignItems: 'center', marginBottom: spacing.xl },
  title: {
    fontSize: 26,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dismissButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
  dismissText: {
    fontSize: 15,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
});