import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useIAP, type Purchase } from 'expo-iap';
import { useAppStore } from '../store/useAppStore';
import { useThemeStore } from '../store/useThemeStore';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { DONATION_USDT_TRC20_ADDRESS, PRO_PRODUCT_ID, getInstallationId, isPurchaseVerificationConfigured, verifyPurchaseWithServer } from '../services/PurchaseService';
const LANGUAGES = ['English', 'French', 'Arabic', 'Spanish', 'Portuguese'];

function ProPurchaseCard({ c }: { c: typeof import('../constants/colors').colors }) {
  const { userProfile } = useAppStore();
  const [busy, setBusy] = useState(false);
  const handlerRef = useRef<((purchase: Purchase) => Promise<void>) | undefined>(undefined);
  const { connected, products, availablePurchases, fetchProducts, requestPurchase, restorePurchases, finishTransaction } = useIAP({
    onPurchaseSuccess: (purchase) => { void handlerRef.current?.(purchase); },
    onPurchaseError: (error) => { setBusy(false); Alert.alert('Purchase not completed', error.message); },
  });

  useEffect(() => {
    if (connected) fetchProducts({ skus: [PRO_PRODUCT_ID], type: 'in-app' }).catch(() => undefined);
  }, [connected, fetchProducts]);

  const processPurchase = useCallback(async (purchase: Purchase) => {
    if (purchase.productId !== PRO_PRODUCT_ID || busy) return;
    setBusy(true);
    try {
      const installationId = await getInstallationId();
      const entitlement = await verifyPurchaseWithServer(purchase, installationId);
      useAppStore.getState().setProEntitlement({ entitlementId: entitlement.entitlementId, deviceBound: entitlement.deviceBound });
      await finishTransaction({ purchase, isConsumable: false });
      await useAppStore.getState().saveSettings();
      Alert.alert('DropPing Pro activated', 'Lifetime Pro is now bound to this device.');
    } catch (error) {
      Alert.alert('Could not activate Pro', error instanceof Error ? error.message : 'The purchase could not be verified.');
    } finally { setBusy(false); }
  }, [busy, finishTransaction]);
  handlerRef.current = processPurchase;

  useEffect(() => {
    availablePurchases.filter((purchase) => purchase.productId === PRO_PRODUCT_ID).forEach((purchase) => { void processPurchase(purchase); });
  }, [availablePurchases, processPurchase]);

  const product = products.find((item) => item.id === PRO_PRODUCT_ID);
  const buy = async () => {
    if (!isPurchaseVerificationConfigured()) {
      Alert.alert('Pro checkout is being configured', 'Store purchases will be enabled after the receipt-verification API is connected.');
      return;
    }
    try {
      const installationId = await getInstallationId();
      await requestPurchase({ type: 'in-app', request: { apple: { sku: PRO_PRODUCT_ID, appAccountToken: installationId }, google: { skus: [PRO_PRODUCT_ID], obfuscatedAccountId: installationId, obfuscatedProfileId: installationId } } });
    } catch (error) { Alert.alert('Could not start purchase', error instanceof Error ? error.message : 'Please try again.'); }
  };

  if (userProfile.isPro && userProfile.proDeviceBound) return <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}><View style={styles.row}><Text style={[styles.rowLabel, { color: c.textPrimary }]}>DropPing Pro</Text><Text style={{ color: c.success, fontFamily: typography.fonts.semibold }}>◆ Lifetime active</Text></View></View>;
  return <>
    <View style={[styles.proCard, { backgroundColor: c.primary }]}>
      <Text style={[styles.proTitle, { color: c.textPrimary }]}>DropPing Pro</Text>
      <Text style={[styles.proDesc, { color: c.textPrimary }]}>Lifetime purchase. More simultaneous recipients, advanced transfer tools, and a Pro profile badge.</Text>
      <TouchableOpacity style={[styles.proBtn, { backgroundColor: c.textPrimary }]} onPress={buy} disabled={busy || !connected}>
        {busy ? <ActivityIndicator color={c.primary} /> : <Text style={[styles.proBtnText, { color: c.primary }]}>{product?.displayPrice || '$2.99'} · Unlock for life</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.restoreButton} onPress={() => restorePurchases().catch(() => Alert.alert('Restore failed', 'The store could not restore purchases.'))}><Text style={[styles.restoreText, { color: c.textPrimary }]}>Restore purchase</Text></TouchableOpacity>
      {!isPurchaseVerificationConfigured() && <Text style={[styles.paymentNote, { color: c.textPrimary }]}>Checkout is disabled until the secure verification API is configured.</Text>}
    </View>
    <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border, marginTop: spacing.md }]}>
      <Text style={[styles.rowLabel, { color: c.textPrimary, padding: spacing.base, paddingBottom: spacing.sm }]}>Support DropPing</Text>
      <Text style={[styles.cardHint, { color: c.textSecondary }]}>Donations are optional and never unlock Pro. USDT on TRON (TRC20):</Text>
      <Text selectable style={[styles.walletText, { color: c.textPrimary }]}>{DONATION_USDT_TRC20_ADDRESS}</Text>
      <Text style={[styles.cardHint, { color: c.textSecondary }]}>Minimum suggested donation: the equivalent of $1. Check the network carefully before sending.</Text>
    </View>
  </>;
}

