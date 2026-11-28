import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Modal,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';
import { quickSettingsService } from '../services/QuickSettingsService';
import { VisibilityMode } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const VISIBILITY_OPTIONS: {
  mode: VisibilityMode;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    mode: 'everyone',
    label: 'Everyone',
    description: 'Anyone with DropPing',
    icon: '🌍',
    color: colors.success,
  },
  {
    mode: 'contacts',
    label: 'Contacts',
    description: 'Your saved contacts only',
    icon: '👥',
    color: colors.primary,
  },
  {
    mode: 'invisible',
    label: 'Off',
    description: 'No discovery or receiving',
    icon: '—',
    color: colors.textSecondary,
  },
];

export default function QuickSettingsWidget({ visible, onClose }: Props) {
  const { visibilityMode, isDiscoverable, setVisibility, toggleDiscoverable } = useAppStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleVisibility = async (mode: VisibilityMode) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisibility(mode);
    await quickSettingsService.setDiscoverable(mode !== 'invisible');
    if ((mode === 'invisible') === isDiscoverable) toggleDiscoverable();
    onClose();
  };

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await quickSettingsService.setDiscoverable(!isDiscoverable);
    toggleDiscoverable();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.widget,
            {
              width: Math.min(width - spacing.base * 2, 440),
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetTitleRow}>
                <Text style={styles.widgetTitle}>DropPing</Text>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    isDiscoverable && styles.togglePillOn,
                  ]}
                  onPress={handleToggle}
                >
                  <View style={[styles.toggleDot, isDiscoverable && styles.toggleDotOn]} />
                  <Text style={[styles.toggleText, isDiscoverable && styles.toggleTextOn]}>
                    {isDiscoverable ? 'On' : 'Off'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.widgetSubtitle}>
                {isDiscoverable
                  ? `Visible to ${visibilityMode}`
                  : 'Not discoverable'}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Visibility</Text>

            <View style={styles.optionsGrid}>
              {VISIBILITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.optionCard,
                    visibilityMode === opt.mode && styles.optionCardActive,
                    visibilityMode === opt.mode && { borderColor: opt.color },
                  ]}
                  onPress={() => handleVisibility(opt.mode)}
                >
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      visibilityMode === opt.mode && { color: opt.color },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc} numberOfLines={2}>
                    {opt.description}
                  </Text>
                  {visibilityMode === opt.mode && (
                    <View style={[styles.activeDot, { backgroundColor: opt.color }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  widget: {
    backgroundColor: colors.bgCards,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  widgetHeader: { padding: spacing.base },
  widgetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  widgetTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.extrabold,
    color: colors.textPrimary,
  },
  widgetSubtitle: {
    fontSize: 13,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  togglePillOn: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  toggleDotOn: { backgroundColor: colors.primary },
  toggleText: {
    fontSize: 13,
    fontFamily: typography.fonts.semibold,
    color: colors.textSecondary,
  },
  toggleTextOn: { color: colors.primary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.base,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  optionCard: {
    width: '47%',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
  },
  optionCardActive: {
    backgroundColor: colors.bgPrimary,
  },
  optionIcon: { fontSize: 22, marginBottom: 6 },
  optionLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  activeDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
