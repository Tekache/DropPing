import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Send'>;

interface SelectedFile {
  name: string;
  size: number;
  uri: string;
  type: string | null;
  mimeType?: string;
}

const CATEGORIES = [
  { id: 'photos', label: 'Photos & Videos', icon: '🖼️' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'contacts', label: 'Contacts', icon: '👤' },
  { id: 'links', label: 'Links & Maps', icon: '🔗' },
  { id: 'wifi', label: 'WiFi Password', icon: '📶' },
  ...(Platform.OS === 'android' ? [{ id: 'apps', label: 'Apps', icon: '📦' }] : []),
];

export default function SendScreen({ navigation, route }: Props) {
  const { deviceName, deviceId } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handleCategory = async (categoryId: string) => {
    setLoading(true);
    try {
      if (categoryId === 'photos') {
        const result = await ImagePicker.launchImageLibraryAsync({
          // mediaTypes: ImagePicker.MediaTypeOptions.All,
          mediaTypes: ['images', 'videos'] as any,
          quality: 1,
          allowsMultipleSelection: true,
        });
        if (!result.canceled && result.assets.length > 0) {
          const files: SelectedFile[] = result.assets.map((asset) => ({
            name: asset.fileName || `photo_${Date.now()}`,
            size: asset.fileSize || 0,
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
          }));
          setSelectedFiles((prev) => [...prev, ...files]);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
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
    }
  };

  const removeFile = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (selectedFiles.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const firstFile = selectedFiles[0];
    navigation.replace('TransferProgress', {
      fileName: selectedFiles.length === 1
        ? firstFile.name
        : `${selectedFiles.length} files`,
      fileSize: totalSize,
      deviceName,
      deviceId,
    });
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Send to</Text>
          <Text style={styles.headerTitle}>{deviceName}</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {selectedFiles.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.selectedSize}>{formatFileSize(totalSize)}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          >
            {selectedFiles.map((file, index) => (
              <View key={index} style={styles.fileChip}>
                <Text style={styles.fileChipIcon}>
                  {file.type?.startsWith('image') ? '🖼️' :
                   file.type?.startsWith('video') ? '🎬' : '📄'}
                </Text>
                <Text style={styles.fileChipName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileChipSize}>
                  {formatFileSize(file.size)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFile(index)}
                  style={styles.fileChipRemove}
                >
                  <Text style={styles.fileChipRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.sectionLabel}>Add more files</Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Opening picker...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => handleCategory(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedFiles.length > 0 && (
        <View style={styles.sendContainer}>
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>
              Send {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCards,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { fontSize: 16, color: colors.textSecondary },
  selectedSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  selectedTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  selectedSize: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  selectedList: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  fileChip: {
    backgroundColor: colors.bgCards,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    width: 140,
    gap: 4,
  },
  fileChipIcon: { fontSize: 20 },
  fileChipName: {
    fontSize: 12,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  fileChipSize: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  fileChipRemove: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  fileChipRemoveText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
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
    aspectRatio: 1,
    backgroundColor: colors.bgCards,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: { fontSize: 28 },
  categoryLabel: {
    fontSize: 11,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  sendContainer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
});