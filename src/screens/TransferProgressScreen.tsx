import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize, formatSpeed, formatTimeRemaining } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferProgress'>;

export default function TransferProgressScreen({ navigation, route }: Props) {
  const { fileName, fileSize, deviceName, deviceId } = route.params;
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 0.2);
      setProgress((prev) => {
        const next = prev + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigation.replace('TransferComplete', { fileName, fileSize, deviceName });
          }, 300);
          return 100;
        }
        return Math.min(next, 100);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const speed = useMemo(() => elapsed > 0 ? fileSize / elapsed : 0, [elapsed, fileSize]);
  const timeRemaining = useMemo(() => speed > 0 ? (fileSize * (1 - progress / 100)) / speed : 0, [speed, fileSize, progress]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sending to {deviceName}</Text>
      <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detail}>{formatFileSize(fileSize * progress / 100)} of {formatFileSize(fileSize)}</Text>
        <Text style={styles.detail}>{formatSpeed(speed)}</Text>
        <Text style={styles.detail}>{formatTimeRemaining(timeRemaining)}</Text>
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  title: { fontSize: 16, fontFamily: typography.fonts.regular, color: colors.textSecondary, marginBottom: spacing.sm },
  fileName: { fontSize: 18, fontFamily: typography.fonts.bold, color: colors.textPrimary, marginBottom: spacing.xl, textAlign: 'center' },
  progressContainer: { width: '100%', alignItems: 'center', marginBottom: spacing.lg },
  progressTrack: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  percentage: { fontSize: 48, fontFamily: typography.fonts.extrabold, color: colors.textPrimary },
  details: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  detail: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSecondary },
  cancelButton: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 15, fontFamily: typography.fonts.semibold, color: colors.textSecondary },
});