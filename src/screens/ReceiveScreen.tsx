import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize } from '../utils/formatters';
import { wifiDirectService } from '../services/WifiDirectService';
import { TransferFile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Receive'>;

export default function ReceiveScreen({ navigation, route }: Props) {
  const { offer } = route.params;
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const totalSize = useMemo(() => offer.totalSize || offer.files.reduce((sum, file) => sum + file.size, 0), [offer]);
  const avatar = offer.senderAvatar;

  const handleAccept = async () => {
    setBusy(true);
    try {
      const free = await FileSystem.getFreeDiskStorageAsync();
      if (free < totalSize) {
        const missing = totalSize - free;
        Alert.alert('Not enough storage', `Clear at least ${formatFileSize(missing)} before accepting this transfer.`, [{ text: 'OK' }]);
        setBusy(false);
        return;
      }
      await wifiDirectService.sendTransferDecision(true);
      const files: TransferFile[] = offer.files.map((file) => ({ id: file.id, name: file.name, size: file.size, mimeType: file.mimeType }));
      navigation.replace('TransferProgress', { files, batchId: offer.batchId, deviceName: offer.senderName, deviceId: offer.senderId, direction: 'received' });
    } catch (error) {
      await wifiDirectService.sendTransferDecision(false, 'Not enough storage or receiver unavailable.').catch(() => undefined);
      Alert.alert('Could not accept transfer', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    await wifiDirectService.sendTransferDecision(false, 'Declined by recipient').catch(() => undefined);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { width: Math.min(width, 560), alignSelf: 'center' }]}>
        <View style={styles.handle} />
        <View style={styles.avatar}>{avatar ? <Text style={styles.avatarText}>●</Text> : <Text style={styles.avatarText}>{offer.senderName.charAt(0).toUpperCase()}</Text>}</View>
        <Text style={styles.senderName}>{offer.senderName}</Text>
        <Text style={styles.subtitle}>wants to send you</Text>
        <View style={styles.summary}><Text style={styles.summaryCount}>{offer.files.length} item{offer.files.length === 1 ? '' : 's'}</Text><Text style={styles.summarySize}>{formatFileSize(totalSize)}</Text></View>
        <View style={styles.fileList}>{offer.files.slice(0, 8).map((file) => <View key={file.id} style={styles.fileRow}><Text style={styles.fileIcon}>{file.mimeType?.startsWith('image') ? '🖼️' : file.mimeType?.startsWith('video') ? '🎬' : '📄'}</Text><Text style={styles.fileName} numberOfLines={1}>{file.name}</Text><Text style={styles.fileSize}>{formatFileSize(file.size)}</Text></View>)}{offer.files.length > 8 && <Text style={styles.more}>+ {offer.files.length - 8} more items</Text>}</View>
        <Text style={styles.storageNote}>DropPing will save these files to your configured receiving folder. Available storage is checked before anything starts.</Text>
        <View style={styles.buttons}><TouchableOpacity style={styles.declineButton} onPress={handleDecline} disabled={busy}><Text style={styles.declineText}>Reject</Text></TouchableOpacity><TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={busy}>{busy ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.acceptText}>Accept</Text>}</TouchableOpacity></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary + 'F2', justifyContent: 'flex-end' }, content: { backgroundColor: colors.bgCards, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xl, minHeight: '72%' }, handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.xl }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }, avatarText: { fontSize: 30, fontFamily: typography.fonts.bold, color: colors.textPrimary }, senderName: { fontSize: 22, fontFamily: typography.fonts.bold, color: colors.textPrimary, textAlign: 'center' }, subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }, summary: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md }, summaryCount: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold, color: colors.textPrimary }, summarySize: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.semibold, color: colors.accent }, fileList: { gap: spacing.sm, maxHeight: 260 }, fileRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.bgSecondary, borderRadius: borderRadius.md }, fileIcon: { fontSize: 20, marginRight: spacing.sm }, fileName: { flex: 1, fontSize: typography.sizes.sm, color: colors.textPrimary, fontFamily: typography.fonts.semibold }, fileSize: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginLeft: spacing.sm }, more: { fontSize: typography.sizes.xs, color: colors.textSecondary, textAlign: 'center', padding: spacing.sm }, storageNote: { fontSize: typography.sizes.xs, color: colors.textSecondary, lineHeight: 18, marginTop: spacing.lg }, buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }, declineButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }, declineText: { color: colors.textSecondary, fontFamily: typography.fonts.semibold }, acceptButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: 'center' }, acceptText: { color: colors.textPrimary, fontFamily: typography.fonts.semibold },
});
