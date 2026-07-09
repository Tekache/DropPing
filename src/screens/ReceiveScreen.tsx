import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { formatFileSize } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Receive'>;

export default function ReceiveScreen({ navigation, route }: Props) {
  const { senderName, fileName, fileSize, senderId } = route.params;
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleAccept = () => {
    navigation.replace('TransferProgress', {
      fileName,
      fileSize,
      deviceName: senderName,
      deviceId: senderId,
    });
  };

  const handleDecline = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.senderName}>{senderName}</Text>
        <Text style={styles.fileInfo}>wants to send you</Text>
        <Text style={styles.fileName}>{fileName}</Text>
        <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary + 'CC', justifyContent: 'flex-end', padding: spacing.base },
  card: { backgroundColor: colors.bgCards, borderRadius: borderRadius.xxl, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 28, fontFamily: typography.fonts.bold, color: colors.textPrimary },
  senderName: { fontSize: 20, fontFamily: typography.fonts.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  fileInfo: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary, marginBottom: spacing.sm },
  fileName: { fontSize: 16, fontFamily: typography.fonts.semibold, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
  fileSize: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSecondary, marginBottom: spacing.xl },
  buttons: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  declineButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  declineText: { fontSize: 15, fontFamily: typography.fonts.semibold, color: colors.textSecondary },
  acceptButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: 'center' },
  acceptText: { fontSize: 15, fontFamily: typography.fonts.semibold, color: colors.textPrimary },
});