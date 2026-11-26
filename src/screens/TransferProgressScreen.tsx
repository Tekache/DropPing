import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize, formatSpeed, formatTimeRemaining } from '../utils/formatters';
import { useTransferStore } from '../store/useTransferStore';
import { wifiDirectService } from '../services/WifiDirectService';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferProgress'>;

export default function TransferProgressScreen({ navigation, route }: Props) {
  const { fileName, fileSize, fileUri, deviceName, deviceId, direction = 'sent' } = route.params;
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const addTransfer = useTransferStore((s) => s.addTransfer);
  const completeTransfer = useTransferStore((s) => s.completeTransfer);
  const transferId = useRef(`transfer-${Date.now()}`).current;
  const navigationRef = useRef(navigation);
  const doneRef = useRef(false);

  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  useEffect(() => {
    addTransfer({
      id: transferId,
      fileName,
      fileSize,
      fileType: '',
      status: 'transferring',
      progress: 0,
      speed: 0,
      timeRemaining: 0,
      senderId: 'local-user',
      receiverId: deviceId,
      timestamp: new Date(),
      direction,
    });

    const startedAt = Date.now();
    const elapsedTimer = setInterval(() => {
      if (!doneRef.current) setElapsed((Date.now() - startedAt) / 1000);
    }, 250);

    const runTransfer = async () => {
      try {
        if (direction === 'sent') {
          if (!fileUri) throw new Error('The selected file is no longer available.');
          const accepted = await wifiDirectService.waitForTransferDecision();
          if (!accepted) throw new Error('The recipient declined the transfer.');
          await wifiDirectService.sendFile(fileUri);
        } else {
          await wifiDirectService.receivePreparedFile('/storage/emulated/0/DropPing', fileName);
        }

        if (doneRef.current) return;
        doneRef.current = true;
        clearInterval(elapsedTimer);
        setProgress(100);
        setSpeed(fileSize / Math.max((Date.now() - startedAt) / 1000, 0.001));
        Animated.timing(progressAnim, { toValue: 100, duration: 250, useNativeDriver: false }).start();
        completeTransfer(transferId);
        setTimeout(() => navigationRef.current.replace('TransferComplete', { fileName, fileSize, deviceName }), 400);
      } catch (error) {
        if (doneRef.current) return;
        doneRef.current = true;
        clearInterval(elapsedTimer);
        useTransferStore.getState().failTransfer(transferId);
        navigationRef.current.navigate('Main');
      }
    };

    runTransfer();

    return () => {
      clearInterval(elapsedTimer);
      doneRef.current = true;
    };
  }, [direction, fileName, fileSize, fileUri, deviceId, deviceName]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>{direction === 'sent' ? 'Sending to' : 'Receiving from'}</Text>
        <Text style={styles.deviceName}>{deviceName}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.fileName} numberOfLines={2}>{fileName}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.percentage}>{Math.round(progress)}%</Text>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.toggleText}>
            {showDetails ? 'Hide Details ▲' : 'Show Details ▼'}
          </Text>
        </TouchableOpacity>

        {showDetails && (
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Transferred</Text>
              <Text style={styles.detailValue}>
                {formatFileSize(fileSize * progress / 100)} of {formatFileSize(fileSize)}
              </Text>
            </View>
            <View style={[styles.detailItem, styles.detailBorder]}>
              <Text style={styles.detailLabel}>Speed</Text>
              <Text style={styles.detailValue}>{formatSpeed(speed)}</Text>
            </View>
            <View style={[styles.detailItem, styles.detailBorder]}>
              <Text style={styles.detailLabel}>Remaining</Text>
              <Text style={styles.detailValue}>{formatTimeRemaining(timeRemaining)}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          doneRef.current = true;
          navigation.navigate('Main');
        }}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  deviceName: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fileName: {
    fontSize: 18,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  percentage: {
    fontSize: 56,
    fontFamily: typography.fonts.extrabold,
    color: colors.textPrimary,
  },
  toggleButton: { marginBottom: spacing.lg },
  toggleText: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.accent,
  },
  details: {
    width: '100%',
    backgroundColor: colors.bgCards,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  detailBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  cancelButton: {
    margin: spacing.base,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: typography.fonts.semibold,
    color: colors.textSecondary,
  },
});
