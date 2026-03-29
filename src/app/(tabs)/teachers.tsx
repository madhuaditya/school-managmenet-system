import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TeacherUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  city?: string;
  state?: string;
  address?: string;
  pinCode?: string;
}

interface TeacherSubject {
  _id: string;
  name?: string;
  code?: string;
}

interface TeacherClass {
  _id: string;
  name?: string;
  grade?: string;
  section?: string;
}

interface TeacherRecord {
  _id: string;
  user?: TeacherUser;
  teachSubjects?: TeacherSubject[];
  classTeacher?: TeacherClass;
  teachSclass?: TeacherClass[];
}

type AttendanceState = 'present' | 'absent' | 'leave' | 'not-marked';

export default function TeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingForTeacher, setSubmittingForTeacher] = useState<string | null>(null);
  const [todayStatusByTeacher, setTodayStatusByTeacher] = useState<Record<string, AttendanceState>>({});
  const colorScheme = useColorScheme();

  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    void fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTeachers();
      if (response.success) {
        const teacherList = (response.data as TeacherRecord[]) || [];
        setTeachers(teacherList);
        await hydrateTodayAttendanceStatus(teacherList);
      } else {
        setError(response.msg || 'Failed to fetch teachers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const teacherCount = useMemo(() => teachers.length, [teachers]);

  const hydrateTodayAttendanceStatus = async (teacherList: TeacherRecord[]) => {
    const statusMap: Record<string, AttendanceState> = {};

    await Promise.all(
      teacherList.map(async (teacher) => {
        const teacherUserId = teacher.user?._id;
        if (!teacherUserId) {
          statusMap[teacher._id] = 'not-marked';
          return;
        }

        try {
          const attendanceResponse = await apiService.getTodayAttendance(teacherUserId);
          const attendancePayload = attendanceResponse.data as
            | { attendance?: Array<{ date?: string; status?: AttendanceState }> }
            | undefined;
          const attendanceList = attendancePayload?.attendance || [];
          const todayRecord = attendanceList[0];

          statusMap[teacher._id] = todayRecord?.status || 'not-marked';
        } catch {
          statusMap[teacher._id] = 'not-marked';
        }
      })
    );

    setTodayStatusByTeacher(statusMap);
  };

  const markTeacherAttendance = async (
    teacher: TeacherRecord,
    status: 'present' | 'absent' | 'leave'
  ) => {
    const teacherUserId = teacher.user?._id;
    if (!teacherUserId) {
      Alert.alert('Missing Teacher User', 'Unable to mark attendance for this teacher.');
      return;
    }

    try {
      setSubmittingForTeacher(teacher._id);
      const today = new Date().toISOString().slice(0, 10);
      const hasAttendance = todayStatusByTeacher[teacher._id] && todayStatusByTeacher[teacher._id] !== 'not-marked';
      const response = hasAttendance
        ? await apiService.updateAttendance({
            userId: teacherUserId,
            date: today,
            status,
          })
        : await apiService.markAttendance({
            userId: teacherUserId,
            date: today,
            status,
          });

      if (response.success) {
        setTodayStatusByTeacher((prev) => ({
          ...prev,
          [teacher._id]: status,
        }));
        Alert.alert('Attendance Updated', `${teacher.user?.name || 'Teacher'} marked ${status}.`);
      } else {
        Alert.alert('Failed', response.msg || 'Could not mark attendance.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not mark attendance.');
    } finally {
      setSubmittingForTeacher(null);
    }
  };

  const renderTeacherCard = ({ item }: { item: TeacherRecord }) => {
    const subjectLabel = (item.teachSubjects || [])
      .map((subject) => (subject.code ? `${subject.name} (${subject.code})` : subject.name))
      .filter(Boolean)
      .join(', ');

    const classLabel = item.classTeacher
      ? `${item.classTeacher.name || '-'} ${item.classTeacher.section || ''}`.trim()
      : 'Not assigned';
    const currentStatus = todayStatusByTeacher[item._id] || 'not-marked';
    const currentStatusLabel =
      currentStatus === 'not-marked'
        ? 'Not Marked'
        : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

    return (
      <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <ThemedText type="subtitle" style={styles.name}>
          {item.user?.name || 'Unnamed Teacher'}
        </ThemedText>
        <ThemedText style={styles.meta}>Email: {item.user?.email || 'N/A'}</ThemedText>
        <ThemedText style={styles.meta}>Phone: {item.user?.phone || 'N/A'}</ThemedText>
        <ThemedText style={styles.meta}>Class Teacher: {classLabel}</ThemedText>
        <ThemedText style={styles.meta}>Subjects: {subjectLabel || 'N/A'}</ThemedText>
        <ThemedText style={styles.meta}>
          Address: {[item.user?.address, item.user?.city, item.user?.state, item.user?.pinCode].filter(Boolean).join(', ') || 'N/A'}
        </ThemedText>
        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusLabel}>Today's Status:</ThemedText>
          <View
            style={[
              styles.statusBadge,
              currentStatus === 'present'
                ? styles.statusPresent
                : currentStatus === 'absent'
                ? styles.statusAbsent
                : currentStatus === 'leave'
                ? styles.statusLeave
                : styles.statusNotMarked,
            ]}>
            <ThemedText style={styles.statusText}>{currentStatusLabel}</ThemedText>
          </View>
        </View>

        <View style={styles.attendanceRow}>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.presentButton]}
            disabled={submittingForTeacher === item._id}
            onPress={() => markTeacherAttendance(item, 'present')}>
            <ThemedText style={styles.attendanceButtonText}>Present</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.absentButton]}
            disabled={submittingForTeacher === item._id}
            onPress={() => markTeacherAttendance(item, 'absent')}>
            <ThemedText style={styles.attendanceButtonText}>Absent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.leaveButton]}
            disabled={submittingForTeacher === item._id}
            onPress={() => markTeacherAttendance(item, 'leave')}>
            <ThemedText style={styles.attendanceButtonText}>Leave</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.viewAttendanceButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push(`/attdence-detail/${item.user?._id}`)}>
          <ThemedText style={styles.viewAttendanceButtonText}>View Attendance</ThemedText>
        </TouchableOpacity>

        {submittingForTeacher === item._id ? (
          <View style={styles.submittingContainer}>
            <ActivityIndicator size="small" color={theme.tint} />
            <ThemedText style={styles.submittingText}>Saving attendance...</ThemedText>
          </View>
        ) : null}
      </ThemedView>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.count}>{teacherCount} teachers found</ThemedText>
      </View>

      <FlatList
        data={teachers}
        keyExtractor={(item) => item._id}
        renderItem={renderTeacherCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.centered}>
            <ThemedText>No teachers found</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.8,
  },
  count: {
    marginTop: 6,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  name: {
    marginBottom: 8,
  },
  meta: {
    marginTop: 4,
    lineHeight: 20,
  },
  statusContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPresent: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  statusAbsent: {
    backgroundColor: 'rgba(198, 40, 40, 0.15)',
  },
  statusLeave: {
    backgroundColor: 'rgba(239, 108, 0, 0.15)',
  },
  statusNotMarked: {
    backgroundColor: 'rgba(120, 120, 120, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attendanceRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  attendanceButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presentButton: {
    backgroundColor: '#2e7d32',
  },
  absentButton: {
    backgroundColor: '#c62828',
  },
  leaveButton: {
    backgroundColor: '#ef6c00',
  },
  attendanceButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  submittingContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submittingText: {
    fontSize: 12,
    opacity: 0.8,
  },
  viewAttendanceButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAttendanceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
