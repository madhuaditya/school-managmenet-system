import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { AppAlert } from '@/src/types';

export default function MyAlertsTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [items, setItems] = useState<AppAlert[]>([]);

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getUnviewedAlerts();
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch alerts.');
      }

      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const markViewed = async (alertId: string) => {
    try {
      setMarkingId(alertId);
      const response = await apiService.markAlertAsViewed(alertId);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to mark alert as viewed.');
      }
      setItems((prev) => prev.filter((entry) => entry._id !== alertId));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update alert.');
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.tint} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchAlerts(true)} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No unviewed alerts.</ThemedText>}
          renderItem={({ item }) => (
            <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <ThemedText type="defaultSemiBold">{item.title || 'Alert'}</ThemedText>
              <ThemedText>{item.message}</ThemedText>
              <ThemedText style={styles.metaText}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Now'}</ThemedText>

              <Pressable
                style={[styles.actionBtn, markingId === item._id && styles.disabled]}
                disabled={markingId === item._id}
                onPress={() => markViewed(item._id)}>
                {markingId === item._id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.actionText}>Mark as Viewed</ThemedText>
                )}
              </Pressable>
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 20, gap: 10 },
  emptyText: { marginTop: 14, opacity: 0.7 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  metaText: { opacity: 0.7, fontSize: 12 },
  actionBtn: {
    marginTop: 4,
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  actionText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
