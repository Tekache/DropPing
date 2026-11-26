import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Animated,
  AppState,
  Dimensions,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Svg,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Path,
  Text as SvgText,
  Ellipse,
} from 'react-native-svg';
import { typography } from '../constants/typography';
import { spacing, borderRadius, shadows } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';
import { useThemeStore } from '../store/useThemeStore';
import { NearbyDevice } from '../types';
import QuickSettingsWidget from '../components/QuickSettingsWidget';
import { wifiDirectService } from '../services/WifiDirectService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getVisibilityColor(mode: string, c: typeof import('../constants/colors').colors) {
  switch (mode) {
    case 'everyone': return c.success;
    case 'contacts': return c.primary;
    case 'invisible': return c.textSecondary;
    case 'trusted': return c.gold;
    default: return c.primary;
  }
}

function DropPingLogo({
  size,
  isActive,
  onPress,
  onLongPress,
}: {
  size: number;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const ring1 = useRef(new Animated.Value(0.8)).current;
  const ring1Op = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0.8)).current;
  const ring2Op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
        ])
      ).start();

      const ringAnim = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.4, duration: 2000, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            ]),
          ])
        ).start();
      };

      ringAnim(ring1, ring1Op, 0);
      ringAnim(ring2, ring2Op, 800);
    } else {
      glowAnim.stopAnimation();
      ring1Op.stopAnimation();
      ring2Op.stopAnimation();
      Animated.timing(glowAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }).start();
      Animated.timing(ring1Op, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      Animated.timing(ring2Op, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isActive]);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={500}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute',
          width: size * 1.4,
          height: size * 1.4,
          borderRadius: size * 0.7,
          borderWidth: 1.5,
          borderColor: '#00E5FF',
          transform: [{ scale: ring1 }],
          opacity: ring1Op,
        }} />
        <Animated.View style={{
          position: 'absolute',
          width: size * 1.6,
          height: size * 1.6,
          borderRadius: size * 0.8,
          borderWidth: 1,
          borderColor: '#0057FF',
          transform: [{ scale: ring2 }],
          opacity: ring2Op,
        }} />
        <Animated.View style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: '#0D1E3A',
          borderWidth: 2,
          borderColor: isActive ? '#0057FF' : '#1A2A4A',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: glowAnim,
          ...shadows.blue,
        }}>
          <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 95 95" fill="none">
            <Defs>
              <LinearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="45%" stopColor="#00E5FF" />
                <Stop offset="100%" stopColor="#0057FF" />
              </LinearGradient>
              <LinearGradient id="pg3" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="100%" stopColor="#00E5FF" />
              </LinearGradient>
              <LinearGradient id="pg4" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#0057FF" stopOpacity="0" />
                <Stop offset="30%" stopColor="#00E5FF" />
                <Stop offset="70%" stopColor="#0057FF" />
                <Stop offset="100%" stopColor="#0057FF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path
              d="M17 16 L17 80 Q17 84 21 84 L31 84 Q35 84 35 80 L35 60 Q46 65 55 61 Q73 54 74 38 Q75 18 58 12 Q48 8 36 9 Q25 9 20 11 Z"
              fill="url(#pg1)"
            />
            <Path
              d="M35 17 L35 52 Q43 57 52 53 Q65 47 65 36 Q65 22 52 18 Q43 14 35 17 Z"
              fill="#050B1A"
              opacity="0.9"
            />
            <Path
              d="M8 72 Q20 62 32 72 Q44 82 56 72 Q66 64 80 70"
              stroke="url(#pg4)"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M78 10 C78 5 82 2 82 2 C82 2 86 5 86 10 C86 15 84 18 82 18 C80 18 78 15 78 10 Z"
              fill="url(#pg3)"
            />
          </Svg>
        </Animated.View>
      </View>
    </Pressable>
  );
}

function SignalBars({ strength, color }: { strength: number; color: string }) {
  const filled = Math.ceil((strength / 100) * 3);
  return (
    <View style={styles.signalBars}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.signalBar,
            { height: 8 + i * 4, backgroundColor: color, opacity: i < filled ? 1 : 0.2 },
          ]}
        />
      ))}
    </View>
  );
}

