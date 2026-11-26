import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { useThemeStore } from '../store/useThemeStore';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize } from '../utils/formatters';
import { wifiDirectService } from '../services/WifiDirectService';

type Props = NativeStackScreenProps<RootStackParamList, 'Send'>;

interface SelectedFile {
  name: string;
  size: number;
  uri: string;
  type: string | null;
}

const CATEGORIES = [
  {
    id: 'photos',
    label: 'Photos',
    icon: '🖼️',
    description: 'Images from your gallery',
    mediaType: 'images',
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: '🎬',
    description: 'Video files',
    mediaType: 'videos',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: '📄',
    description: 'PDF, Word, Excel and more',
    mimeType: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: '🎵',
    description: 'Music and voice recordings',
    mimeType: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/aac', 'audio/*'],
  },
  {
    id: 'contacts',
    label: 'Contact',
    icon: '👤',
    description: 'Share your contact info',
  },
  {
    id: 'wifi',
    label: 'WiFi',
    icon: '📶',
    description: 'Share WiFi password',
  },
  ...(Platform.OS === 'android'
    ? [{ id: 'apps', label: 'Apps', icon: '📦', description: 'Share APK files', mimeType: ['application/vnd.android.package-archive'] }]
    : []),
];

export default function SendScreen({ navigation, route }: Props) {
  const { deviceName, deviceId } = route.params;
  const { colors: c } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCategory = async (category: typeof CATEGORIES[0]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category.id);
    setLoading(true);

    try {
      if (category.id === 'photos' || category.id === 'videos') {
        // const mediaType = category.id === 'photos'
        //   ? ImagePicker.MediaType.Images
        //   : ImagePicker.MediaType.Videos;
        const mediaType = category.id === 'photos' ? 'images' : 'videos';

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: mediaType,
          quality: 1,
          allowsMultipleSelection: true,
        });

        if (!result.canceled && result.assets.length > 0) {
          const files: SelectedFile[] = result.assets.map((asset) => ({
            name: asset.fileName || `${category.id}_${Date.now()}`,
            size: asset.fileSize || 0,
            uri: asset.uri,
            type: asset.mimeType || (category.id === 'photos' ? 'image/jpeg' : 'video/mp4'),
          }));
          setSelectedFiles((prev) => [...prev, ...files]);
        }
      } else if (category.id === 'contacts') {
        navigation.navigate('ContactPreview', {
          contactName: 'My Contact',
          contactPhone: '',
          contactEmail: '',
          senderId: deviceId,
        });
        return;
      } else if (category.id === 'wifi') {
        setSelectedFiles((prev) => [
          ...prev,
          { name: 'WiFi Password', size: 0, uri: '', type: 'wifi' },
        ]);
      } else {
        const mimeTypes = category.mimeType || ['*/*'];
        const result = await DocumentPicker.getDocumentAsync({
          type: mimeTypes,
          copyToCacheDirectory: true,
          multiple: true,
        });

        if (!result.canceled && result.assets.length > 0) {
          const files: SelectedFile[] = result.assets.map((asset) => ({
            name: asset.name,
            size: asset.size || 0,
            uri: asset.uri,
            type: asset.mimeType || null,
          }));
          setSelectedFiles((prev) => [...prev, ...files]);
        }
      }
    } catch (e) {
      console.log('Picker error:', e);
    } finally {
      setLoading(false);
      setActiveCategory(null);
    }
  };

  const removeFile = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (selectedFiles.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const file = selectedFiles[0];
    if (!file.uri) return;

    setLoading(true);
    try {
      await wifiDirectService.connectToPeer(deviceId);
      navigation.replace('TransferProgress', {
        fileName: file.name,
        fileSize: file.size,
        fileUri: file.uri,
        deviceName,
        deviceId,
        direction: 'sent',
      });
    } catch (error) {
      console.log('Wi-Fi Direct connection error:', error);
      Alert.alert('Could not connect', error instanceof Error ? error.message : 'The device could not be connected.');
    } finally {
      setLoading(false);
    }
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <View style={[styles.container, { backgroundColor: c.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>Send to</Text>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>{deviceName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: c.bgCards }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.closeText, { color: c.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {selectedFiles.length > 0 && (
        <View style={[styles.selectedSection, { borderBottomColor: c.border }]}>
          <View style={styles.selectedHeader}>
            <Text style={[styles.selectedTitle, { color: c.textPrimary }]}>
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready
            </Text>
            <Text style={[styles.selectedSize, { color: c.textSecondary }]}>
              {formatFileSize(totalSize)}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fileList}
          >
            {selectedFiles.map((file, index) => (
              <View
                key={index}
                style={[styles.fileChip, { backgroundColor: c.bgCards, borderColor: c.border }]}
              >
                <Text style={styles.fileChipIcon}>
                  {file.type?.startsWith('image') ? '🖼️' :
                   file.type?.startsWith('video') ? '🎬' :
                   file.type?.startsWith('audio') ? '🎵' :
                   file.type === 'wifi' ? '📶' : '📄'}
                </Text>
                <Text style={[styles.fileChipName, { color: c.textPrimary }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity onPress={() => removeFile(index)} style={styles.removeBtn}>
                  <Text style={[styles.removeBtnText, { color: c.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
        What do you want to share?
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Opening...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: activeCategory === cat.id ? c.primary + '22' : c.bgCards,
                  borderColor: activeCategory === cat.id ? c.primary : c.border,
                },
              ]}
              onPress={() => handleCategory(cat)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, { color: c.textPrimary }]}>{cat.label}</Text>
              <Text style={[styles.categoryDesc, { color: c.textSecondary }]} numberOfLines={2}>
                {cat.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedFiles.length > 0 && (
        <View style={[styles.sendBar, { borderTopColor: c.border }]}>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: c.primary }]}
            onPress={handleSend}
          >
            <Text style={[styles.sendButtonText, { color: c.textPrimary }]}>
              Send {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  headerSub: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },
  headerTitle: { fontSize: typography.sizes.xxl, fontFamily: typography.fonts.bold },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { fontSize: 16 },
  selectedSection: { borderBottomWidth: 1, paddingBottom: spacing.md },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  selectedTitle: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold },
  selectedSize: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },
  fileList: { paddingHorizontal: spacing.base, gap: spacing.sm },
  fileChip: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    width: 130,
    gap: 4,
  },
  fileChipIcon: { fontSize: 22 },
  fileChipName: { fontSize: 11, fontFamily: typography.fonts.semibold },
  removeBtn: { position: 'absolute', top: 4, right: 6 },
  removeBtnText: { fontSize: 11 },
  sectionLabel: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    flex: 1,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 0.9,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: { fontSize: 26 },
  categoryLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, textAlign: 'center' },
  categoryDesc: { fontSize: 9, fontFamily: typography.fonts.regular, textAlign: 'center', lineHeight: 13 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular },
  sendBar: { padding: spacing.base, borderTopWidth: 1 },
  sendButton: {
    borderRadius: borderRadius.full,
    padding: spacing.md,
    alignItems: 'center',
  },
  sendButtonText: { fontSize: typography.sizes.lg, fontFamily: typography.fonts.bold },
});
