import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import type { LeaveRequest, UserRole } from '@/src/types';

const getRole = (role?: UserRole | { role?: UserRole }) => {
  if (!role) return '';
  return typeof role === 'string' ? role : role.role || '';
};

export default function LeaveReviewTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const user = useAuthStore((state) => state.user);
  const role = getRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getAdminLeaves();
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch leave requests.');
      }

      const payload = response.data;
      const rawItems = Array.isArray(payload) ? payload : payload?.leaves || payload?.data || [];
      setItems(rawItems);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch leave requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      void fetchLeaves();
      return;
    }
    setLoading(false);
  }, [fetchLeaves, role]);

  const pendingCount = useMemo(() => items.filter((item) => item.status === 'pending').length, [items]);

  const review = async (leaveId: string, action: 'approve' | 'decline') => {
    try {
      setSubmittingId(leaveId);
      const response = await apiService.reviewLeave(leaveId, {
        action,
        reviewRemark: remarks[leaveId]?.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to review leave.');
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry._id === leaveId
            ? {
                ...entry,
                status: action === 'approve' ? 'approved' : 'declined',
                reviewRemark: remarks[leaveId]?.trim() || entry.reviewRemark,
              }
            : entry,
        ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to review leave.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (role !== 'admin') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Access denied. Admin role is required.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.countText}>Pending requests: {pendingCount}</ThemedText>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.tint} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchLeaves(true)} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No leave requests found.</ThemedText>}
          renderItem={({ item }) => {
            const actor = typeof item.userId === 'object' ? item.userId : undefined;
            return (
              <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                <View style={styles.rowBetween}>
                  <ThemedText type="defaultSemiBold">{actor?.name || 'User'}</ThemedText>
                  <ThemedText style={styles.statusText}>{item.status.toUpperCase()}</ThemedText>
                </View>

                <ThemedText style={styles.metaText}>From: {new Date(item.startDate).toLocaleDateString()}</ThemedText>
                <ThemedText style={styles.metaText}>To: {new Date(item.endDate).toLocaleDateString()}</ThemedText>
                <ThemedText>{item.reason || 'No reason provided'}</ThemedText>

                <TextInput
                  value={remarks[item._id] || ''}
                  onChangeText={(text) => setRemarks((prev) => ({ ...prev, [item._id]: text }))}
                  placeholder="Optional review remark"
                  placeholderTextColor={theme.icon}
                  style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
                />

                {item.status === 'pending' ? (
                  <View style={styles.actionsRow}>
                    <Pressable
                      disabled={submittingId === item._id}
                      style={[styles.actionBtn, styles.approveBtn, submittingId === item._id && styles.disabled]}
                      onPress={() => review(item._id, 'approve')}>
                      <ThemedText style={styles.btnText}>Approve</ThemedText>
                    </Pressable>
                    <Pressable
                      disabled={submittingId === item._id}
                      style={[styles.actionBtn, styles.declineBtn, submittingId === item._id && styles.disabled]}
                      onPress={() => review(item._id, 'decline')}>
                      <ThemedText style={styles.btnText}>Decline</ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </ThemedView>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  countText: { fontSize: 13, opacity: 0.75 },
  listContent: { paddingTop: 10, paddingBottom: 24, gap: 10 },
  emptyText: { opacity: 0.7, marginTop: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '700', opacity: 0.8 },
  metaText: { opacity: 0.75, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: { backgroundColor: '#16A34A' },
  declineBtn: { backgroundColor: '#DC2626' },
  btnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
