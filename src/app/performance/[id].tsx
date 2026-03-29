import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import type { UserRole } from '@/src/types';

interface PerformanceItem {
  _id: string;
  title: string;
  type: 'exam' | 'test' | 'assignment';
  marksObtained: number;
  totalMarks: number;
  percentage?: number;
  academicYear: string;
  remarks?: string;
  date?: string;
  subject?: { _id: string; name: string; code?: string };
}

interface StudentBasic {
  _id: string;
  name?: string;
  studentId?: string;
  rollNumber?: string | number;
}

const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const roleValue = (role: unknown): UserRole | null => {
  if (!role) return null;
  if (typeof role === 'string') return role as UserRole;
  const typed = role as { role?: UserRole };
  return typed.role || null;
};

const prettyType = (type: PerformanceItem['type']) => {
  if (type === 'assignment') return 'Assignment';
  if (type === 'test') return 'Test';
  return 'Exam';
};

export default function StudentPerformanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const role = roleValue(user?.role);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [year, setYear] = useState(currentAcademicYear());
  const [student, setStudent] = useState<StudentBasic | null>(null);
  const [items, setItems] = useState<PerformanceItem[]>([]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }).map((_, idx) => {
      const start = now - idx;
      return `${start}-${String(start + 1).slice(-2)}`;
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [studentRes, perfRes] = await Promise.all([
        apiService.getStudentById(id),
        apiService.getStudentPerformance(id),
      ]);

      if (!studentRes.success || !studentRes.data) {
        throw new Error(studentRes.msg || 'Unable to load student profile');
      }

      setStudent({
        _id: (studentRes.data as unknown as { _id: string })._id,
        name: (studentRes.data as unknown as { name?: string }).name,
        studentId: (studentRes.data as unknown as { studentId?: string }).studentId,
        rollNumber: (studentRes.data as unknown as { rollNumber?: string | number }).rollNumber,
      });

      const perfData = (perfRes.data as unknown as PerformanceItem[]) || [];
      setItems(Array.isArray(perfData) ? perfData : []);

      navigation.setOptions({ title: `${(studentRes.data as { name?: string }).name || 'Student'} Performance` });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load performance data');
    }
  }, [id, navigation]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await loadData();
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const onDelete = (item: PerformanceItem) => {
    Alert.alert('Delete Performance', `Delete ${item.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiService.deleteProgress(item._id);
            if (!res.success) throw new Error(res.msg || 'Failed to delete');
            setItems((prev) => prev.filter((p) => p._id !== item._id));
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete performance');
          }
        },
      },
    ]);
  };

  const openReport = async (format: 'basic' | 'advanced' | 'styled' | 'cbse') => {
    if (!id) return;
    try {
      const url = await apiService.getProgressReportDownloadUrl(format, id);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to open report URL');
    }
  };

  const filteredItems = useMemo(
    () => items.filter((p) => !year || p.academicYear === year),
    [items, year],
  );

  const totals = useMemo(() => {
    if (filteredItems.length === 0) return { count: 0, avg: 0 };
    const sum = filteredItems.reduce((acc, item) => {
      const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
      return acc + pct;
    }, 0);
    return {
      count: filteredItems.length,
      avg: Number((sum / filteredItems.length).toFixed(2)),
    };
  }, [filteredItems]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (role !== 'admin' && role !== 'teacher') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Access Denied</ThemedText>
        <ThemedText>Only admin and teacher can manage student performance.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ThemedView style={[styles.heroCard, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle" style={styles.heroTitle}>Performance Console</ThemedText>
        <ThemedText style={styles.heroName}>{student?.name || 'Student'}</ThemedText>
        <ThemedText style={styles.heroMeta}>
          Student ID: {student?.studentId || 'N/A'} | Roll: {student?.rollNumber ?? 'N/A'}
        </ThemedText>

        <View style={styles.quickStatsRow}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(22,163,74,0.10)' }]}>
            <ThemedText style={styles.statValue}>{totals.count}</ThemedText>
            <ThemedText style={styles.statLabel}>Records</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(2,132,199,0.10)' }]}>
            <ThemedText style={styles.statValue}>{totals.avg}%</ThemedText>
            <ThemedText style={styles.statLabel}>Avg %</ThemedText>
          </View>
        </View>

        <Pressable
          style={[styles.addButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push({ pathname: '/performance/add/[id]', params: { id: String(id) } })}>
          <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
          <ThemedText style={styles.addButtonText}>Add Performance</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={[styles.yearCard, { borderColor: theme.icon }]}> 
        <ThemedText type="defaultSemiBold">Academic Year</ThemedText>
        <View style={styles.chipsRow}>
          {years.map((y) => {
            const selected = y === year;
            return (
              <Pressable
                key={y}
                onPress={() => setYear(y)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? theme.tint : 'rgba(127,127,127,0.10)',
                    borderColor: selected ? theme.tint : theme.icon,
                  },
                ]}>
                <ThemedText style={[styles.chipText, { color: selected ? '#fff' : theme.text }]}>{y}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView style={[styles.reportCard, { borderColor: theme.icon }]}> 
        <ThemedText type="defaultSemiBold">Download PDF (Different Formats)</ThemedText>
        <View style={styles.reportButtonsRow}>
          <Pressable style={[styles.reportBtn, { backgroundColor: '#1d4ed8' }]} onPress={() => void openReport('basic')}>
            <ThemedText style={styles.reportBtnText}>Basic</ThemedText>
          </Pressable>
          <Pressable style={[styles.reportBtn, { backgroundColor: '#0f766e' }]} onPress={() => void openReport('advanced')}>
            <ThemedText style={styles.reportBtnText}>Advanced</ThemedText>
          </Pressable>
          <Pressable style={[styles.reportBtn, { backgroundColor: '#7c3aed' }]} onPress={() => void openReport('styled')}>
            <ThemedText style={styles.reportBtnText}>Styled</ThemedText>
          </Pressable>
          <Pressable style={[styles.reportBtn, { backgroundColor: '#b45309' }]} onPress={() => void openReport('cbse')}>
            <ThemedText style={styles.reportBtnText}>CBSE</ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      {filteredItems.length === 0 ? (
        <ThemedView style={[styles.emptyCard, { borderColor: theme.icon }]}> 
          <ThemedText>No performance records for {year}.</ThemedText>
        </ThemedView>
      ) : (
        filteredItems.map((item) => {
          const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
          const pctColor = pct >= 85 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626';
          return (
            <ThemedView key={item._id} style={[styles.itemCard, { borderColor: theme.icon }]}> 
              <View style={styles.itemTopRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                  <ThemedText style={styles.itemSub}>
                    {item.subject?.name || 'Subject'} • {prettyType(item.type)} • {item.academicYear}
                  </ThemedText>
                </View>
                <View style={[styles.pill, { backgroundColor: `${pctColor}22` }]}>
                  <ThemedText style={[styles.pillText, { color: pctColor }]}>{pct.toFixed(1)}%</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.scoreLine}>Score: {item.marksObtained} / {item.totalMarks}</ThemedText>
              {!!item.remarks && <ThemedText style={styles.remarks}>Remarks: {item.remarks}</ThemedText>}

              <View style={styles.itemActionsRow}>
                <Pressable
                  style={[styles.itemActionBtn, { backgroundColor: '#1d4ed8' }]}
                  onPress={() =>
                    router.push({
                      pathname: '/performance/edit/[progressId]',
                      params: { progressId: item._id, studentId: String(id) },
                    })
                  }>
                  <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                  <ThemedText style={styles.itemActionText}>Update</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.itemActionBtn, { backgroundColor: '#dc2626' }]}
                  onPress={() => onDelete(item)}>
                  <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                  <ThemedText style={styles.itemActionText}>Delete</ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(30,64,175,0.05)',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroMeta: {
    fontSize: 12,
    opacity: 0.75,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  addButton: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  yearCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  reportButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportBtn: {
    borderRadius: 10,
    minHeight: 36,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  reportBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemSub: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.75,
  },
  scoreLine: {
    fontSize: 13,
    fontWeight: '700',
  },
  remarks: {
    fontSize: 12,
    opacity: 0.8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  itemActionsRow: {
    marginTop: 2,
    flexDirection: 'row',
    gap: 8,
  },
  itemActionBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  itemActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});