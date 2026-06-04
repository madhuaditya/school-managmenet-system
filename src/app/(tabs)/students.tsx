import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { apiService } from '@/api/client';
import { getQueuedAttendanceSnapshot, submitAttendance } from '@/src/services/attendance';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AttendanceLayoutStudent from '@/components/AttendanceLayoutStudent';

export interface ClassItem {
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
  user?: { _id: string; name: string; email?: string; phone?: string; image?: string };
  gradeLevel?: string;
  rollNumber?: string;
  parentContact?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  image?: string | null;
  remarks?: string | null;
  studentId?: string;
  studentIdCode?: string;
  currentStatus?: string;
}

export interface ClassWithStudents extends ClassItem {
  students: StudentWithUser[];
}

export default function StudentsTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassData, setSelectedClassData] = useState<ClassWithStudents | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, { status: string; date: string }>>({});
  const [mode, setMode] = useState<'list' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-marked' | 'present' | 'absent' | 'leave'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [classAttendance, setClassAttendance] = useState<null | { date: string; attendance: any[] }>(null);
  const [draftStatusByUser, setDraftStatusByUser] = useState<Record<string, string>>({});
  const [baseStatusByUser, setBaseStatusByUser] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClasses();
      if (!response.success) throw new Error(response.msg || 'Failed to load classes');
      setClasses((response.data as ClassItem[]) || []);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceUserId = (student: StudentWithUser) => student.user?._id || student._id;

  const hydrateTodayAttendanceStatus = async (students: StudentWithUser[]) => {
    const statusMap: Record<string, { status: string; date: string }> = {};

    for (const student of students) {
      const userId = getAttendanceUserId(student);
      try {
        const response = await apiService.getAttendance({ userId });
        if (response.success && Array.isArray(response.data)) {
          const today = new Date().toISOString().split('T')[0];
          const found = (response.data as any[]).find((a) => (a.date || '').startsWith(today) || a.status);
          if (found) statusMap[userId] = { status: found.status || 'not-marked', date: found.date || today };
        }
      } catch {
        // ignore
      }
    }

    setAttendanceStatus(statusMap);
  };

  const loadClassDetails = async (classId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getClassById(classId);
      if (!response.success) throw new Error(response.msg || 'Failed to load class details');

      const classData = response.data as ClassWithStudents;
      const fallbackDate = new Date().toISOString().split('T')[0];

      try {
        const todayResp = await apiService.getTodayClassAttendance(classId);
        if (todayResp.success && todayResp.data) {
          const todayData = todayResp.data;
          const attendanceByUserId: Record<string, any> = {};

          (todayData.attendance || []).forEach((it: any) => {
            const uid = it.userId || it._id || it.studentId || it.user;
            const key = String(uid || it._id || it.studentId || it.name);
            attendanceByUserId[key] = it;
          });

          const enrichedClassData: ClassWithStudents = {
            ...classData,
            students: (classData.students || []).map((student) => {
              const key = String(getAttendanceUserId(student));
              const attendance = attendanceByUserId[key];
              const user = student.user || {};

              return {
                ...student,
                user: {
                  ...user,
                  name: attendance?.name || user.name,
                  email: attendance?.email || user.email,
                  phone: attendance?.phone || user.phone,
                  image: attendance?.image ?? user.image,
                },
                rollNumber: attendance?.rollNumber || student.rollNumber,
                fatherName: attendance?.fatherName || student.fatherName,
                motherName: attendance?.motherName || student.motherName,
                phone: attendance?.phone || student.phone,
                email: attendance?.email || student.email || user.email,
                image: attendance?.image ?? student.image ?? user.image ?? null,
                remarks: attendance?.remarks ?? student.remarks ?? null,
                studentId: attendance?.studentId || student.studentId,
                studentIdCode: attendance?.studentIdCode || student.studentIdCode,
                currentStatus: attendance?.status || student.currentStatus,
              };
            }),
          };

          setSelectedClassData(enrichedClassData);
          setClassAttendance({ date: todayData.date, attendance: todayData.attendance || [] });

          const baseMap: Record<string, string> = {};
          const statusMap: Record<string, { status: string; date: string }> = {};
          (todayData.attendance || []).forEach((it: any) => {
            const uid = it.userId || it._id || it.studentId || it.user;
            const key = String(uid || it._id || it.studentId || it.name);
            baseMap[key] = it.status || 'not-marked';
            statusMap[key] = { status: it.status || 'not-marked', date: todayData.date };
          });

          (enrichedClassData.students || []).forEach((student) => {
            const key = String(getAttendanceUserId(student));
            if (!baseMap[key]) baseMap[key] = 'not-marked';
            if (!statusMap[key]) statusMap[key] = { status: 'not-marked', date: todayData.date };
          });

          const queuedSnapshot = await getQueuedAttendanceSnapshot(classId, todayData.date || fallbackDate);
          if (queuedSnapshot?.records?.length) {
            const queuedByUserId = queuedSnapshot.records.reduce<Record<string, any>>((acc, record) => {
              acc[String(record.userId)] = record;
              return acc;
            }, {});

            enrichedClassData.students = (enrichedClassData.students || []).map((student) => {
              const key = String(getAttendanceUserId(student));
              const queuedRecord = queuedByUserId[key];

              if (!queuedRecord) {
                return student;
              }

              baseMap[key] = queuedRecord.status;
              statusMap[key] = { status: queuedRecord.status, date: queuedSnapshot.date || todayData.date || fallbackDate };

              return {
                ...student,
                currentStatus: queuedRecord.status,
              };
            });

            setClassAttendance({
              date: queuedSnapshot.date || todayData.date || fallbackDate,
              attendance: todayData.attendance || [],
            });
          }

          setBaseStatusByUser(baseMap);
          setDraftStatusByUser({ ...baseMap });
          setAttendanceStatus(statusMap);
        } else {
          setSelectedClassData(classData);
          const queuedSnapshot = await getQueuedAttendanceSnapshot(classId, fallbackDate);

          if (queuedSnapshot?.records?.length) {
            const queuedByUserId = queuedSnapshot.records.reduce<Record<string, any>>((acc, record) => {
              acc[String(record.userId)] = record;
              return acc;
            }, {});

            const queuedClassData: ClassWithStudents = {
              ...classData,
              students: (classData.students || []).map((student) => {
                const key = String(getAttendanceUserId(student));
                const queuedRecord = queuedByUserId[key];

                if (!queuedRecord) {
                  return student;
                }

                return {
                  ...student,
                  currentStatus: queuedRecord.status,
                };
              }),
            };

            const queueStatusMap: Record<string, { status: string; date: string }> = {};
            (queuedClassData.students || []).forEach((student) => {
              const key = String(getAttendanceUserId(student));
              const queuedRecord = queuedByUserId[key];
              queueStatusMap[key] = {
                status: queuedRecord?.status || 'not-marked',
                date: queuedSnapshot.date || fallbackDate,
              };
            });

            setSelectedClassData(queuedClassData);
            setClassAttendance({ date: queuedSnapshot.date || fallbackDate, attendance: [] });
            setBaseStatusByUser(
              (queuedClassData.students || []).reduce<Record<string, string>>((acc, student) => {
                const key = String(getAttendanceUserId(student));
                acc[key] = student.currentStatus || 'not-marked';
                return acc;
              }, {}),
            );
            setDraftStatusByUser(
              (queuedClassData.students || []).reduce<Record<string, string>>((acc, student) => {
                const key = String(getAttendanceUserId(student));
                acc[key] = student.currentStatus || 'not-marked';
                return acc;
              }, {}),
            );
            setAttendanceStatus(queueStatusMap);
          } else {
            await hydrateTodayAttendanceStatus(classData.students || []);
          }
        }
      } catch {
        setSelectedClassData(classData);
        await hydrateTodayAttendanceStatus(classData.students || []);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const roster = (selectedClassData?.students || []).map((student) => {
    const uid = getAttendanceUserId(student);
    // console.log('Mapping student to roster item:', { student, uid, baseStatus: baseStatusByUser[String(uid)], draftStatus: draftStatusByUser[String(uid)] });
    return {
      _key: String(uid),
      _id: student._id,
      userId: uid,
      name: student.user?.name || 'Unknown',
      email: student.user?.email,
      rollNumber: student.rollNumber,
      image: student.user?.image || undefined,
      studentIdCode: student.studentIdCode || student.studentId || undefined,
      fatherName:  student.fatherName || undefined,
      motherName:  student.motherName || undefined,
      currentStatus: (draftStatusByUser[String(uid)] as any) || baseStatusByUser[String(uid)] || 'not-marked',
    };
  });

  const statusFilterOptions = useMemo(() => ([
    { label: 'All', value: 'all' },
    { label: 'Not Marked', value: 'not-marked' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Leave', value: 'leave' },
  ] as const), []);

  const filteredRoster = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return roster.filter((item) => {
      const matchesStatus = statusFilter === 'all' || (item.currentStatus || 'not-marked') === statusFilter;
      if (!matchesStatus) return false;

      if (!search) return true;

      const searchableText = [item.name, item.rollNumber, item.email, item.userId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [roster, searchQuery, statusFilter]);

  const activeFilterLabel = useMemo(() => {
    return statusFilterOptions.find((option) => option.value === statusFilter)?.label || 'All';
  }, [statusFilter, statusFilterOptions]);

  const activeModeLabel = mode === 'card' ? 'Card' : 'List';
  const isCardMode = mode === 'card';

  const pendingChanges = roster.filter((item) => item.currentStatus !== (baseStatusByUser[item._key] || 'not-marked'));
  const pendingCount = pendingChanges.length;

  const updateStatus = (row: any, status: 'present' | 'absent' | 'leave') => {
    // console.log('Updating status for', row, 'to', status);
    setDraftStatusByUser((prev) => ({ ...prev, [row._key]: status }));
    // console.log('Draft status by user after update:', { ...draftStatusByUser, [row._key]: status });
    setAttendanceStatus((prev) => ({
      ...prev,
      [row._key]: { status, date: classAttendance?.date || new Date().toISOString() },
    }));
  };

  const submitBulkAttendance = async () => {
    if (!selectedClassData?._id || pendingCount === 0) return;

    try {
      setSaving(true);
      setMessage(null);
      const records = pendingChanges.map((item) => ({ userId: item.userId || item._id, status: item.currentStatus, classId: selectedClassData._id }));
      await submitAttendance(records, selectedClassData._id, classAttendance?.date);

      const newBase = { ...baseStatusByUser };
      records.forEach((record: any) => {
        newBase[String(record.userId)] = record.status;
      });
      setBaseStatusByUser(newBase);
      setDraftStatusByUser({ ...newBase });
      setMessage('Attendance Saved');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading && selectedClassId === null) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (!selectedClassId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.pageTitle}>Select a class</ThemedText>
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
                <ThemedText type="defaultSemiBold" style={styles.className}>{cls.name}{cls.section ? ` (${cls.section})` : ''}</ThemedText>
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

  if (loading || !selectedClassData) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  const students = selectedClassData.students || [];

  if (mode === 'card') {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.icon} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students"
              placeholderTextColor={theme.icon}
              style={[styles.searchInput, { color: theme.text, borderColor: theme.icon, backgroundColor: theme.background }]}
            />
          </View>
          <View style={styles.actionsRow}>
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

            <View style={styles.filterWrap}>
              <Pressable
                onPress={() => {
                  setFilterOpen((prev) => !prev);
                  setModeOpen(false);
                }}
                style={({ pressed }) => [styles.dropdownButton, pressed && styles.modeChipPressed]}>
                <ThemedText style={styles.dropdownButtonText}>Filter: {activeFilterLabel}</ThemedText>
                <MaterialCommunityIcons name={filterOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.tint} />
              </Pressable>

              {filterOpen ? (
                <View style={[styles.filterMenu, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                  {statusFilterOptions.map((option) => {
                    const isActive = statusFilter === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setStatusFilter(option.value);
                          setFilterOpen(false);
                        }}
                        style={({ pressed }) => [styles.filterOption, isActive && styles.filterOptionActive, pressed && styles.filterOptionPressed]}>
                        <ThemedText style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{option.label}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <View style={styles.filterWrap}>
              <Pressable
                onPress={() => {
                  setModeOpen((prev) => !prev);
                  setFilterOpen(false);
                }}
                style={({ pressed }) => [styles.dropdownButton, isCardMode && styles.dropdownButtonActive, pressed && styles.modeChipPressed]}>
                <ThemedText style={[styles.dropdownButtonText, isCardMode && styles.dropdownButtonTextActive]}>View: {activeModeLabel}</ThemedText>
                <MaterialCommunityIcons name={modeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isCardMode ? '#fff' : theme.tint} />
              </Pressable>

              {modeOpen ? (
                <View style={[styles.filterMenu, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                  {(['card', 'list'] as const).map((option) => {
                    const isActive = mode === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          setMode(option);
                          setModeOpen(false);
                        }}
                        style={({ pressed }) => [styles.filterOption, isActive && styles.filterOptionActive, pressed && styles.filterOptionPressed]}>
                        <ThemedText style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{option === 'card' ? 'Card' : 'List'}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <AttendanceLayoutStudent
          roster={filteredRoster}
          classes={classes}
          selectedClassId={selectedClassId}
          updateStatus={updateStatus}
          mode="card"
          onSubmitBulk={submitBulkAttendance}
          submitting={saving}
          pendingCount={pendingCount}
        />
        {message ? <ThemedText style={styles.successText}>{message}</ThemedText> : null}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.icon} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students"
              placeholderTextColor={theme.icon}
              style={[styles.searchInput, { color: theme.text, borderColor: theme.icon, backgroundColor: theme.background }]}
            />
          </View>
          <View style={styles.actionsRow}>
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

            <View style={styles.filterWrap}>
              <Pressable
                onPress={() => {
                  setFilterOpen((prev) => !prev);
                  setModeOpen(false);
                }}
                style={({ pressed }) => [styles.dropdownButton, pressed && styles.modeChipPressed]}>
                <ThemedText style={styles.dropdownButtonText}>Filter: {activeFilterLabel}</ThemedText>
                <MaterialCommunityIcons name={filterOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.tint} />
              </Pressable>

              {filterOpen ? (
                <View style={[styles.filterMenu, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                  {statusFilterOptions.map((option) => {
                    const isActive = statusFilter === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setStatusFilter(option.value);
                          setFilterOpen(false);
                        }}
                        style={({ pressed }) => [styles.filterOption, isActive && styles.filterOptionActive, pressed && styles.filterOptionPressed]}>
                        <ThemedText style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{option.label}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <View style={styles.filterWrap}>
              <Pressable
                onPress={() => {
                  setModeOpen((prev) => !prev);
                  setFilterOpen(false);
                }}
                style={({ pressed }) => [styles.dropdownButton, isCardMode && styles.dropdownButtonActive, pressed && styles.modeChipPressed]}>
                <ThemedText style={[styles.dropdownButtonText, isCardMode && styles.dropdownButtonTextActive]}>View: {activeModeLabel}</ThemedText>
                <MaterialCommunityIcons name={modeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isCardMode ? '#fff' : theme.tint} />
              </Pressable>

              {modeOpen ? (
                <View style={[styles.filterMenu, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                  {(['card', 'list'] as const).map((option) => {
                    const isActive = mode === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          setMode(option);
                          setModeOpen(false);
                        }}
                        style={({ pressed }) => [styles.filterOption, isActive && styles.filterOptionActive, pressed && styles.filterOptionPressed]}>
                        <ThemedText style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{option === 'card' ? 'Card' : 'List'}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <AttendanceLayoutStudent
        roster={filteredRoster}
        classes={classes}
        selectedClassId={selectedClassId}
        updateStatus={updateStatus}
        mode="list"
        onSubmitBulk={submitBulkAttendance}
        submitting={saving}
        pendingCount={pendingCount}
      />

      {mode === 'list' ? (
        <View style={styles.footerBar}>
          <ThemedText style={styles.footerText}>Pending: {pendingCount}</ThemedText>
          <Pressable disabled={pendingCount === 0 || saving} onPress={submitBulkAttendance} style={({ pressed }) => [styles.submitButton, (pendingCount === 0 || saving) && styles.submitButtonDisabled, pressed && styles.submitButtonPressed]}>
            {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitButtonText}>Submit Bulk Attendance</ThemedText>}
          </Pressable>
        </View>
      ) : null}

      {message ? <ThemedText style={styles.successText}>{message}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
  content: { padding: 4, gap: 12, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { marginBottom: 4 },
  toolbar: { flexDirection: 'column', gap: 10 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterWrap: { position: 'relative' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  dropdownButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  dropdownButtonText: { fontWeight: '800', color: '#2563eb' },
  dropdownButtonTextActive: { color: '#fff' },
  filterMenu: { position: 'absolute', top: 42, right: 0, zIndex: 20, minWidth: 160, borderRadius: 14, borderWidth: 1, padding: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  filterOption: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  filterOptionActive: { backgroundColor: 'rgba(37,99,235,0.12)' },
  filterOptionPressed: { opacity: 0.82 },
  filterOptionText: { fontWeight: '700' },
  filterOptionTextActive: { color: '#2563eb' },
  modeChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  modeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeChipText: { fontWeight: '800', color: '#2563eb', paddingVertical: 2 },
  modeChipTextActive: { color: '#fff' },
  modeChipPressed: { opacity: 0.88 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 4 },
  subtitle: { opacity: 0.75 },
  mutedText: { opacity: 0.6, fontSize: 12 },
  classCard: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardContent: { flex: 1 },
  className: { marginBottom: 4 },
  footerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 6 },
  footerText: { fontWeight: '800' },
  submitButton: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#2563eb' },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonPressed: { opacity: 0.88 },
  submitButtonText: { color: '#fff', fontWeight: '900' },
  successText: { color: '#166534', fontWeight: '700', marginTop: 8 },
  searchWrap: { width: '100%', flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  searchIcon: { marginLeft: 10, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 10, paddingRight: 12, fontWeight: '600' },
});
 