import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferComplete'>;

export default function TransferCompleteScreen({ navigation, route }: Props) {
  const { fileName, deviceName } = route.params;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✅</Text>
      <Text style={styles.title}>Transfer Complete</Text>
      <Text style={styles.subtitle}>{fileName} sent to {deviceName}</Text>
      <TouchableOpacity onPress={() => navigation.replace('Main')}>
        <Text style={styles.dismiss}>Tap to dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  checkmark: { fontSize: 72, marginBottom: spacing.lg },
  title: { fontSize: 24, fontFamily: typography.fonts.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  dismiss: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary, opacity: 0.6 },
});