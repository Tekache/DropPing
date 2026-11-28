import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store/useAppStore';
import { useThemeStore } from '../store/useThemeStore';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
const LANGUAGES = ['English', 'French', 'Arabic', 'Spanish', 'Portuguese'];

export default function SettingsScreen() {
  const {
    userProfile,
    language,
    addToGallery,
    autoOrganize,
    saveLocation,
    setUserProfile,
    setLanguage,
    setAddToGallery,
    setAutoOrganize,
    setSaveLocation,
    saveSettings,
  } = useAppStore();

  const { colors: c, mode: themeMode, setMode } = useThemeStore();
  const [showLanguages, setShowLanguages] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.displayName);

  const handleSaveName = () => {
    setUserProfile({ displayName: nameInput });
    saveSettings();
    setEditingName(false);
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaType.Images,
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUserProfile({ avatar: result.assets[0].uri });
      saveSettings();
    }
  };

  const handleRemoveAvatar = () => {
    setUserProfile({ avatar: undefined });
    saveSettings();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.pageTitle, { color: c.textPrimary }]}>Settings</Text>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Profile</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <TouchableOpacity style={styles.profileRow} onPress={handlePickAvatar}>
          <View style={styles.avatarContainer}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: c.primary }]}>
                <Text style={styles.avatarInitial}>
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.cameraIcon, { backgroundColor: c.bgSecondary, borderColor: c.border }]}>
              <Text style={{ fontSize: 12 }}>📷</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={[styles.nameInput, { color: c.textPrimary, borderColor: c.primary }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  placeholderTextColor={c.textSecondary}
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <Text style={[styles.saveBtn, { color: c.accent }]}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Text style={[styles.displayName, { color: c.textPrimary }]}>
                  {userProfile.displayName} ✏️
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.deviceNameText, { color: c.textSecondary }]}>
              {userProfile.deviceName}
            </Text>
            {userProfile.avatar && (
              <TouchableOpacity onPress={handleRemoveAvatar}>
                <Text style={[styles.removePhoto, { color: c.error }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        {(['dark', 'light', 'system'] as const).map((t, index) => (
          <TouchableOpacity
            key={t}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}
            onPress={() => setMode(t)}
          >
            <Text style={{ fontSize: 20, marginRight: spacing.md }}>
              {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '📱'}
            </Text>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: c.textPrimary }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)} Mode
              </Text>
            </View>
            <View style={[styles.radio, { borderColor: themeMode === t ? c.primary : c.border }]}>
              {themeMode === t && <View style={[styles.radioDot, { backgroundColor: c.primary }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Storage</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Add Photos to Gallery</Text>
          </View>
          <Switch
            value={addToGallery}
            onValueChange={(v) => { setAddToGallery(v); saveSettings(); }}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={c.textPrimary}
          />
        </View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}>
          <View style={styles.rowLeft}>
            <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Auto Organize by Type</Text>
          </View>
          <Switch
            value={autoOrganize}
            onValueChange={(v) => { setAutoOrganize(v); saveSettings(); }}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={c.textPrimary}
          />
        </View>
        {Platform.OS === 'android' && (
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Use SD Card</Text>
              <Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Save files to SD card</Text>
            </View>
            <Switch
              value={saveLocation === 'sdcard'}
              onValueChange={(v) => { setSaveLocation(v ? 'sdcard' : 'internal'); saveSettings(); }}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.textPrimary}
            />
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Language</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowLanguages(!showLanguages)}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Language</Text>
          </View>
          <Text style={[styles.rowValue, { color: c.textSecondary }]}>
            {language} {showLanguages ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
        {showLanguages && LANGUAGES.map((lang, index) => (
          <TouchableOpacity
            key={lang}
            style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}
            onPress={() => { setLanguage(lang); saveSettings(); setShowLanguages(false); }}
          >
            <Text style={[styles.rowLabel, { color: language === lang ? c.accent : c.textPrimary }]}>
              {lang}
            </Text>
            {language === lang && <Text style={{ color: c.accent }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Pro</Text>
      {userProfile.isPro ? (
        <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: c.textPrimary }]}>DropPing Pro</Text>
            <Text style={{ color: c.success, fontFamily: typography.fonts.semibold }}>✓ Active</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.proCard, { backgroundColor: c.primary }]}>
          <Text style={[styles.proTitle, { color: c.textPrimary }]}>Upgrade to Pro</Text>
          <Text style={[styles.proDesc, { color: c.textPrimary }]}>
            Send to unlimited people • No file size limit • Priority support
          </Text>
          <TouchableOpacity style={[styles.proBtn, { backgroundColor: c.textPrimary }]}>
            <Text style={[styles.proBtnText, { color: c.primary }]}>Upgrade — $2.99</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>About</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Version</Text>
          <Text style={[styles.rowValue, { color: c.textSecondary }]}>1.0.0</Text>
        </View>
        <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}>
          <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Privacy Policy</Text>
          <Text style={[styles.rowValue, { color: c.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}>
          <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Terms of Service</Text>
          <Text style={[styles.rowValue, { color: c.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.xl },
  pageTitle: { fontSize: typography.sizes.xxxl, fontFamily: typography.fonts.extrabold, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: { borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.lg },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 28, fontFamily: typography.fonts.bold, color: '#FFFFFF' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  profileInfo: { flex: 1 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameInput: {
    borderWidth: 1, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    fontSize: typography.sizes.base, flex: 1,
  },
  saveBtn: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold },
  displayName: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, marginBottom: 4 },
  deviceNameText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },
  removePhoto: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, minHeight: 52 },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular },
  rowSubtitle: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, marginTop: 2 },
  rowValue: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  proCard: { borderRadius: borderRadius.xl, padding: spacing.lg },
  proTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, marginBottom: spacing.sm },
  proDesc: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, opacity: 0.85, marginBottom: spacing.lg },
  proBtn: { borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  proBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold },
});
