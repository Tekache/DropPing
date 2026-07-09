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
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';
import { VisibilityMode } from '../types';

const VISIBILITY_OPTIONS: { mode: VisibilityMode; label: string; description: string }[] = [
  { mode: 'everyone', label: 'Everyone', description: 'Anyone with DropPing can see you' },
  { mode: 'contacts', label: 'Contacts Only', description: 'Only your saved contacts' },
  { mode: 'invisible', label: 'Invisible', description: 'You can send but not receive' },
  { mode: 'trusted', label: 'Trusted Devices', description: 'Only your trusted devices' },
];

const LANGUAGES = ['English', 'French', 'Arabic', 'Spanish', 'Portuguese'];

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ToggleRow({ label, subtitle, value, onValueChange }: { label: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const {
    userProfile,
    visibilityMode,
    theme,
    language,
    batterySaver,
    addToGallery,
    autoOrganize,
    saveLocation,
    setUserProfile,
    setVisibility,
    setTheme,
    setLanguage,
    setBatterySaver,
    setAddToGallery,
    setAutoOrganize,
    setSaveLocation,
    saveSettings,
  } = useAppStore();

  const [showLanguages, setShowLanguages] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.displayName);

  const handleSaveName = () => {
    setUserProfile({ displayName: nameInput });
    saveSettings();
    setEditingName(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Settings</Text>

      <SectionTitle title="Profile" />
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Display Name</Text>
          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
              />
              <TouchableOpacity onPress={handleSaveName}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text style={styles.rowValue}>{userProfile.displayName} ✏️</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={styles.rowLabel}>Device Name</Text>
          <Text style={styles.rowValue}>{userProfile.deviceName}</Text>
        </View>
      </View>

      <SectionTitle title="Visibility" />
      <View style={styles.card}>
        {VISIBILITY_OPTIONS.map(({ mode, label, description }, index) => (
          <TouchableOpacity
            key={mode}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
            onPress={() => { setVisibility(mode); saveSettings(); }}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowSubtitle}>{description}</Text>
            </View>
            <View style={[styles.radio, visibilityMode === mode && styles.radioActive]}>
              {visibilityMode === mode && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Storage" />
      <View style={styles.card}>
        <ToggleRow
          label="Add Photos to Gallery"
          value={addToGallery}
          onValueChange={(v) => { setAddToGallery(v); saveSettings(); }}
        />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <ToggleRow
            label="Auto Organize by Type"
            value={autoOrganize}
            onValueChange={(v) => { setAutoOrganize(v); saveSettings(); }}
          />
        </View>
        {Platform.OS === 'android' && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <ToggleRow
              label="Use SD Card"
              subtitle="Save received files to SD card"
              value={saveLocation === 'sdcard'}
              onValueChange={(v) => { setSaveLocation(v ? 'sdcard' : 'internal'); saveSettings(); }}
            />
          </View>
        )}
      </View>

      <SectionTitle title="Appearance" />
      <View style={styles.card}>
        {(['dark', 'light', 'system'] as const).map((t, index) => (
          <TouchableOpacity
            key={t}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
            onPress={() => { setTheme(t); saveSettings(); }}
          >
            <Text style={styles.rowLabel}>{t.charAt(0).toUpperCase() + t.slice(1)} Mode</Text>
            <View style={[styles.radio, theme === t && styles.radioActive]}>
              {theme === t && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Language" />
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowLanguages(!showLanguages)}
        >
          <Text style={styles.rowLabel}>Language</Text>
          <Text style={styles.rowValue}>{language} {showLanguages ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showLanguages && LANGUAGES.map((lang, index) => (
          <TouchableOpacity
            key={lang}
            style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}
            onPress={() => { setLanguage(lang); saveSettings(); setShowLanguages(false); }}
          >
            <Text style={[styles.rowLabel, language === lang && { color: colors.accent }]}>{lang}</Text>
            {language === lang && <Text style={{ color: colors.accent }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Battery" />
      <View style={styles.card}>
        <ToggleRow
          label="Battery Saver"
          subtitle="Reduces background scanning when enabled"
          value={batterySaver}
          onValueChange={(v) => { setBatterySaver(v); saveSettings(); }}
        />
      </View>

      <SectionTitle title="Pro" />
      {userProfile.isPro ? (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>DropPing Pro</Text>
            <Text style={{ color: colors.success }}>✓ Active</Text>
          </View>
        </View>
      ) : (
        <View style={styles.proCard}>
          <Text style={styles.proTitle}>Upgrade to Pro</Text>
          <Text style={styles.proSubtitle}>Send to unlimited people • No file size limit • Custom themes</Text>
          <TouchableOpacity style={styles.proButton}>
            <Text style={styles.proButtonText}>Upgrade — $2.99</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionTitle title="About" />
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={styles.rowLabel}>Privacy Policy</Text>
          <Text style={styles.rowValue}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <Text style={styles.rowLabel}>Terms of Service</Text>
          <Text style={styles.rowValue}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.xl },
  header: { fontSize: 22, fontFamily: typography.fonts.extrabold, color: colors.textPrimary, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 13, fontFamily: typography.fonts.semibold, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: colors.bgCards, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base, minHeight: 52 },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: typography.fonts.regular, color: colors.textPrimary },
  rowSubtitle: { fontSize: 12, fontFamily: typography.fonts.regular, color: colors.textSecondary, marginTop: 2 },
  rowValue: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  nameEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameInput: { borderWidth: 1, borderColor: colors.primary, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 4, color: colors.textPrimary, fontSize: 14, minWidth: 120 },
  saveText: { color: colors.accent, fontFamily: typography.fonts.semibold, fontSize: 14 },
  proCard: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.lg },
  proTitle: { fontSize: 18, fontFamily: typography.fonts.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  proSubtitle: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textPrimary, opacity: 0.8, marginBottom: spacing.lg },
  proButton: { backgroundColor: colors.textPrimary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  proButtonText: { fontSize: 15, fontFamily: typography.fonts.bold, color: colors.primary },
});