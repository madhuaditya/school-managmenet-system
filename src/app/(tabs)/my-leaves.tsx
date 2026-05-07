import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { LeaveRequest } from '@/src/types';

type LeaveStatusFilter = 'all' | 'pending' | 'approved' | 'declined';

const statusColor: Record<Exclude<LeaveStatusFilter, 'all'>, string> = {
  pending: '#D97706',
  approved: '#16A34A',
  declined: '#DC2626',
};

export default function MyLeavesTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<LeaveStatusFilter>('all');
  const [items, setItems] = useState<LeaveRequest[]>([]);

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getMyLeaves(status === 'all' ? undefined : { status });
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch leaves.');
      }

      const payload = response.data;
      if (Array.isArray(payload)) {
        setItems(payload);
      } else {
        setItems(payload?.leaves || payload?.data || []);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch leaves.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    void fetchLeaves();
  }, [fetchLeaves]);

  const counts = useMemo(() => {
    const summary = { pending: 0, approved: 0, declined: 0 };
    items.forEach((item) => {
      if (item.status in summary) {
        summary[item.status as keyof typeof summary] += 1;
      }
    });
    return summary;
  }, [items]);

  const deletePending = async (leaveId: string) => {
    try {
      const response = await apiService.deleteMyLeave(leaveId);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to delete leave request.');
      }
      setItems((prev) => prev.filter((entry) => entry._id !== leaveId));
      Alert.alert('Success', 'Pending leave deleted.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete leave request.');
    }
  };

  const renderLeave = ({ item }: { item: LeaveRequest }) => {
    const color = statusColor[item.status] || '#6B7280';
    return (
      <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <View style={styles.rowBetween}>
          <ThemedText type="defaultSemiBold">
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
            <ThemedText style={[styles.badgeText, { color }]}>{item.status.toUpperCase()}</ThemedText>
          </View>
        </View>

        <ThemedText>{item.reason || 'No reason provided'}</ThemedText>
        {item.reviewRemark ? <ThemedText style={styles.reviewText}>Review: {item.reviewRemark}</ThemedText> : null}

        {item.status === 'pending' ? (
          <Pressable style={styles.deleteBtn} onPress={() => deletePending(item._id)}>
            <ThemedText style={styles.deleteText}>Delete Pending Request</ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.filterRow}>
        {(['all', 'pending', 'approved', 'declined'] as LeaveStatusFilter[]).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => setStatus(entry)}
            style={[styles.chip, status === entry ? styles.chipActive : styles.chipIdle]}>
            <ThemedText style={status === entry ? styles.chipTextActive : styles.chipTextIdle}>{entry}</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={styles.countText}>
        Pending {counts.pending} | Approved {counts.approved} | Declined {counts.declined}
      </ThemedText>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.tint} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchLeaves(true)} />}
          renderItem={renderLeave}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No leave requests found.</ThemedText>}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: '#2563EB' },
  chipIdle: { backgroundColor: '#E5E7EB' },
  chipTextActive: { color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  chipTextIdle: { color: '#111827', textTransform: 'capitalize' },
  countText: { marginTop: 8, opacity: 0.75 },
  listContent: { paddingTop: 10, paddingBottom: 20, gap: 10 },
  emptyText: { opacity: 0.7, marginTop: 18 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  reviewText: { opacity: 0.8, fontSize: 12 },
  deleteBtn: {
    marginTop: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
  },
  deleteText: { color: '#B91C1C', fontWeight: '700' },
});