function DeviceCard({
  item,
  onSend,
  c,
}: {
  item: NearbyDevice;
  onSend: () => void;
  c: typeof import('../constants/colors').colors;
}) {
  const initials = item.name.charAt(0).toUpperCase();

  return (
    <View style={[styles.deviceCard, { backgroundColor: c.bgCards, borderColor: c.border }]}>
      <View style={styles.deviceLeft}>
        <View style={styles.avatarWrapper}>
          <Svg width={48} height={48} viewBox="0 0 48 48">
            <Defs>
              <LinearGradient id={`ag${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={c.primary} />
                <Stop offset="100%" stopColor={c.accent} />
              </LinearGradient>
            </Defs>
            <Circle cx="24" cy="24" r="24" fill={`url(#ag${item.id})`} />
            <SvgText x="24" y="32" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#FFFFFF">
              {initials}
            </SvgText>
          </Svg>
          {item.isTrusted && (
            <View style={[styles.trustBadge, { backgroundColor: c.bgCards }]}>
              <Text style={{ fontSize: 10 }}>🛡️</Text>
            </View>
          )}
        </View>

        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, { color: c.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.deviceMeta}>
            <Text style={[styles.deviceType, { color: c.textSecondary }]}>
              {item.deviceType === 'ios' ? '📱 iPhone' : '📱 Android'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.deviceRight}>
        <SignalBars strength={item.signalStrength} color={c.primary} />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: c.primary, ...shadows.blue }]}
          onPress={onSend}
        >
          <Text style={[styles.sendButtonText, { color: c.textPrimary }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ c }: { c: typeof import('../constants/colors').colors }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: fadeAnim }}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <Circle cx="70" cy="70" r="10" fill={c.accent} />
          <Circle cx="70" cy="70" r="25" fill="none" stroke={c.accent} strokeWidth="1.5" opacity="0.8" />
          <Circle cx="70" cy="70" r="42" fill="none" stroke={c.primary} strokeWidth="1" opacity="0.5" />
          <Circle cx="70" cy="70" r="60" fill="none" stroke={c.accent} strokeWidth="0.8" opacity="0.3" />
        </Svg>
      </Animated.View>
      <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>Scanning for nearby devices</Text>
      <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
        Make sure others have DropPing open
      </Text>
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
    setVisibility,
    loadSettings,
  } = useAppStore();

  const { colors: c } = useThemeStore();
  const [widgetVisible, setWidgetVisible] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadSettings();
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active' && isDiscoverable) {
        try {
          await wifiDirectService.startDiscovery(setNearbyDevices);
        } catch (error) {
          Alert.alert('Wi-Fi Direct unavailable', error instanceof Error ? error.message : 'Enable Wi-Fi and Nearby devices permission.');
        }
      }
      appState.current = nextAppState;
    });

    if (isDiscoverable) {
      wifiDirectService.startDiscovery(setNearbyDevices).catch((error) => {
        Alert.alert('Wi-Fi Direct unavailable', error instanceof Error ? error.message : 'Enable Wi-Fi and Nearby devices permission.');
      });
    }

    return () => {
      subscription.remove();
      wifiDirectService.stopDiscovery().catch(() => undefined);
      wifiDirectService.destroy();
    };
  }, [isDiscoverable, loadSettings, setNearbyDevices]);

  const handleLogoPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isDiscoverable) {
      await wifiDirectService.stopDiscovery();
      setNearbyDevices([]);
      toggleDiscoverable();
      return;
    }

    try {
      await wifiDirectService.startDiscovery(setNearbyDevices);
      toggleDiscoverable();
    } catch (error) {
      Alert.alert('Could not start discovery', error instanceof Error ? error.message : 'Enable Wi-Fi and Nearby devices permission.');
    }
  }, [isDiscoverable, setNearbyDevices, toggleDiscoverable]);

  const handleLogoLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setWidgetVisible(true);
  }, []);

  const handleSend = useCallback(async (device: NearbyDevice) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Send', { deviceId: device.id, deviceName: device.name });
  }, [navigation]);

  const visibilityColor = getVisibilityColor(visibilityMode, c);

  const renderDevice = ({ item }: { item: NearbyDevice }) => (
    <DeviceCard item={item} onSend={() => handleSend(item)} c={c} />
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <DropPingLogo
          size={56}
          isActive={isDiscoverable}
          onPress={handleLogoPress}
          onLongPress={handleLogoLongPress}
        />

        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { borderColor: visibilityColor, backgroundColor: c.bgCards }]}>
            <View style={[styles.statusDot, { backgroundColor: visibilityColor }]} />
            <Text style={[styles.statusText, { color: visibilityColor }]}>
              {isDiscoverable ? visibilityMode.charAt(0).toUpperCase() + visibilityMode.slice(1) : 'Off'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Nearby Devices</Text>
        <Text style={[styles.sectionCount, { color: c.textSecondary }]}>
          {nearbyDevices.length} found
        </Text>
      </View>

      {nearbyDevices.length === 0 ? (
        <EmptyState c={c} />
      ) : (
        <FlatList
          data={nearbyDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.deviceList}
          showsVerticalScrollIndicator={false}
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
  sectionCount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  deviceList: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    ...shadows.card,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarWrapper: { position: 'relative' },
  trustBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: { flex: 1 },
  deviceName: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semibold,
    marginBottom: 3,
  },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deviceType: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  deviceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signalBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, borderRadius: 2 },
  sendButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  sendButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
