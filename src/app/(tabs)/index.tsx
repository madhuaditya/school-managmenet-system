import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OverviewStats {
  totalAdmins: number;
  totalClasses: number;
  totalStudents: number;
  totalTeachers?: number;
  totalSubjects?: number;
  totalStaff?: number;
}

interface NoticeItem {
  _id: string;
  title: string;
  details: string;
  date: string;
  validity: string;
}

type DayFilter = 'All' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface ClassItem {
  _id: string;
  name: string;
  grade?: string | number;
  section?: string;
}

interface SubjectItem {
  _id: string;
  name?: string;
  code?: string;
}

interface TimetableItem {
  _id: string;
  name?: string;
  day?: string;
  class?: ClassItem | string;
  classId?: string;
  periods?: Array<{
    subject?: SubjectItem | string;
    startTime: string;
    endTime: string;
    hour?: number;
  }>;
}

const DAYS: DayFilter[] = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'school' | 'class'>('school');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayFilter>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<'All' | string>('All');

  const loadOverview = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [overviewResponse, noticeResponse, classesResponse, timetableResponse] = await Promise.all([
        apiService.getSchoolOverview(),
        apiService.getValidNotices(),
        apiService.getClasses(),
        apiService.getAllTimetables(),
      ]);

      if (!overviewResponse.success || !overviewResponse.data) {
        throw new Error(overviewResponse.msg || 'Failed to fetch school overview');
      }

      if (!noticeResponse.success) {
        throw new Error(noticeResponse.msg || 'Failed to fetch notices');
      }

      if (!classesResponse.success) {
        throw new Error(classesResponse.msg || 'Failed to fetch classes');
      }

      if (!timetableResponse.success) {
        throw new Error(timetableResponse.msg || 'Failed to fetch timetable');
      }

      setStats(overviewResponse.data);
      setNotices(Array.isArray(noticeResponse.data) ? (noticeResponse.data as unknown as NoticeItem[]) : []);
      setClasses(Array.isArray(classesResponse.data) ? (classesResponse.data as unknown as ClassItem[]) : []);
      setTimetables(Array.isArray(timetableResponse.data) ? (timetableResponse.data as unknown as TimetableItem[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch school overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const loadFilteredTimetable = useCallback(async () => {
    try {
      setTableLoading(true);
      let response;

      if (viewMode === 'class' && selectedClassId) {
        if (selectedDay === 'All') {
          response = await apiService.getTimetableByClass(selectedClassId);
        } else {
          response = await apiService.getTimetableByDay(selectedDay, selectedClassId);
        }
      } else if (selectedDay === 'All') {
        response = await apiService.getAllTimetables();
      } else {
        response = await apiService.getTimetableByDay(selectedDay);
      }

      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch timetable');
      }

      setTimetables(Array.isArray(response.data) ? (response.data as unknown as TimetableItem[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setTableLoading(false);
    }
  }, [selectedClassId, selectedDay, viewMode]);

  useEffect(() => {
    void loadFilteredTimetable();
  }, [loadFilteredTimetable]);

  const getClassName = (item: TimetableItem) => {
    if (item.class && typeof item.class === 'object') {
      return `${item.class.name}${item.class.section ? ` (${item.class.section})` : ''}`;
    }

    const classId = item.classId || (typeof item.class === 'string' ? item.class : '');
    const cls = classes.find((entry) => entry._id === classId);
    if (!cls) return 'Class';
    return `${cls.name}${cls.section ? ` (${cls.section})` : ''}`;
  };

  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    timetables.forEach((item) => {
      (item.periods || []).forEach((period) => {
        if (period.subject && typeof period.subject === 'object' && period.subject._id) {
          map.set(period.subject._id, period.subject.name || period.subject.code || 'Subject');
        }
      });
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [timetables]);

  const filteredTimetables = useMemo(() => {
    if (selectedSubjectId === 'All') return timetables;

    return timetables.filter((item) =>
      (item.periods || []).some((period) => {
        if (period.subject && typeof period.subject === 'object') {
          return period.subject._id === selectedSubjectId;
        }
        if (typeof period.subject === 'string') {
          return period.subject === selectedSubjectId;
        }
        return false;
      }),
    );
  }, [selectedSubjectId, timetables]);

  const getSubjectName = (subject: SubjectItem | string | undefined) => {
    if (!subject) return 'Subject';
    if (typeof subject === 'string') {
      const matched = subjectOptions.find((entry) => entry.id === subject);
      return matched?.label || 'Subject';
    }
    return subject.name || subject.code || 'Subject';
  };

  const overviewItems = [
    { label: 'Total Admins', value: stats?.totalAdmins ?? 0, icon: 'admin-panel-settings' },
    { label: 'Total Classes', value: stats?.totalClasses ?? 0, icon: 'menu-book' },
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: 'school' },
    { label: 'Total Subjects', value: stats?.totalSubjects ?? 0, icon: 'library-books' },
    { label: 'Total Teachers', value: stats?.totalTeachers ?? 0, icon: 'groups' },
    { label: 'Total Staff', value: stats?.totalStaff ?? 0, icon: 'badge' },
  ] as const;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadOverview(true)} />}>
      <ThemedText style={styles.subtitle}>School Overview</ThemedText>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <ThemedView style={[styles.statsBox, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        {overviewItems.map((item) => (
          <View key={item.label} style={styles.statsRow}>
            <View style={styles.statsLeft}>
              <View style={[styles.iconWrap, { backgroundColor: `${theme.tint}1f` }]}>
                <MaterialIcons name={item.icon} size={18} color={theme.tint} />
              </View>
              <ThemedText style={styles.cardLabel}>{item.label}</ThemedText>
            </View>
            <ThemedText type="title">{item.value}</ThemedText>
          </View>
        ))}
      </ThemedView>

      <ThemedText type="subtitle" style={styles.noticeHeading}>Valid Notices (Latest to Old)</ThemedText>
      {notices.length === 0 ? (
        <ThemedText style={styles.emptyNoticeText}>No valid notices available</ThemedText>
      ) : (
        notices.map((item) => (
          <ThemedView key={item._id} style={[styles.noticeCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText>{item.details}</ThemedText>
            <ThemedText style={styles.noticeMeta}>
              Date: {new Date(item.date).toLocaleDateString()} | Valid till: {new Date(item.validity).toLocaleDateString()}
            </ThemedText>
          </ThemedView>
        ))
      )}

      <ThemedText type="subtitle" style={styles.noticeHeading}>Timetable</ThemedText>
      <ThemedText style={styles.filterHint}>Filter by school/class, day and subject</ThemedText>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => {
            setViewMode('school');
            setSelectedClassId(null);
          }}
          style={[styles.filterChip, { borderColor: theme.icon, backgroundColor: viewMode === 'school' ? theme.tint : theme.background }]}>
          <ThemedText style={{ color: viewMode === 'school' ? '#fff' : theme.text, fontWeight: '600' }}>Own School</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('class')}
          style={[styles.filterChip, { borderColor: theme.icon, backgroundColor: viewMode === 'class' ? theme.tint : theme.background }]}>
          <ThemedText style={{ color: viewMode === 'class' ? '#fff' : theme.text, fontWeight: '600' }}>School Class</ThemedText>
        </Pressable>
      </View>

      {viewMode === 'class' ? (
        <View style={styles.filterRow}>
          {classes.length === 0 ? (
            <ThemedText style={styles.emptyNoticeText}>No classes found</ThemedText>
          ) : (
            classes.map((cls) => (
              <Pressable
                key={cls._id}
                onPress={() => setSelectedClassId(cls._id)}
                style={[styles.filterChip, { borderColor: theme.icon, backgroundColor: selectedClassId === cls._id ? theme.tint : theme.background }]}> 
                <ThemedText style={{ color: selectedClassId === cls._id ? '#fff' : theme.text, fontWeight: '600' }}>
                  {cls.name}{cls.section ? ` (${cls.section})` : ''}
                </ThemedText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {DAYS.map((day) => (
          <Pressable
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[styles.filterChip, { borderColor: theme.icon, backgroundColor: selectedDay === day ? theme.tint : theme.background }]}>
            <ThemedText style={{ color: selectedDay === day ? '#fff' : theme.text, fontWeight: '600' }}>{day}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setSelectedSubjectId('All')}
          style={[styles.filterChip, { borderColor: theme.icon, backgroundColor: selectedSubjectId === 'All' ? theme.tint : theme.background }]}>
          <ThemedText style={{ color: selectedSubjectId === 'All' ? '#fff' : theme.text, fontWeight: '600' }}>All Subjects</ThemedText>
        </Pressable>
        {subjectOptions.map((subject) => (
          <Pressable
            key={subject.id}
            onPress={() => setSelectedSubjectId(subject.id)}
            style={[styles.filterChip, { borderColor: theme.icon, backgroundColor: selectedSubjectId === subject.id ? theme.tint : theme.background }]}>
            <ThemedText style={{ color: selectedSubjectId === subject.id ? '#fff' : theme.text, fontWeight: '600' }}>{subject.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {tableLoading ? (
        <ThemedView style={styles.centered}><ActivityIndicator size="small" color={theme.tint} /></ThemedView>
      ) : filteredTimetables.length === 0 ? (
        <ThemedText style={styles.emptyNoticeText}>No timetable found for selected filters</ThemedText>
      ) : (
        filteredTimetables.map((item) => (
          <ThemedView key={item._id} style={[styles.noticeCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
            <ThemedText type="defaultSemiBold">{item.name || 'Timetable'} | {item.day || 'Day'}</ThemedText>
            <ThemedText style={styles.noticeMeta}>Class: {getClassName(item)}</ThemedText>
            {(item.periods || []).map((period, idx) => (
              <ThemedText key={`${item._id}-${idx}`}>
                {idx + 1}. {getSubjectName(period.subject)} | {period.startTime} - {period.endTime}
              </ThemedText>
            ))}
          </ThemedView>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    opacity: 0.75,
  },
  errorText: {
    color: '#d93025',
    fontSize: 13,
    marginTop: 6,
  },
  statsBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    opacity: 0.75,
    fontSize: 13,
  },
  noticeHeading: {
    marginTop: 8,
  },
  emptyNoticeText: {
    opacity: 0.7,
    fontSize: 13,
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  noticeMeta: {
    opacity: 0.65,
    fontSize: 12,
  },
  filterHint: {
    opacity: 0.75,
    fontSize: 12,
    marginTop: -2,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
