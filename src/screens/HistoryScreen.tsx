import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/layout';
import { useTransferStore } from '../store/useTransferStore';
import { TransferItem } from '../types';
import { formatFileSize, formatTimestamp, getFileCategory } from '../utils/formatters';

export default function HistoryScreen() {
  const { transferHistory, removeFromHistory, clearHistory } = useTransferStore();

  const handleDelete = (id: string) => {
    Alert.alert('Remove', 'Remove this transfer from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromHistory(id) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear History', 'Remove all transfer history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearHistory },
    ]);
  };

  const renderItem = ({ item }: { item: TransferItem }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.fileIcon}>{getFileCategory(item.fileType, item.fileName)}</Text>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
          <Text style={styles.fileMeta}>
            {formatFileSize(item.fileSize)} • {item.direction === 'sent' ? '↑ Sent' : '↓ Received'} • {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'complete' ? colors.success + '22' : colors.error + '22' }]}>
          <Text style={[styles.statusText, { color: item.status === 'complete' ? colors.success : colors.error }]}>
            {item.status === 'complete' ? '✓' : '✗'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {transferHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {transferHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No transfers yet</Text>
          <Text style={styles.emptySubtitle}>Your transfer history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={transferHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.md },
  headerTitle: { fontSize: 22, fontFamily: typography.fonts.extrabold, color: colors.textPrimary },
  clearText: { fontSize: 14, fontFamily: typography.fonts.semibold, color: colors.error },
  list: { paddingHorizontal: spacing.base, gap: spacing.md },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bgCards, borderRadius: borderRadius.xl, padding: spacing.base, borderWidth: 1, borderColor: colors.border },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  fileIcon: { fontSize: 28 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontFamily: typography.fonts.semibold, color: colors.textPrimary, marginBottom: 4 },
  fileMeta: { fontSize: 12, fontFamily: typography.fonts.regular, color: colors.textSecondary },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statusText: { fontSize: 14, fontWeight: '700' },
  deleteButton: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  deleteText: { fontSize: 14, color: colors.textSecondary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 18, fontFamily: typography.fonts.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtitle: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textSecondary },
});