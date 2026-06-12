import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

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
  const [search, setSearch] = useState('');
  const router = useRouter();

  const currentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const start = month >= 4 ? year : year - 1;
    return `${start}-${String(start + 1).slice(-2)}`;
  };

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((subject) => {
      const name = String(subject?.name || '').toLowerCase();
      const code = String(subject?.code || '').toLowerCase();
      const teacher = String(subject?.teacher?.user?.name || '').toLowerCase();
      const className = String(subject?.class?.name || '').toLowerCase();
      return name.includes(term) || code.includes(term) || teacher.includes(term) || className.includes(term);
    });
  }, [search, subjects]);

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
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search subjects, teachers, or classes"
          style={{ marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}
        />
      </View>

      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/subjects/${item._id}`)} style={styles.card}>
            <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
            <ThemedText style={styles.meta}>Code: {item.code || 'N/A'}</ThemedText>
            <ThemedText style={styles.meta}>Max Marks: {item.maxMarks ?? 'N/A'}</ThemedText>
            <ThemedText style={styles.meta}>
              Class: {item.class?.name ? `${item.class.name}${item.class.grade ? ` (${item.class.grade})` : ''}${item.class.section ? ` - ${item.class.section}` : ''}` : 'N/A'}
            </ThemedText>
            <ThemedText style={styles.meta}>Teacher: {item.teacher?.user?.name || 'N/A'}</ThemedText>
          </Pressable>
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
