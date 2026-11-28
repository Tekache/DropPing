import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { useThemeStore } from '../store/useThemeStore';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/layout';
import { formatFileSize } from '../utils/formatters';
import { wifiDirectService } from '../services/WifiDirectService';
import { useAppStore } from '../store/useAppStore';
import { TransferFile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Send'>;

type Category = { id: string; label: string; icon: string; description: string; mimeType?: string[]; mediaType?: 'images' | 'videos' };
const CATEGORIES: Category[] = [
  { id: 'photos', label: 'Photos', icon: '🖼️', description: 'Select multiple images', mediaType: 'images' },
  { id: 'videos', label: 'Videos', icon: '🎬', description: 'Select multiple videos', mediaType: 'videos' },
  { id: 'documents', label: 'Documents', icon: '📄', description: 'PDF, Word and more', mimeType: ['*/*'] },
  { id: 'audio', label: 'Audio', icon: '🎵', description: 'Music and recordings', mimeType: ['audio/*'] },
  ...(Platform.OS === 'android' ? [{ id: 'apps', label: 'APK files', icon: '📦', description: 'Android app packages', mimeType: ['application/vnd.android.package-archive'] }] : []),
];

export default function SendScreen({ navigation, route }: Props) {
  const { deviceName, deviceId } = route.params;
  const { colors: c } = useThemeStore();
  const profile = useAppStore((state) => state.userProfile);
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<TransferFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const columns = width < 380 ? 2 : 3;

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const addFiles = (assets: Array<{ uri: string; fileName?: string | null; name?: string; fileSize?: number | null; size?: number | null; mimeType?: string | null }>) => {
    setFiles((current) => [...current, ...assets.map((asset, index) => ({
      id: `${Date.now()}-${index}-${asset.uri}`,
      name: asset.fileName || asset.name || `file-${Date.now()}-${index}`,
      size: asset.fileSize || asset.size || 0,
      uri: asset.uri,
      mimeType: asset.mimeType,
    }))]);
  };

  const handleCategory = async (category: Category) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category.id);
    setLoading(true);
    try {
      if (category.mediaType) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: category.mediaType,
          quality: 1,
          allowsMultipleSelection: true,
          selectionLimit: 50,
        });
        if (!result.canceled) addFiles(result.assets);
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: category.mimeType || ['*/*'],
          copyToCacheDirectory: true,
          multiple: true,
        });
        if (!result.canceled) addFiles(result.assets);
      }
    } catch (error) {
      Alert.alert('Could not select files', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setActiveCategory(null);
    }
  };

  const handleSend = async () => {
    const sendable = files.filter((file) => file.uri);
    if (!sendable.length) return;
    setLoading(true);
    try {
      await wifiDirectService.connectToPeer(deviceId);
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await wifiDirectService.sendTransferOffer({
        batchId,
        files: sendable.map(({ id, name, size, mimeType }) => ({ id, name, size, mimeType })),
        senderName: profile.displayName || profile.deviceName,
        senderId: profile.id,
        senderAvatar: profile.avatar,
        totalSize,
      });
      navigation.replace('TransferProgress', { files: sendable, batchId, deviceName, deviceId, direction: 'sent' });
    } catch (error) {
      Alert.alert('Could not prepare transfer', error instanceof Error ? error.message : 'The device could not be connected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>Send to</Text>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]} numberOfLines={1}>{deviceName}</Text>
        </View>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: c.bgCards }]} onPress={() => navigation.goBack()}><Text style={[styles.closeText, { color: c.textSecondary }]}>✕</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summary, { backgroundColor: c.bgCards, borderColor: c.border }]}>
          <View><Text style={[styles.summaryTitle, { color: c.textPrimary }]}>{files.length ? `${files.length} item${files.length === 1 ? '' : 's'} selected` : 'Choose what to share'}</Text><Text style={[styles.summaryMeta, { color: c.textSecondary }]}>{files.length ? formatFileSize(totalSize) : 'You can select up to 50 files'}</Text></View>
          {files.length > 0 && <TouchableOpacity onPress={() => setFiles([])}><Text style={[styles.clearText, { color: c.error }]}>Clear</Text></TouchableOpacity>}
        </View>
        <TouchableOpacity style={[styles.contactCard, { backgroundColor: c.primary + '18', borderColor: c.primary }]} onPress={() => navigation.navigate('ContactPreview', { mode: 'send', deviceId })}>
          <Text style={styles.contactIcon}>👤</Text><View style={styles.contactText}><Text style={[styles.contactTitle, { color: c.textPrimary }]}>Share contact card</Text><Text style={[styles.contactDesc, { color: c.textSecondary }]}>Choose exactly which details to send</Text></View><Text style={[styles.chevron, { color: c.primary }]}>›</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Files</Text>
        {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={c.primary} /><Text style={[styles.loadingText, { color: c.textSecondary }]}>Preparing…</Text></View> : <View style={styles.grid}>{CATEGORIES.map((category) => <TouchableOpacity key={category.id} onPress={() => handleCategory(category)} style={[styles.categoryCard, { width: `${100 / columns - 3}%`, backgroundColor: activeCategory === category.id ? c.primary + '22' : c.bgCards, borderColor: activeCategory === category.id ? c.primary : c.border }]}><Text style={styles.categoryIcon}>{category.icon}</Text><Text style={[styles.categoryLabel, { color: c.textPrimary }]}>{category.label}</Text><Text style={[styles.categoryDesc, { color: c.textSecondary }]}>{category.description}</Text></TouchableOpacity>)}</View>}
        {files.length > 0 && <View style={styles.selectedList}>{files.map((file, index) => <View key={file.id} style={[styles.fileRow, { backgroundColor: c.bgCards, borderColor: c.border }]}><Text style={styles.fileIcon}>{file.mimeType?.startsWith('image') ? '🖼️' : file.mimeType?.startsWith('video') ? '🎬' : '📄'}</Text><View style={styles.fileInfo}><Text style={[styles.fileName, { color: c.textPrimary }]} numberOfLines={1}>{file.name}</Text><Text style={[styles.fileSize, { color: c.textSecondary }]}>{formatFileSize(file.size)}</Text></View><TouchableOpacity onPress={() => setFiles((current) => current.filter((_, i) => i !== index))}><Text style={[styles.remove, { color: c.textSecondary }]}>✕</Text></TouchableOpacity></View>)}</View>}
      </ScrollView>
      {files.length > 0 && <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.bgPrimary }]}><TouchableOpacity style={[styles.sendButton, { backgroundColor: c.primary, ...shadows.blue }]} onPress={handleSend} disabled={loading}><Text style={[styles.sendText, { color: c.textPrimary }]}>Send {files.length} item{files.length === 1 ? '' : 's'} →</Text></TouchableOpacity></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1 }, headerText: { flex: 1, marginRight: spacing.md }, headerSub: { fontSize: typography.sizes.sm }, headerTitle: { fontSize: typography.sizes.xxl, fontFamily: typography.fonts.bold }, closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 16 }, content: { padding: spacing.base, paddingBottom: 120 }, summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.base }, summaryTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold }, summaryMeta: { fontSize: typography.sizes.sm, marginTop: 4 }, clearText: { fontFamily: typography.fonts.semibold }, contactCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.base, marginTop: spacing.md }, contactIcon: { fontSize: 28, marginRight: spacing.md }, contactText: { flex: 1 }, contactTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold }, contactDesc: { fontSize: typography.sizes.xs, marginTop: 3 }, chevron: { fontSize: 26 }, sectionLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, marginTop: spacing.xl, marginBottom: spacing.md }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, categoryCard: { minHeight: 120, borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center' }, categoryIcon: { fontSize: 28, marginBottom: 6 }, categoryLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, textAlign: 'center' }, categoryDesc: { fontSize: 10, textAlign: 'center', marginTop: 4 }, loading: { minHeight: 240, justifyContent: 'center', alignItems: 'center', gap: spacing.md }, loadingText: { fontSize: typography.sizes.base }, selectedList: { gap: spacing.sm, marginTop: spacing.lg }, fileRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.sm }, fileIcon: { fontSize: 24, marginRight: spacing.sm }, fileInfo: { flex: 1 }, fileName: { fontFamily: typography.fonts.semibold, fontSize: typography.sizes.sm }, fileSize: { fontSize: typography.sizes.xs, marginTop: 2 }, remove: { padding: spacing.sm }, footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.base, borderTopWidth: 1 }, sendButton: { padding: spacing.md, borderRadius: borderRadius.full, alignItems: 'center' }, sendText: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
});
