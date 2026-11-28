import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize, formatSpeed } from '../utils/formatters';
import { wifiDirectService } from '../services/WifiDirectService';
import { useTransferStore } from '../store/useTransferStore';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferProgress'>;

export default function TransferProgressScreen({ navigation, route }: Props) {
  const { files, batchId, deviceName, deviceId, direction } = route.params;
  const { width } = useWindowDimensions();
  const [completed, setCompleted] = useState(0);
  const [currentName, setCurrentName] = useState(files[0]?.name || '');
  const [status, setStatus] = useState(direction === 'sent' ? 'Waiting for acceptance…' : 'Preparing receiver…');
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());
  const cancelled = useRef(false);
  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const completedBytes = useMemo(() => files.slice(0, completed).reduce((sum, file) => sum + file.size, 0), [files, completed]);
  const progress = totalBytes > 0 ? Math.round((completedBytes / totalBytes) * 100) : Math.round((completed / Math.max(files.length, 1)) * 100);
  const speed = completedBytes / Math.max((Date.now() - startedAt) / 1000, 0.001);

  useEffect(() => {
    let mounted = true;
    const add = useTransferStore.getState().addTransfer;
    files.forEach((file, index) => add({ id: `${batchId}-${file.id}`, fileName: file.name, fileSize: file.size, fileType: file.mimeType || '', status: 'transferring', progress: 0, speed: 0, timeRemaining: 0, senderId: direction === 'sent' ? 'local-user' : deviceId, receiverId: direction === 'sent' ? deviceId : 'local-user', timestamp: new Date(), direction, batchId, batchIndex: index, batchCount: files.length }));

    const run = async () => {
      try {
        if (direction === 'sent') {
          const decision = await wifiDirectService.waitForTransferDecision();
          if (!decision.accepted) throw new Error(decision.reason || 'The recipient rejected the transfer.');
        }
        for (let index = 0; index < files.length; index += 1) {
          if (cancelled.current) return;
          const file = files[index];
          if (mounted) { setCurrentName(file.name); setStatus(direction === 'sent' ? `Waiting for receiver · ${index + 1} of ${files.length}` : `Preparing file · ${index + 1} of ${files.length}`); }
          if (direction === 'received') {
            await wifiDirectService.sendFileReady(batchId, index);
            await wifiDirectService.receiveFile('/storage/emulated/0/DropPing', file.name);
          } else {
            if (!file.uri) throw new Error(`File ${file.name} is no longer available.`);
            await wifiDirectService.waitForFileReady(batchId, index);
            if (mounted) setStatus(`Sending · ${index + 1} of ${files.length}`);
            await wifiDirectService.sendFile(file.uri);
          }
          if (mounted) setCompleted(index + 1);
        }
        if (!mounted || cancelled.current) return;
        setStatus('Complete');
        files.forEach((file) => useTransferStore.getState().completeTransfer(`${batchId}-${file.id}`));
        setTimeout(() => navigation.replace('TransferComplete', { fileName: files.length === 1 ? files[0].name : `${files.length} items`, fileSize: totalBytes, deviceName }), 500);
      } catch (cause) {
        if (!mounted || cancelled.current) return;
        const message = cause instanceof Error ? cause.message : 'Transfer failed.';
        setError(message);
        setStatus('Transfer failed');
        files.forEach((file) => useTransferStore.getState().failTransfer(`${batchId}-${file.id}`));
      }
    };
    run();
    return () => { mounted = false; };
  }, [batchId, deviceId, direction, files, navigation, totalBytes, deviceName]);

  const handleCancel = async () => {
    cancelled.current = true;
    await wifiDirectService.cancelTransfer(batchId).catch(() => undefined);
    files.forEach((file) => useTransferStore.getState().cancelTransfer(`${batchId}-${file.id}`));
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { width: Math.min(width, 620), alignSelf: 'center' }]}>
        <Text style={styles.eyebrow}>{direction === 'sent' ? 'Sending to' : 'Receiving from'}</Text>
        <Text style={styles.deviceName}>{deviceName}</Text>
        <View style={styles.hero}><Text style={styles.percent}>{progress}%</Text><Text style={styles.status}>{status}</Text><Text style={styles.current} numberOfLines={1}>{currentName}</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} /></View>
        <View style={styles.metrics}><View><Text style={styles.metricLabel}>Completed</Text><Text style={styles.metricValue}>{completed} / {files.length} files</Text></View><View><Text style={styles.metricLabel}>Data</Text><Text style={styles.metricValue}>{formatFileSize(completedBytes)} / {formatFileSize(totalBytes)}</Text></View><View><Text style={styles.metricLabel}>Speed</Text><Text style={styles.metricValue}>{formatSpeed(speed)}</Text></View></View>
        {error && <View style={styles.error}><Text style={styles.errorTitle}>Transfer stopped</Text><Text style={styles.errorText}>{error}</Text></View>}
        <Text style={styles.explanation}>{direction === 'sent' ? 'The receiver accepted this batch. Each file is sent only after the receiver is ready.' : 'Files are received one at a time and verified by the native transfer operation.'}</Text>
        {error ? <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('Main')}><Text style={styles.retryText}>Done</Text></TouchableOpacity> : <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}><Text style={styles.cancelText}>Cancel transfer</Text></TouchableOpacity>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.bgPrimary }, content: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' }, eyebrow: { color: colors.textSecondary, fontSize: typography.sizes.sm }, deviceName: { color: colors.textPrimary, fontSize: 24, fontFamily: typography.fonts.bold, marginTop: 4 }, hero: { alignItems: 'center', marginVertical: spacing.xxl }, percent: { color: colors.textPrimary, fontSize: 68, fontFamily: typography.fonts.extrabold }, status: { color: colors.accent, fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold, textAlign: 'center' }, current: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: spacing.sm, maxWidth: '80%' }, track: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 }, metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xl }, metricLabel: { color: colors.textSecondary, fontSize: typography.sizes.xs }, metricValue: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, marginTop: 4 }, explanation: { color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20, textAlign: 'center', marginTop: spacing.xl }, error: { backgroundColor: colors.error + '18', borderColor: colors.error, borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.xl }, errorTitle: { color: colors.error, fontFamily: typography.fonts.semibold }, errorText: { color: colors.textSecondary, marginTop: 4 }, cancelButton: { marginTop: spacing.xxl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, alignItems: 'center' }, cancelText: { color: colors.textSecondary, fontFamily: typography.fonts.semibold }, retryButton: { marginTop: spacing.xxl, padding: spacing.md, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center' }, retryText: { color: colors.textPrimary, fontFamily: typography.fonts.bold },
});
