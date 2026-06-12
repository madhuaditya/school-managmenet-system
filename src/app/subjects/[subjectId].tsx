import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function getCurrentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() + 1 >= 4 ? y : y - 1;
  const date = `${start}-${String(start + 1).slice(-2)}`;
  return date;
}

const assessmentTypeOptions = [
  { label: 'Exam', value: 'exam' },
  { label: 'Test', value: 'test' },
  { label: 'Assignment', value: 'assignment' },
] as const;

const fixedMaxMarksByType = {
  test: 10,
  assignment: 20,
} as const;

const StudentRow = React.memo(function StudentRow({ item }: { item: any }) {
  return (
    <View style={styles.rowItem}>
      <ThemedText>{item.user?.name || item.name || 'Student'}</ThemedText>
      <ThemedText style={{ opacity: 0.7 }}>{item.rollNumber ? `#${item.rollNumber}` : ''}</ThemedText>
    </View>
  );
});

export default function SubjectDetail() {
  const params = useLocalSearchParams();
  const subjectId = (params?.subjectId as string) || '';
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [subject, setSubject] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  const [academicYear, setAcademicYear] = useState<string>(getCurrentAcademicYear());
  const yearOptions = useMemo(() => {
    const [start] = academicYear.split('-').map(Number);
    return [String(start - 1) + '-' + String(start).slice(-2), academicYear, String(start + 1) + '-' + String(start + 2).slice(-2)];
  }, [academicYear]);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'exam' | 'test' | 'assignment'>('exam');
  const [rows, setRows] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  const selectedExamValue = selectedExam?._id || '';

  const selectedMaxMarks = useMemo(() => {
    if (type === 'test') return fixedMaxMarksByType.test;
    if (type === 'assignment') return fixedMaxMarksByType.assignment;
    return Number(selectedExam?.totalMarks || subject?.maxMarks || 100);
  }, [selectedExam?.totalMarks, subject?.maxMarks, type]);

  const renderStudentItem = useCallback(({ item }: { item: any }) => <StudentRow item={item} />, []);

  const studentKeyExtractor = useCallback(
    (item: any) => String(item._id || item.user?._id || item.userId || item.studentId || item.rollNumber || item.name),
    [],
  );

  const buildManualRows = useCallback(
    (assessmentType: 'test' | 'assignment') => {
      const totalMarks = assessmentType === 'test' ? fixedMaxMarksByType.test : fixedMaxMarksByType.assignment;
      const matchedProgress = progress.filter((item: any) => item.type === assessmentType);
      const progressByStudentId = new Map<string, any>();

      matchedProgress.forEach((item: any) => {
        const key = String(item.student?._id || item.studentId || item.student || '');
        if (key && !progressByStudentId.has(key)) {
          progressByStudentId.set(key, item);
        }
      });

      const label = assessmentType === 'test' ? 'Test' : 'Assignment';
      return students.map((student: any) => {
        const studentId = student._id || student.user?._id || student.userId;
        const item = progressByStudentId.get(String(studentId));
        return {
          studentId,
          name: student.user?.name || student.name || 'Student',
          marksObtained: item?.marksObtained ?? '',
          totalMarks,
          remarks: item?.remarks ?? '',
          progressId: item?._id || null,
          title: item?.title || label,
        };
      });
    },
    [progress, students],
  );

  const resetForManualAssessment = useCallback(
    (assessmentType: 'test' | 'assignment') => {
      setSelectedExam(null);
      setType(assessmentType);
      setTitle(assessmentType === 'test' ? 'Test' : 'Assignment');
      setRows(buildManualRows(assessmentType));
      setEditing(true);
    },
    [buildManualRows],
  );

  const handleAssessmentTypeChange = useCallback(
    (nextType: 'exam' | 'test' | 'assignment') => {
      setType(nextType);
      if (nextType === 'exam') {
        setSelectedExam(null);
        setRows([]);
        setTitle('');
        setEditing(false);
        return;
      }

      resetForManualAssessment(nextType);
    },
    [resetForManualAssessment],
  );

  useEffect(() => {
    void loadDetails();
  }, [subjectId, academicYear]);

  async function loadDetails() {
    setLoading(true);
    try {
      if (!subjectId) return;
      const res = await apiService.getSubjectDetails(subjectId, academicYear as any);
      if (res && res.success && res.data) {
        setSubject(res.data.subject || null);
        setStats(res.data.stats || null);
        setStudents(res.data.students || []);
        setExams(res.data.exams || []);
        setProgress(res.data.progress || []);
        setRanking(res.data.ranking || []);
        setSelectedExam(null);
        setEditing(false);
        setRows([]);
        setType('exam');
        setTitle('');
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function loadExamTemplate(exam: any) {
    if (!exam || !exam._id) return;
    setLoadingTemplate(true);
    try {
      const res = await apiService.getExamProgressTemplate(exam._id, academicYear as any);
      if (res && res.success && res.data) {
        const templateRows = Array.isArray(res.data.rows) ? res.data.rows : [];
        const mapped = templateRows.map((row: any) => ({
          studentId: row.student?._id || row.studentId || row.student,
          name: row.student?.user?.name || row.student?.name || row.studentName || 'Student',
          marksObtained: row.marksObtained ?? 0,
          totalMarks: row.totalMarks ?? Number(res.data.exam?.totalMarks || exam.totalMarks || subject?.maxMarks || 100),
          remarks: row.remarks ?? '',
          progressId: row.progressId || row._id || null,
        }));
        if (!mapped.length) {
          Alert.alert('Template', 'No student rows returned for this exam');
          setRows([]);
          setEditing(false);
          setSelectedExam(null);
          return;
        }
        setRows(mapped);
        setEditing(true);
        setSelectedExam(res.data.exam || exam);
        setTitle((res.data.exam?.name || exam.name || exam.title || '').toString());
        setType('exam');
      } else {
        Alert.alert('Template', 'No template found for selected exam');
        setRows([]);
        setEditing(false);
        setSelectedExam(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  }

  async function saveBulk() {
    if (!rows.length) {
      Alert.alert('Validation', 'Please load or create rows before saving marks.');
      return;
    }

    if (type === 'exam' && !selectedExam) {
      Alert.alert('Validation', 'Please select a valid exam template before saving marks.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        subjectId,
        academicYear,
        type,
        title: type === 'exam' ? (title || selectedExam?.name || selectedExam?.title) : title,
        examId: type === 'exam' ? selectedExam?._id : undefined,
        classId: subject?.class?._id,
        rows: rows.map((r) => ({
          studentId: r.studentId,
          progressId: r.progressId || undefined,
          marksObtained: r.marksObtained === '' ? undefined : Number(r.marksObtained),
          totalMarks: r.totalMarks === '' ? undefined : Number(r.totalMarks),
          remarks: r.remarks,
        })),
      };

      const res = await apiService.bulkCreateProgress(payload as any);
      if (!res || !res.success) throw new Error(res?.msg || 'Failed to save marks');
      Alert.alert('Success', res.msg || 'Saved successfully');
      setEditing(false);
      void loadDetails();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </ThemedView>
    );
  }

  const header = (
    <View style={{ padding: 16 }}>
      <View style={{ padding: 14, borderRadius: 14, backgroundColor: 'rgba(37,99,235,0.06)' }}>
        <ThemedText type="title">{subject?.name || 'Subject'}</ThemedText>
        <ThemedText style={{ marginTop: 4, opacity: 0.75 }}>{subject?.code || 'No code'}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {/* <View style={styles.statChip}><ThemedText>Subject ID: {subject?._id || subjectId}</ThemedText></View>
          <View style={styles.statChip}><ThemedText>Route ID: {subjectId}</ThemedText></View> */}
          <View style={styles.statChip}><ThemedText>Class: {subject?.class ? `${subject.class.name}${subject.class.section ? `-${subject.class.section}` : ''}` : 'N/A'}</ThemedText></View>
          <View style={styles.statChip}><ThemedText>Teacher: {subject?.teacher?.user?.name || 'N/A'}</ThemedText></View>
        </View>
      </View>

      {stats ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          <View style={styles.statChip}><ThemedText>{stats.totalStudents} Students</ThemedText></View>
          <View style={styles.statChip}><ThemedText>{stats.totalExams} Exams</ThemedText></View>
          <View style={styles.statChip}><ThemedText>{stats.totalProgress} Records</ThemedText></View>
          <View style={styles.statChip}><ThemedText>{stats.averagePercentage ?? 0}% Avg</ThemedText></View>
        </View>
      ) : null}

      <View style={{ marginTop: 12 }}>
        <ThemedText type="subtitle">Academic Year</ThemedText>
        <View style={styles.dropdownWrap}>
          <Picker selectedValue={academicYear} onValueChange={(value) => setAcademicYear(String(value))}>
            {yearOptions.map((y) => (
              <Picker.Item key={y} label={y} value={y} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <ThemedText type="subtitle">Assessment Type</ThemedText>
        <View style={styles.dropdownWrap}>
          <Picker selectedValue={type} onValueChange={(value) => handleAssessmentTypeChange(value as 'exam' | 'test' | 'assignment')}>
            {assessmentTypeOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>

      {type === 'exam' ? (
        <View style={{ marginTop: 16 }}>
          <ThemedText type="subtitle">Exams</ThemedText>
          <View style={styles.dropdownWrap}>
            <Picker
              selectedValue={selectedExamValue}
              onValueChange={(value) => {
                const nextExam = exams.find((exam: any) => String(exam._id) === String(value));
                if (!nextExam) {
                  setSelectedExam(null);
                  setRows([]);
                  setEditing(false);
                  setTitle('');
                  return;
                }

                void loadExamTemplate(nextExam);
              }}
            >
              <Picker.Item label="Select exam template" value="" />
              {exams.map((ex: any) => (
                <Picker.Item
                  key={ex._id}
                  label={ex.code ? `${ex.name || ex.title || 'Exam'} · ${ex.code}` : (ex.name || ex.title || 'Exam')}
                  value={ex._id}
                />
              ))}
            </Picker>
          </View>
          {!exams.length ? <ThemedText style={{ marginTop: 8 }}>No exams found.</ThemedText> : null}
        </View>
      ) : null}

      {progress.length ? (
        <View style={{ marginTop: 16 }}>
          <ThemedText type="subtitle">Recent Progress</ThemedText>
          {progress.slice(0, 3).map((item: any) => (
            <View key={item._id} style={styles.rowItem}>
              <ThemedText>{item.title || item.type || 'Progress'}</ThemedText>
              <ThemedText style={{ opacity: 0.7 }}>{item.percentage ? `${Number(item.percentage).toFixed(1)}%` : ''}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {ranking.length ? (
        <View style={{ marginTop: 16 }}>
          <ThemedText type="subtitle">Ranking</ThemedText>
          {ranking.slice(0, 3).map((item: any) => (
            <View key={String(item._id || item.student?._id || item.studentId)} style={styles.rowItem}>
              <ThemedText>#{item.rank || '-'} {item.student?.user?.name || item.student?.name || item.name || 'Student'}</ThemedText>
              <ThemedText style={{ opacity: 0.7 }}>{item.percentage ? `${Number(item.percentage).toFixed(1)}%` : ''}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {editing ? (
        <View style={{ marginTop: 18 }}>
          <ThemedText type="subtitle">Bulk Editor</ThemedText>
          <View style={{ marginTop: 10 }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={type === 'exam' ? 'Exam title' : type === 'test' ? 'Test title' : 'Assignment title'}
              editable={type !== 'exam'}
              style={{ padding: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 8, opacity: type === 'exam' ? 0.8 : 1 }}
            />
            {loadingTemplate ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
            {type === 'exam' && selectedExam ? (
              <View style={{ marginTop: 8 }}>
                <ThemedText>Selected exam: {selectedExam.title || selectedExam.name}</ThemedText>
                <Pressable onPress={() => { setSelectedExam(null); setRows([]); setTitle(''); setType('exam'); setEditing(false); }} style={[styles.secondaryButton, { marginTop: 8 }]}>
                  <ThemedText>Clear selection</ThemedText>
                </Pressable>
              </View>
            ) : null}
            {type !== 'exam' ? (
              <View style={{ marginTop: 8 }}>
                <ThemedText>Fixed max marks: {selectedMaxMarks}</ThemedText>
              </View>
            ) : null}
          </View>

          {rows.map((r, idx) => (
            <View key={r.studentId || idx} style={styles.bulkRow}>
              <ThemedText style={{ flex: 1, marginRight: 8 }}>{r.name}</ThemedText>
              <TextInput
                value={String(r.marksObtained)}
                onChangeText={(text) => setRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], marksObtained: text.replace(/[^0-9.]/g, '') }; return copy; })}
                placeholder="Marks"
                keyboardType="numeric"
                style={styles.smallInput}
              />
              <TextInput
                value={String(r.totalMarks)}
                editable={false}
                placeholder="Max"
                keyboardType="numeric"
                style={[styles.smallInput, { marginLeft: 8, backgroundColor: 'rgba(0,0,0,0.03)' }]}
              />
            </View>
          ))}

          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setEditing(false)} style={styles.secondaryButton}>
              <ThemedText>Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={() => {
              // client-side validation
              for (const r of rows) {
                if (!r.studentId) continue;
                const total = Number(r.totalMarks);
                if (Number.isNaN(total) || total < 1) { Alert.alert('Validation', 'Total marks must be a number >= 1'); return; }
                if (r.marksObtained !== '') {
                  const marks = Number(r.marksObtained);
                  if (Number.isNaN(marks) || marks < 0 || marks > total) { Alert.alert('Validation', 'Marks must be between 0 and max marks'); return; }
                }
              }
              void saveBulk();
            }} style={styles.primaryButton}>
              {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff' }}>Save</ThemedText>}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={editing ? [] : students}
        keyExtractor={studentKeyExtractor}
        ListHeaderComponent={header}
        ListEmptyComponent={editing ? null : <View />}
        renderItem={renderStudentItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rowItem: { paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.04)', flexDirection: 'row', justifyContent: 'space-between' },
  statChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.08)' },
  primaryButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: 'transparent', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  bulkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  smallInput: { width: 80, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  dropdownWrap: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden', marginTop: 8 },
});
