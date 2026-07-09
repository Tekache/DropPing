import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'Send'>;

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

  const handleCategory = async (categoryId: string) => {
    setLoading(true);
    try {
      if (categoryId === 'photos') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 1,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          navigation.replace('TransferProgress', {
            fileName: asset.fileName || 'photo',
            fileSize: asset.fileSize || 0,
            deviceName,
            deviceId,
          });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          navigation.replace('TransferProgress', {
            fileName: asset.name,
            fileSize: asset.size || 0,
            deviceName,
            deviceId,
          });
        }
      }
    } catch (e) {
      console.log('Picker error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Send to</Text>
          <Text style={styles.headerTitle}>{deviceName}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>What do you want to share?</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerSub: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSecondary },
  headerTitle: { fontSize: 20, fontFamily: typography.fonts.bold, color: colors.textPrimary },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCards, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, color: colors.textSecondary },
  sectionLabel: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary, paddingHorizontal: spacing.base, paddingTop: spacing.lg, paddingBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.md },
  categoryCard: { width: '30%', aspectRatio: 1, backgroundColor: colors.bgCards, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  categoryIcon: { fontSize: 28 },
  categoryLabel: { fontSize: 11, fontFamily: typography.fonts.semibold, color: colors.textPrimary, textAlign: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary },
});