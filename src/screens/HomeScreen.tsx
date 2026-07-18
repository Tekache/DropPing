import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Animated,
  AppState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Svg,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';
import { NearbyDevice } from '../types';
import QuickSettingsWidget from '../components/QuickSettingsWidget';

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

function getVisibilityColor(mode: string) {
  switch (mode) {
    case 'everyone': return colors.success;
    case 'contacts': return colors.primary;
    case 'invisible': return colors.textSecondary;
    case 'trusted': return colors.gold;
    default: return colors.primary;
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Circle cx="60" cy="60" r="8" fill={colors.accent} />
          <Circle cx="60" cy="60" r="22" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.8" />
          <Circle cx="60" cy="60" r="38" fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.5" />
          <Circle cx="60" cy="60" r="54" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.3" />
        </Svg>
      </Animated.View>
      <Text style={styles.emptyTitle}>Scanning for nearby devices</Text>
      <Text style={styles.emptySubtitle}>Make sure others have DropPing open</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const {
    visibilityMode,
    nearbyDevices,
    isDiscoverable,
    setNearbyDevices,
    toggleDiscoverable,
    loadSettings,
  } = useAppStore();

  const [widgetVisible, setWidgetVisible] = useState(false);
  const logoScale = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadSettings();
    setNearbyDevices(MOCK_DEVICES);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setNearbyDevices(MOCK_DEVICES);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogoLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setWidgetVisible(true);
  };

  const handleSend = async (device: NearbyDevice) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Send', {
      deviceId: device.id,
      deviceName: device.name,
    });
  };

  const renderDevice = ({ item }: { item: NearbyDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceLeft}>
        <DeviceAvatar name={item.name} isTrusted={item.isTrusted} />
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceType}>
            {item.deviceType === 'ios' ? 'iPhone' : 'Android'}
          </Text>
        </View>
      </View>
      <View style={styles.deviceRight}>
        <SignalBars strength={item.signalStrength} />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSend(item)}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onLongPress={handleLogoLongPress} delayLongPress={500}>
          <Animated.Text
            style={[
              styles.headerTitle,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            DropPing
          </Animated.Text>
        </Pressable>
        <TouchableOpacity
          style={[
            styles.visibilityPill,
            { borderColor: getVisibilityColor(visibilityMode) },
          ]}
          onPress={() => setWidgetVisible(true)}
        >
          <View
            style={[
              styles.visibilityDot,
              { backgroundColor: getVisibilityColor(visibilityMode) },
            ]}
          />
          <Text style={styles.visibilityText}>
            {visibilityMode.charAt(0).toUpperCase() + visibilityMode.slice(1)}
          </Text>
        </TouchableOpacity>
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

      <QuickSettingsWidget
        visible={widgetVisible}
        onClose={() => setWidgetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: typography.fonts.extrabold,
    color: colors.textPrimary,
  },
  visibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    backgroundColor: colors.bgCards,
  },
  visibilityDot: { width: 8, height: 8, borderRadius: 4 },
  visibilityText: {
    fontSize: 12,
    fontFamily: typography.fonts.semibold,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  deviceList: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCards,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarContainer: { position: 'relative' },
  trustBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.bgCards,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustEmoji: { fontSize: 10 },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontSize: 15,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  deviceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sendButtonText: {
    fontSize: 13,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});