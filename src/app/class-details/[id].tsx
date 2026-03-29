import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Student {
  _id: string;
  name: string;
  email?: string;
  rollNumber?: string;
  phone?: string;
  photo?: string;
  admissionNumber?: string;
}

interface Class {
  _id: string;
  name: string;
  section: string;
  students: Student[];
  classTeacher?: { name: string; _id: string };
}

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (id) {
      fetchClassDetails();
    }
  }, [id]);

  useEffect(() => {
    if (classData) {
      navigation.setOptions({
        title: `${classData.name} - Students`,
      });
    }
  }, [classData, navigation]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getClassById(id as string);
      if (response.success) {
        setClassData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch class details');
    } finally {
      setLoading(false);
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <TouchableOpacity
      onPress={() => router.push(`/student-details/${item._id}`)}
      style={[
        styles.studentCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.icon,
        },
      ]}>
      <ThemedView style={styles.studentContent}>
        <View style={styles.studentHeader}>
          <ThemedText type="subtitle" style={styles.studentName}>
            {item.name}
          </ThemedText>
          {item.rollNumber && (
            <ThemedText style={styles.rollNumber}>#{item.rollNumber}</ThemedText>
          )}
        </View>

        {item.admissionNumber && (
          <ThemedText style={styles.detail}>
            📝 Admission: {item.admissionNumber}
          </ThemedText>
        )}
        {item.email && (
          <ThemedText style={styles.detail} numberOfLines={1}>
            ✉️ {item.email}
          </ThemedText>
        )}
        {item.phone && (
          <ThemedText style={styles.detail}>
            📱 {item.phone}
          </ThemedText>
        )}

        <ThemedText style={styles.tapHint}>Tap to view full details →</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.error}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  if (!classData) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Class not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Class Info Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">{classData.name}</ThemedText>
        {classData.section && (
          <ThemedText style={styles.section}>Section: {classData.section}</ThemedText>
        )}
        {classData.classTeacher && (
          <ThemedText style={styles.teacher}>
            👨‍🏫 Class Teacher: {classData.classTeacher.name}
          </ThemedText>
        )}
        <ThemedText style={styles.enrolledCount}>
          📊 {classData.students?.length || 0} Students Enrolled
        </ThemedText>
      </ThemedView>

      {/* Students List */}
      {classData.students && classData.students.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>No students enrolled in this class</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={classData.students}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  section: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  teacher: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  enrolledCount: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  studentCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  studentContent: {
    padding: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  rollNumber: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
    marginLeft: 8,
  },
  detail: {
    fontSize: 13,
    marginBottom: 6,
    opacity: 0.8,
  },
  tapHint: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 20,
  },
});
