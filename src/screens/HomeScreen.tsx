import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Svg, Circle, Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';
import { NearbyDevice, VisibilityMode } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

const MOCK_DEVICES: NearbyDevice[] = [
  {
    id: '1',
    name: "Sarah's iPhone",
    deviceType: 'ios',
    avatar: 'S',
    isOnline: true,
    visibilityMode: 'everyone',
    isTrusted: true,
    signalStrength: 85,
    lastSeen: new Date(),
  },
  {
    id: '2',
    name: "Mike's Samsung",
    deviceType: 'android',
    avatar: 'M',
    isOnline: true,
    visibilityMode: 'contacts',
    isTrusted: false,
    signalStrength: 65,
    lastSeen: new Date(),
  },
];

const VISIBILITY_OPTIONS: { mode: VisibilityMode; label: string }[] = [
  { mode: 'everyone', label: 'Everyone' },
  { mode: 'contacts', label: 'Contacts' },
  { mode: 'invisible', label: 'Invisible' },
  { mode: 'trusted', label: 'Trusted' },
];

function getVisibilityColor(mode: VisibilityMode) {
  switch (mode) {
    case 'everyone': return colors.success;
    case 'contacts': return colors.primary;
    case 'invisible': return colors.textSecondary;
    case 'trusted': return colors.gold;
  }
}

function SignalBars({ strength }: { strength: number }) {
  const filled = Math.ceil((strength / 100) * 3);
  return (
    <View style={styles.signalBars}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.signalBar,
            { height: 8 + i * 4, opacity: i < filled ? 1 : 0.3 },
          ]}
        />
      ))}
    </View>
  );
}

function DeviceAvatar({ name, isTrusted }: { name: string; isTrusted: boolean }) {
  return (
    <View style={styles.avatarContainer}>
      <Svg width={44} height={44} viewBox="0 0 44 44">
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        <Circle cx="22" cy="22" r="22" fill="url(#grad)" />
        <SvgText
          x="22"
          y="30"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill={colors.textPrimary}
        >
          {name.charAt(0).toUpperCase()}
        </SvgText>
      </Svg>
      {isTrusted && (
        <View style={styles.trustBadge}>
          <Text style={styles.trustEmoji}>🛡️</Text>
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="8" fill={colors.accent} />
        <Circle cx="60" cy="60" r="22" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.8" />
        <Circle cx="60" cy="60" r="38" fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.5" />
        <Circle cx="60" cy="60" r="54" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.3" />
      </Svg>
      <Text style={styles.emptyTitle}>Scanning for nearby devices</Text>
      <Text style={styles.emptySubtitle}>Make sure others have DropPing open</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { visibilityMode, nearbyDevices, isDiscoverable, setVisibility, toggleDiscoverable, setNearbyDevices } = useAppStore();

  useEffect(() => {
    setNearbyDevices(MOCK_DEVICES);
  }, []);

  const handleSend = async (device: NearbyDevice) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Send', { deviceId: device.id, deviceName: device.name });
  };

  const handleVisibility = async (mode: VisibilityMode) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisibility(mode);
  };

  const handleActivate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleDiscoverable();
  };

  const renderDevice = ({ item }: { item: NearbyDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceLeft}>
        <DeviceAvatar name={item.name} isTrusted={item.isTrusted} />
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceType}>{item.deviceType === 'ios' ? 'iPhone' : 'Android'}</Text>
        </View>
      </View>
      <View style={styles.deviceRight}>
        <SignalBars strength={item.signalStrength} />
        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(item)}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DropPing</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('QRCode')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <View style={[styles.visibilityPill, { borderColor: getVisibilityColor(visibilityMode) }]}>
            <View style={[styles.visibilityDot, { backgroundColor: getVisibilityColor(visibilityMode) }]} />
            <Text style={styles.visibilityText}>
              {visibilityMode.charAt(0).toUpperCase() + visibilityMode.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.visibilityRow}>
        {VISIBILITY_OPTIONS.map(({ mode, label }) => (
          <Pressable
            key={mode}
            style={[styles.visibilityPillOption, visibilityMode === mode && styles.visibilityPillActive]}
            onPress={() => handleVisibility(mode)}
          >
            <Text style={[styles.visibilityPillText, visibilityMode === mode && styles.visibilityPillTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Devices</Text>
        <Text style={styles.sectionCount}>{nearbyDevices.length} found</Text>
      </View>

      {nearbyDevices.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={nearbyDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.deviceList}
        />
      )}

      <View style={styles.activateContainer}>
        <TouchableOpacity
          style={[styles.activateButton, isDiscoverable && styles.activateButtonOn]}
          onPress={handleActivate}
        >
          <Text style={[styles.activateText, isDiscoverable && styles.activateTextOn]}>
            {isDiscoverable ? 'Active' : 'Tap to Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.md },
  headerTitle: { fontSize: 22, fontFamily: typography.fonts.extrabold, color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingsButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 20 },
  visibilityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1, backgroundColor: colors.bgCards },
  visibilityDot: { width: 8, height: 8, borderRadius: 4 },
  visibilityText: { fontSize: 12, fontFamily: typography.fonts.semibold, color: colors.textSecondary },
  visibilityRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.base },
  visibilityPillOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.bgCards, alignItems: 'center' },
  visibilityPillActive: { backgroundColor: colors.primary },
  visibilityPillText: { fontSize: 12, fontFamily: typography.fonts.semibold, color: colors.textSecondary },
  visibilityPillTextActive: { color: colors.textPrimary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontFamily: typography.fonts.bold, color: colors.textPrimary },
  sectionCount: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSecondary },
  deviceList: { paddingHorizontal: spacing.base, gap: spacing.md },
  deviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bgCards, borderRadius: borderRadius.xl, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
  deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatarContainer: { position: 'relative' },
  trustBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.bgCards, justifyContent: 'center', alignItems: 'center' },
  trustEmoji: { fontSize: 10 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontFamily: typography.fonts.semibold, color: colors.textPrimary, marginBottom: 2 },
  deviceType: { fontSize: 12, fontFamily: typography.fonts.regular, color: colors.textSecondary },
  deviceRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  signalBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, backgroundColor: colors.primary, borderRadius: 2 },
  sendButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
  sendButtonText: { fontSize: 13, fontFamily: typography.fonts.semibold, color: colors.textPrimary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: spacing.xl },
  emptyTitle: { fontSize: 16, fontFamily: typography.fonts.semibold, color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  activateContainer: { paddingHorizontal: spacing.base, paddingBottom: spacing.xxl, paddingTop: spacing.lg, alignItems: 'center' },
  activateButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.bgCards, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border },
  activateButtonOn: { borderColor: colors.primary, backgroundColor: colors.bgCards, shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  activateText: { fontSize: 14, fontFamily: typography.fonts.semibold, color: colors.textSecondary },
  activateTextOn: { color: colors.accent },
});