import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Contacts from 'expo-contacts/legacy';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';
import { wifiDirectService } from '../services/WifiDirectService';
import { ContactCard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactPreview'>;

export default function ContactPreviewScreen({ navigation, route }: Props) {
  const isSend = route.params.mode === 'send';
  const profile = useAppStore((state) => state.userProfile);
  const addTrustedDevice = useAppStore((state) => state.addTrustedDevice);
  const incoming = route.params.contact;
  const [name, setName] = useState(incoming?.displayName || profile.displayName);
  const [phone, setPhone] = useState(incoming?.phoneNumbers[0] || profile.phoneNumber || '');
  const [email, setEmail] = useState(incoming?.emails[0] || profile.email || '');
  const [address, setAddress] = useState(incoming?.address || profile.address || '');
  const [sharePhone, setSharePhone] = useState(true);
  const [shareEmail, setShareEmail] = useState(Boolean(email));
  const [shareAddress, setShareAddress] = useState(Boolean(address));
  const [busy, setBusy] = useState(false);

  const card = useMemo<ContactCard>(() => ({
    displayName: name.trim(),
    phoneNumbers: sharePhone && phone.trim() ? [phone.trim()] : [],
    emails: shareEmail && email.trim() ? [email.trim()] : [],
    address: shareAddress && address.trim() ? address.trim() : undefined,
    avatarUri: isSend ? profile.avatar : incoming?.avatarUri,
  }), [name, phone, email, address, sharePhone, shareEmail, shareAddress, profile.avatar, incoming?.avatarUri, isSend]);

  const handleSend = async () => {
    if (!card.displayName || (!card.phoneNumbers.length && !card.emails.length)) {
      Alert.alert('Add contact details', 'Enter a name and at least a phone number or email before sharing.');
      return;
    }
    setBusy(true);
    try {
      if (!route.params.deviceId) throw new Error('The receiving device is no longer available.');
      await wifiDirectService.connectToPeer(route.params.deviceId);
      await wifiDirectService.sendContactOffer({ contact: card, senderName: profile.displayName, senderId: profile.id, senderAvatar: profile.avatar });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Contact sent', 'The recipient can choose which details to save.', [{ text: 'Done', onPress: () => navigation.navigate('Main') }]);
    } catch (error) {
      Alert.alert('Could not share contact', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  const handleSave = async () => {
    if (!incoming) return;
    setBusy(true);
    try {
      await wifiDirectService.sendTransferDecision(true);
      const permission = await Contacts.requestPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Contacts permission was denied.');
      await Contacts.addContactAsync({
        contactType: Contacts.ContactTypes.Person,
        name: card.displayName,
        firstName: card.displayName.split(' ')[0] || card.displayName,
        lastName: card.displayName.split(' ').slice(1).join(' '),
        phoneNumbers: card.phoneNumbers.map((number) => ({ label: 'mobile', number })),
        emails: card.emails.map((value) => ({ label: 'email', email: value })),
        addresses: card.address ? [{ label: 'home', street: card.address }] : [],
      });
      if (route.params.senderId) {
        addTrustedDevice(route.params.senderId);
        await useAppStore.getState().saveSettings();
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Contact saved', `${card.displayName} was added to your contacts.`, [{ text: 'Done', onPress: () => navigation.navigate('Main') }]);
    } catch (error) {
      await wifiDirectService.sendTransferDecision(false, 'Contacts permission was denied.').catch(() => undefined);
      Alert.alert('Could not save contact', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  const handleReject = async () => {
    await wifiDirectService.sendTransferDecision(false, 'Contact declined').catch(() => undefined);
    navigation.goBack();
  };

  const Toggle = ({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) => <TouchableOpacity style={styles.toggleRow} onPress={onPress}><Text style={styles.toggleLabel}>{label}</Text><View style={[styles.toggle, value && styles.toggleOn]}><View style={[styles.toggleKnob, value && styles.toggleKnobOn]} /></View></TouchableOpacity>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Text style={styles.title}>{isSend ? 'Share contact card' : 'Contact received'}</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity></View>
        {!isSend && <Text style={styles.receivedFrom}>From {route.params.senderName || 'Nearby device'}</Text>}
        <View style={styles.avatar}>{card.avatarUri ? <Image source={{ uri: card.avatarUri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || '?'}</Text>}</View>
        <TextInput value={name} onChangeText={setName} editable={isSend} style={styles.name} placeholder="Full name" placeholderTextColor={colors.textSecondary} />
        <Text style={styles.section}>{isSend ? 'Choose details to share' : 'Review before saving'}</Text>
        <View style={styles.card}>
          <View style={styles.field}><Text style={styles.fieldLabel}>Phone</Text><TextInput value={phone} onChangeText={setPhone} editable={isSend} style={styles.input} placeholder="Phone number" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" /></View>
          <View style={styles.field}><Text style={styles.fieldLabel}>Email</Text><TextInput value={email} onChangeText={setEmail} editable={isSend} style={styles.input} placeholder="Email address" placeholderTextColor={colors.textSecondary} keyboardType="email-address" autoCapitalize="none" /></View>
          <View style={styles.field}><Text style={styles.fieldLabel}>Address</Text><TextInput value={address} onChangeText={setAddress} editable={isSend} style={styles.input} placeholder="Address (optional)" placeholderTextColor={colors.textSecondary} /></View>
        </View>
        {isSend ? <View style={styles.options}><Toggle label="Phone number" value={sharePhone} onPress={() => setSharePhone(!sharePhone)} /><Toggle label="Email" value={shareEmail} onPress={() => setShareEmail(!shareEmail)} /><Toggle label="Address" value={shareAddress} onPress={() => setShareAddress(!shareAddress)} /></View> : <Text style={styles.note}>Only the details shown above will be saved. You can edit the name before saving.</Text>}
        {isSend ? <TouchableOpacity style={styles.primaryButton} onPress={handleSend} disabled={busy}>{busy ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Send contact card</Text>}</TouchableOpacity> : <View style={styles.buttons}><TouchableOpacity style={styles.secondaryButton} onPress={handleReject} disabled={busy}><Text style={styles.secondaryText}>Reject</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={busy}>{busy ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.primaryText}>Save contact</Text>}</TouchableOpacity></View>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.bgPrimary }, content: { padding: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.xxl }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 22, fontFamily: typography.fonts.extrabold, color: colors.textPrimary }, cancel: { color: colors.accent, fontSize: typography.sizes.base }, receivedFrom: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg }, avatar: { alignSelf: 'center', width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, overflow: 'hidden' }, avatarImage: { width: '100%', height: '100%' }, avatarText: { fontSize: 38, fontFamily: typography.fonts.bold, color: colors.textPrimary }, name: { textAlign: 'center', color: colors.textPrimary, fontSize: 22, fontFamily: typography.fonts.bold, marginTop: spacing.md, padding: spacing.sm }, section: { color: colors.textSecondary, fontSize: typography.sizes.sm, fontFamily: typography.fonts.semibold, marginTop: spacing.xl, marginBottom: spacing.sm }, card: { backgroundColor: colors.bgCards, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, field: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingHorizontal: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border }, fieldLabel: { width: 70, color: colors.textSecondary, fontFamily: typography.fonts.semibold }, input: { flex: 1, color: colors.textPrimary, fontSize: typography.sizes.base }, options: { marginTop: spacing.md, backgroundColor: colors.bgCards, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border }, toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border }, toggleLabel: { color: colors.textPrimary, fontSize: typography.sizes.base }, toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 3 }, toggleOn: { backgroundColor: colors.primary }, toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textSecondary }, toggleKnobOn: { alignSelf: 'flex-end', backgroundColor: colors.textPrimary }, note: { color: colors.textSecondary, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: spacing.md }, buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }, primaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl }, secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl }, primaryText: { color: colors.textPrimary, fontFamily: typography.fonts.bold }, secondaryText: { color: colors.textSecondary, fontFamily: typography.fonts.semibold },
});
