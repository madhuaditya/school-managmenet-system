import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

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
      const defaultTotal = exam.totalMarks || subject?.maxMarks || 100;
      const matchedProgress = progress.filter((item: any) => {
        const examId = item.exam?._id || item.exam;
        const itemTitle = String(item.title || '').trim().toLowerCase();
        const examTitle = String(exam.name || exam.title || '').trim().toLowerCase();
        return String(examId) === String(exam._id) || (item.type === 'exam' && itemTitle === examTitle);
      });

      const progressByStudentId = new Map<string, any>();
      matchedProgress.forEach((item: any) => {
        const key = String(item.student?._id || item.studentId || item.student || '');
        if (key && !progressByStudentId.has(key)) {
          progressByStudentId.set(key, item);
        }
      });

      const fromSubjectCall = students.map((student: any) => {
        const studentId = student._id || student.user?._id || student.userId;
        const item = progressByStudentId.get(String(studentId));
        return {
          studentId,
          name: student.user?.name || student.name || 'Student',
          marksObtained: item?.marksObtained ?? 0,
          totalMarks: item?.totalMarks ?? defaultTotal,
          remarks: item?.remarks ?? '',
          progressId: item?._id || null,
        };
      });

      if (fromSubjectCall.length) {
        setRows(fromSubjectCall);
        setEditing(true);
        setSelectedExam(exam);
        setTitle((exam.name || exam.title || '').toString());
        setType('exam');
        return;
      }

      const res = await apiService.getExamProgressTemplate(exam._id, academicYear as any);
      if (res && res.success && res.data) {
        const templateRows = Array.isArray(res.data.rows) ? res.data.rows : [];
        const mapped = templateRows.map((row: any) => ({
          studentId: row.student?._id || row.studentId || row.student,
          name: row.student?.user?.name || row.student?.name || row.studentName || 'Student',
          marksObtained: row.marksObtained ?? 0,
          totalMarks: row.totalMarks ?? defaultTotal,
          remarks: row.remarks ?? '',
          progressId: row.progressId || row._id || null,
        }));
        if (!mapped.length) {
          Alert.alert('Template', 'No student rows returned for this exam');
          return;
        }
        setRows(mapped);
        setEditing(true);
        setSelectedExam(res.data.exam || exam);
        setTitle((res.data.exam?.name || exam.name || exam.title || '').toString());
        setType('exam');
      } else {
        Alert.alert('Template', 'No template found for selected exam');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  }

  function startBulkEdit(exam?: any) {
    if (exam) {
      void loadExamTemplate(exam);
      return;
    }
    // if exams exist, require selection
    if (exams.length && !selectedExam) {
      Alert.alert('Select exam', 'Please load/select an exam template first.');
      return;
    }
    const defaultTotal = subject?.maxMarks ?? 100;
    const initial = students.map((s) => ({ studentId: s._id || s.user?._id || s.userId, name: s.user?.name || s.name || 'Student', marksObtained: 0, totalMarks: defaultTotal, remarks: '', progressId: null }));
    setRows(initial);
    setEditing(true);
  }

  async function saveBulk() {
    setSaving(true);
    try {
      const payload: any = {
        subjectId,
        academicYear,
        type: selectedExam ? 'exam' : type,
        title: selectedExam ? (title || selectedExam.name || selectedExam.title) : title,
        examId: selectedExam?._id,
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
          <View style={styles.statChip}><ThemedText>Subject ID: {subject?._id || subjectId}</ThemedText></View>
          <View style={styles.statChip}><ThemedText>Route ID: {subjectId}</ThemedText></View>
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
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {yearOptions.map((y) => (
            <Pressable key={y} onPress={() => setAcademicYear(y)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: academicYear === y ? '#2563EB' : 'transparent' }}>
              <ThemedText style={{ color: academicYear === y ? '#fff' : undefined }}>{y}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <ThemedText type="subtitle">Exams</ThemedText>
        {exams.length ? (
          exams.map((ex: any) => (
            <View key={ex._id} style={[styles.rowItem, selectedExam?._id === ex._id ? { backgroundColor: 'rgba(37,99,235,0.04)' } : {}]}>
              <View style={{ flex: 1 }}>
                <ThemedText>{ex.name || ex.title || 'Exam'}</ThemedText>
                <ThemedText style={{ opacity: 0.7, fontSize: 12 }}>
                  {ex.code || ''}{ex.code && ex.totalMarks ? ' · ' : ''}{ex.totalMarks ? `${ex.totalMarks} marks` : ''}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => void loadExamTemplate(ex)} style={[styles.secondaryButton, { paddingHorizontal: 10 }]}>
                  <ThemedText>Load Template</ThemedText>
                </Pressable>
                <Pressable onPress={() => { setSelectedExam(ex); void loadExamTemplate(ex); }} style={[styles.primaryButton, { paddingHorizontal: 10 }]}>
                  <ThemedText style={{ color: '#fff' }}>Use Template</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <ThemedText style={{ marginTop: 8 }}>No exams found.</ThemedText>
        )}
      </View>

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

      <View style={{ marginTop: 18 }}>
        <Pressable onPress={() => startBulkEdit()} style={styles.primaryButton}>
          <ThemedText style={{ color: '#fff' }}>Bulk Marks</ThemedText>
        </Pressable>
      </View>

      {editing ? (
        <View style={{ marginTop: 18 }}>
          <ThemedText type="subtitle">Bulk Editor</ThemedText>
          <View style={{ marginTop: 10 }}>
            <TextInput value={title} onChangeText={setTitle} placeholder="Title" style={{ padding: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {(['exam', 'test', 'assignment'] as const).map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: type === t ? '#2563EB' : 'transparent' }}>
                  <ThemedText style={{ color: type === t ? '#fff' : undefined }}>{t}</ThemedText>
                </Pressable>
              ))}
            </View>
            {loadingTemplate ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
            {selectedExam ? (
              <View style={{ marginTop: 8 }}>
                <ThemedText>Selected exam: {selectedExam.title || selectedExam.name}</ThemedText>
                <Pressable onPress={() => { setSelectedExam(null); setRows([]); setTitle(''); setType('exam'); }} style={[styles.secondaryButton, { marginTop: 8 }]}>
                  <ThemedText>Clear selection</ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>

          {rows.map((r, idx) => (
            <View key={r.studentId || idx} style={styles.bulkRow}>
              <ThemedText style={{ flex: 1 }}>{r.name}</ThemedText>
              <TextInput
                value={String(r.marksObtained)}
                onChangeText={(text) => setRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], marksObtained: text.replace(/[^0-9.]/g, '') }; return copy; })}
                placeholder="Marks"
                keyboardType="numeric"
                style={styles.smallInput}
              />
              <TextInput
                value={String(r.totalMarks)}
                onChangeText={(text) => setRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], totalMarks: text.replace(/[^0-9.]/g, '') }; return copy; })}
                placeholder="Out of"
                keyboardType="numeric"
                editable={!selectedExam}
                style={[styles.smallInput, { marginLeft: 8, backgroundColor: selectedExam ? 'rgba(0,0,0,0.03)' : undefined }]}
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
                  if (Number.isNaN(marks) || marks < 0 || marks > total) { Alert.alert('Validation', 'Marks must be between 0 and total marks'); return; }
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
        data={students}
        keyExtractor={(item) => String(item._id || item.user?._id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.rowItem}>
            <ThemedText>{item.user?.name || item.name || 'Student'}</ThemedText>
            <ThemedText style={{ opacity: 0.7 }}>{item.rollNumber ? `#${item.rollNumber}` : ''}</ThemedText>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rowItem: { paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.04)', flexDirection: 'row', justifyContent: 'space-between' },
  statChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.08)' },
  primaryButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { backgroundColor: 'transparent', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  bulkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  smallInput: { width: 80, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
});
