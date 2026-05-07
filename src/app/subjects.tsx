import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

import { apiService } from '@/api/client';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface SubjectItem {
  _id: string;
  name: string;
  code?: string;
  maxMarks?: number;
  class?: { _id?: string; name?: string; grade?: string; section?: string };
  teacher?: { _id?: string; user?: { name?: string } };
}

export default function SubjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllSubjects();
        if (!response.success) throw new Error(response.msg || 'Failed to load subjects');
        setSubjects((Array.isArray(response.data) ? response.data : []) as SubjectItem[]);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    void loadSubjects();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Subjects</ThemedText>
        <ThemedText style={styles.subtitle}>{subjects.length} subjects found</ThemedText>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
            <ThemedText style={styles.meta}>Code: {item.code || 'N/A'}</ThemedText>
            <ThemedText style={styles.meta}>Max Marks: {item.maxMarks ?? 'N/A'}</ThemedText>
            <ThemedText style={styles.meta}>
              Class: {item.class?.name ? `${item.class.name}${item.class.grade ? ` (${item.class.grade})` : ''}${item.class.section ? ` - ${item.class.section}` : ''}` : 'N/A'}
            </ThemedText>
            <ThemedText style={styles.meta}>Teacher: {item.teacher?.user?.name || 'N/A'}</ThemedText>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <ThemedText>No subjects found.</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(21, 101, 192, 0.08)',
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.75,
  },
  list: {
    paddingBottom: 20,
  },
  meta: {
    marginTop: 4,
    opacity: 0.8,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 101, 192, 0.08)',
  },
});
