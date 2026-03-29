import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ClassItem {
  _id: string;
  name: string;
  grade?: string;
  section?: string;
  room?: string;
  students?: Array<{ _id: string }>;
  studentCount?: number;
}

interface StudentWithUser {
  _id: string;
  user?: { _id: string; name: string; email?: string; phone?: string };
  gradeLevel?: string;
  rollNumber?: string;
  parentContact?: string;
}

interface ClassWithStudents extends ClassItem {
  students: StudentWithUser[];
}

export default function StudentsTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassData, setSelectedClassData] = useState<ClassWithStudents | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, { status: string; date: string }>>({});

  useEffect(() => {
    void loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClasses();
      if (!response.success) {
        throw new Error(response.msg || 'Failed to load classes');
      }
      setClasses((response.data as ClassItem[]) || []);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async (classId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getClassById(classId);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to load class details');
      }

      const classData = response.data as ClassWithStudents;
      setSelectedClassData(classData);

      // Load attendance status for all students
      if (classData.students && classData.students.length > 0) {
        await hydrateTodayAttendanceStatus(classData.students);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceUserId = (student: StudentWithUser) => {
    return student.user?._id || student._id;
  };

  const extractTodayAttendance = (payload: unknown) => {
    const data = payload as { attendance?: Array<{ status?: string; date?: string }> };
    const first = Array.isArray(data?.attendance) ? data.attendance[0] : undefined;
    if (!first || typeof first.status !== 'string' || first.status.length === 0) return null;
    return {
      status: first.status,
      date: typeof first.date === 'string' ? first.date : new Date().toISOString(),
    };
  };

  const hydrateTodayAttendanceStatus = async (students: StudentWithUser[]) => {
    const statusMap: Record<string, { status: string; date: string }> = {};

    try {
      for (const student of students) {
        const userId = getAttendanceUserId(student);
        try {
          const response = await apiService.getTodayAttendance(userId);
          if (response.success && response.data) {
            const att = extractTodayAttendance(response.data);
            if (att) {
              statusMap[userId] = att;
            }
          }
        } catch {
          // If attendance not found, leave it empty
        }
      }

      setAttendanceStatus(statusMap);
    } catch (err) {
      console.error('Error loading attendance status:', err);
    }
  };

  const fetchTodayAttendanceForStudent = async (userId: string) => {
    try {
      const response = await apiService.getTodayAttendance(userId);
      if (response.success && response.data) {
        return extractTodayAttendance(response.data);
      }
    } catch {
      // no attendance for today or request failed
    }
    return null;
  };

  const markStudentAttendance = async (student: StudentWithUser, status: 'present' | 'absent' | 'leave') => {
    try {
      setUpdating(true);
      const today = new Date().toISOString().split('T')[0];
      const userId = getAttendanceUserId(student);

      // Always verify today's attendance before deciding update vs add.
      const serverAttendance = await fetchTodayAttendanceForStudent(userId);
      const localAttendance = attendanceStatus[userId];
      const hasAttendance = serverAttendance || localAttendance;

      let response;
      if (hasAttendance) {
        response = await apiService.updateAttendance({
          userId,
          date: today,
          status,
        });
      } else {
        response = await apiService.markAttendance({
          userId,
          date: today,
          status,
        });
      }

      if (!response.success) {
        throw new Error(response.msg || 'Failed to update attendance');
      }

      setAttendanceStatus((prev) => ({
        ...prev,
        [userId]: { status, date: today },
      }));

      Alert.alert('Success', `Student attendance marked as ${status}.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setUpdating(false);
    }
  };

  const getAttendanceBadgeColor = (studentId: string) => {
    const status = attendanceStatus[studentId]?.status;
    if (!status) return '#9e9e9e'; // gray - not marked
    if (status === 'present') return '#4caf50'; // green
    if (status === 'absent') return '#f44336'; // red
    if (status === 'leave') return '#ff9800'; // orange
    return '#9e9e9e';
  };

  if (loading && selectedClassId === null) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  // Class selection view
  if (!selectedClassId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {classes.length === 0 ? (
          <ThemedText style={styles.mutedText}>No classes found</ThemedText>
        ) : (
          classes.map((cls) => (
            <Pressable
              key={cls._id}
              onPress={() => {
                setSelectedClassId(cls._id);
                void loadClassDetails(cls._id);
              }}
              style={[styles.classCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.className}>
                  {cls.name}
                  {cls.section ? ` (${cls.section})` : ''}
                </ThemedText>
                <ThemedText style={styles.mutedText}>Grade: {cls.grade || 'N/A'}</ThemedText>
                <ThemedText style={styles.mutedText}>Room: {cls.room || 'N/A'}</ThemedText>
                <ThemedText style={styles.mutedText}>Students: {cls.studentCount ?? cls.students?.length ?? 0}</ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.tint} />
            </Pressable>
          ))
        )}
      </ScrollView>
    );
  }

  // Student list view
  if (loading || !selectedClassData) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  const students = selectedClassData.students || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            setSelectedClassId(null);
            setSelectedClassData(null);
            setAttendanceStatus({});
          }}
          style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={theme.tint} />
          <ThemedText style={{ color: theme.tint }}>Back</ThemedText>
        </Pressable>
        <View>
          <ThemedText type="title">
            {selectedClassData.name}
            {selectedClassData.section ? ` (${selectedClassData.section})` : ''}
          </ThemedText>
          <ThemedText style={styles.subtitle}>Grade: {selectedClassData.grade || 'N/A'}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.subtitle} type="defaultSemiBold">
        {students.length} Student{students.length !== 1 ? 's' : ''}
      </ThemedText>

      {students.length === 0 ? (
        <ThemedText style={styles.mutedText}>No students in this class</ThemedText>
      ) : (
        students.map((student) => {
          const attendanceUserId = getAttendanceUserId(student);
          const attStatus = attendanceStatus[attendanceUserId];
          const badgeColor = getAttendanceBadgeColor(attendanceUserId);
          const statusLabel =
            attStatus?.status && typeof attStatus.status === 'string' ? attStatus.status : undefined;
          const attendanceMode = statusLabel ? 'Update attendance' : 'Add attendance';

          return (
            <ThemedView
              key={student._id}
              style={[styles.studentCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <View style={styles.studentHeader}>
                <View style={[styles.attendanceBadge, { backgroundColor: badgeColor }]}>
                  <ThemedText style={styles.badgeText}>
                    {statusLabel ? statusLabel.charAt(0).toUpperCase() : '?'}
                  </ThemedText>
                </View>
                <View style={styles.studentInfo}>
                  <ThemedText type="defaultSemiBold">{student.user?.name || 'Unknown'}</ThemedText>
                  <ThemedText style={styles.mutedText}>{student.user?.email || 'N/A'}</ThemedText>
                  <ThemedText style={styles.mutedText}>
                    Roll: {student.rollNumber || 'N/A'} | {student.gradeLevel || 'N/A'}
                  </ThemedText>
                  <ThemedText style={styles.currentStatusText}>
                    Current: {statusLabel ? statusLabel.toUpperCase() : 'NOT MARKED'}
                  </ThemedText>
                  <ThemedText style={styles.modeText}>{attendanceMode}</ThemedText>
                </View>
              </View>

              <View style={styles.buttonsRow}>
                <Pressable
                  onPress={() => markStudentAttendance(student, 'present')}
                  disabled={updating}
                  style={[
                    styles.attendanceButton,
                    { backgroundColor: '#4caf50' },
                    attStatus?.status === 'present' && styles.buttonActive,
                  ]}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                  <ThemedText style={styles.buttonText}>Present</ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => markStudentAttendance(student, 'absent')}
                  disabled={updating}
                  style={[
                    styles.attendanceButton,
                    { backgroundColor: '#f44336' },
                    attStatus?.status === 'absent' && styles.buttonActive,
                  ]}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />
                  <ThemedText style={styles.buttonText}>Absent</ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => markStudentAttendance(student, 'leave')}
                  disabled={updating}
                  style={[
                    styles.attendanceButton,
                    { backgroundColor: '#ff9800' },
                    attStatus?.status === 'leave' && styles.buttonActive,
                  ]}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#fff" />
                  <ThemedText style={styles.buttonText}>Leave</ThemedText>
                </Pressable>
              </View>

              {statusLabel && (
                <ThemedText style={styles.lastMarked}>
                  Last marked: {statusLabel} on {new Date(attStatus?.date || '').toLocaleDateString()}
                </ThemedText>
              )}
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
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.75,
  },
  mutedText: {
    opacity: 0.6,
    fontSize: 12,
  },
  classCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  className: {
    marginBottom: 4,
  },
  studentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  currentStatusText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.85,
  },
  modeText: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.7,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  buttonActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lastMarked: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
});