export default function SettingsScreen() {
  const {
    userProfile,
    language,
    addToGallery,
    autoOrganize,
    saveLocation,
    deviceNicknames,
    nicknameChanges,
    notificationsEnabled,
    notificationSound,
    notificationVibration,
    setUserProfile,
    setLanguage,
    setAddToGallery,
    setAutoOrganize,
    setSaveLocation,
    setDeviceNickname,
    removeTrustedDevice,
    saveSettings,
    setNotificationPreferences,
  } = useAppStore();

  const { colors: c, mode: themeMode, setMode } = useThemeStore();
  const [showLanguages, setShowLanguages] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.displayName);
  const [phoneInput, setPhoneInput] = useState(userProfile.phoneNumber || '');
  const [emailInput, setEmailInput] = useState(userProfile.email || '');
  const [addressInput, setAddressInput] = useState(userProfile.address || '');
  const [deviceNameInput, setDeviceNameInput] = useState(userProfile.deviceName);

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

  const handleSaveDeviceName = () => {
    const nickname = deviceNameInput.trim();
    if (!nickname) return;
    if (!setDeviceNickname(userProfile.id, nickname)) {
      Alert.alert('Nickname limit reached', 'Free users can change their device nickname twice. Try again after the 60-day cooldown or unlock Pro for unlimited edits.');
      setDeviceNameInput(userProfile.deviceName);
      return;
    }
    setUserProfile({ deviceName: nickname });
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

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Contact card</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <Text style={[styles.cardHint, { color: c.textSecondary }]}>These details stay on this device and are only shared when you select them.</Text>
        <TextInput style={[styles.profileInput, { color: c.textPrimary, borderColor: c.border }]} value={phoneInput} onChangeText={setPhoneInput} onBlur={() => { setUserProfile({ phoneNumber: phoneInput.trim() || undefined }); saveSettings(); }} placeholder="Phone number" placeholderTextColor={c.textSecondary} keyboardType="phone-pad" />
        <TextInput style={[styles.profileInput, { color: c.textPrimary, borderColor: c.border }]} value={emailInput} onChangeText={setEmailInput} onBlur={() => { setUserProfile({ email: emailInput.trim() || undefined }); saveSettings(); }} placeholder="Email address" placeholderTextColor={c.textSecondary} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={[styles.profileInput, { color: c.textPrimary, borderColor: c.border }]} value={addressInput} onChangeText={setAddressInput} onBlur={() => { setUserProfile({ address: addressInput.trim() || undefined }); saveSettings(); }} placeholder="Address (optional)" placeholderTextColor={c.textSecondary} />
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Device identity</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <Text style={[styles.cardHint, { color: c.textSecondary }]}>This is the name other people see nearby. {userProfile.isPro ? 'Pro allows unlimited edits.' : `${Math.max(0, 2 - (nicknameChanges[userProfile.id]?.count || 0))} free change${Math.max(0, 2 - (nicknameChanges[userProfile.id]?.count || 0)) === 1 ? '' : 's'} remaining.`}</Text>
        <View style={styles.nameEditRow}>
          <TextInput style={[styles.profileInput, styles.deviceNameInput, { color: c.textPrimary, borderColor: c.border }]} value={deviceNameInput} onChangeText={setDeviceNameInput} maxLength={32} placeholder="Device nickname" placeholderTextColor={c.textSecondary} />
          <TouchableOpacity onPress={handleSaveDeviceName} style={[styles.inlineSave, { backgroundColor: c.primary }]}><Text style={[styles.saveBtn, { color: c.textPrimary }]}>Save</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Trusted devices</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        {userProfile.trustedDevices.length === 0 ? <Text style={[styles.cardHint, { color: c.textSecondary }]}>Accepted contact exchanges can be trusted for automatic acceptance.</Text> : userProfile.trustedDevices.map((deviceId) => (
          <View key={deviceId} style={styles.row}>
            <View style={styles.rowLeft}><Text style={[styles.rowLabel, { color: c.textPrimary }]} numberOfLines={1}>{deviceNicknames[deviceId] || deviceId}</Text><Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Automatic acceptance enabled</Text></View>
            <TouchableOpacity onPress={() => { removeTrustedDevice(deviceId); saveSettings(); }}><Text style={[styles.removeText, { color: c.error }]}>Remove</Text></TouchableOpacity>
          </View>
        ))}
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

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Notifications</Text>
      <View style={[styles.card, { backgroundColor: c.bgCards, borderColor: c.border }]}>
        <View style={styles.row}><View style={styles.rowLeft}><Text style={[styles.rowLabel, { color: c.textPrimary }]}>Incoming requests</Text><Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Show nearby transfer and contact alerts</Text></View><Switch value={notificationsEnabled} onValueChange={(value) => { setNotificationPreferences({ notificationsEnabled: value }); saveSettings(); }} trackColor={{ false: c.border, true: c.primary }} thumbColor={c.textPrimary} /></View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}><View style={styles.rowLeft}><Text style={[styles.rowLabel, { color: c.textPrimary }]}>Sound</Text><Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Use a short, quiet notification sound</Text></View><Switch value={notificationSound} onValueChange={(value) => { setNotificationPreferences({ notificationSound: value }); saveSettings(); }} trackColor={{ false: c.border, true: c.primary }} thumbColor={c.textPrimary} /></View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: c.border }]}><View style={styles.rowLeft}><Text style={[styles.rowLabel, { color: c.textPrimary }]}>Vibration</Text><Text style={[styles.rowSubtitle, { color: c.textSecondary }]}>Use haptics for incoming requests</Text></View><Switch value={notificationVibration} onValueChange={(value) => { setNotificationPreferences({ notificationVibration: value }); saveSettings(); }} trackColor={{ false: c.border, true: c.primary }} thumbColor={c.textPrimary} /></View>
      </View>

      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Pro</Text>
      <ProPurchaseCard c={c} />

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
  deviceNameInput: { flex: 1, marginHorizontal: 0, marginBottom: 0 },
  inlineSave: { borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveBtn: { fontSize: typography.sizes.base, fontFamily: typography.fonts.semibold },
  displayName: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, marginBottom: 4 },
  deviceNameText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular },
  removePhoto: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, marginTop: 4 },
  removeText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, minHeight: 52 },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular },
  rowSubtitle: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.regular, marginTop: 2 },
  rowValue: { fontSize: typography.sizes.base, fontFamily: typography.fonts.regular },
  cardHint: { fontSize: typography.sizes.xs, lineHeight: 18, padding: spacing.base, paddingBottom: spacing.sm },
  profileInput: { borderWidth: 1, borderRadius: borderRadius.md, marginHorizontal: spacing.base, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sizes.base },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  proCard: { borderRadius: borderRadius.xl, padding: spacing.lg },
  proTitle: { fontSize: typography.sizes.xl, fontFamily: typography.fonts.bold, marginBottom: spacing.sm },
  proDesc: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.regular, opacity: 0.85, marginBottom: spacing.lg },
  proBtn: { borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  proBtnText: { fontSize: typography.sizes.base, fontFamily: typography.fonts.bold },
  restoreButton: { alignItems: 'center', paddingTop: spacing.md },
  restoreText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold },
  paymentNote: { fontSize: typography.sizes.xs, lineHeight: 17, marginTop: spacing.md, opacity: 0.8 },
  walletText: { paddingHorizontal: spacing.base, fontSize: typography.sizes.xs, fontFamily: typography.fonts.semibold },
});
