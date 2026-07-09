import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'QRCode'>;

export default function QRCodeScreen({ navigation }: Props) {
  const { userProfile } = useAppStore();
  const qrData = JSON.stringify({ id: userProfile.id, name: userProfile.displayName });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My QR Code</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={220}
          color={colors.textPrimary}
          backgroundColor={colors.bgCards}
        />
      </View>

      <Text style={styles.name}>{userProfile.displayName}</Text>
      <Text style={styles.subtitle}>Scan this to connect instantly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  title: { fontSize: 22, fontFamily: typography.fonts.extrabold, color: colors.textPrimary },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCards, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, color: colors.textSecondary },
  qrContainer: { alignSelf: 'center', padding: spacing.xl, backgroundColor: colors.bgCards, borderRadius: borderRadius.xxl, borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl },
  name: { fontSize: 20, fontFamily: typography.fonts.bold, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xl },
  subtitle: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});