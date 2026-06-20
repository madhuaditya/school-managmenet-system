import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// --- ERP BRANDING PALETTE ---
const PALETTE = {
  primary: '#303841',
  accent: '#76ABAE',
  cta: '#FF5722',
  background: '#F5F5F5',
  border: '#E6E6E6',
  surface: '#FFFFFF',
  textBody: '#5D646B',
  textHeading: '#303841',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F9A825',
};

const assessmentTypeOptions = [
  { label: 'Exam', value: 'exam' },
  { label: 'Test', value: 'test' },
  { label: 'Assignment', value: 'assignment' },
] as const;

const fixedMaxMarksByType = { test: 10, assignment: 20 } as const;

export default function UpdateMarksScreen() {
  const params = useLocalSearchParams();
  const subjectId = (params?.subjectId as string) || '';
  const academicYear = (params?.academicYear as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [subject, setSubject] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'exam' | 'test' | 'assignment'>('exam');
  const [rows, setRows] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const selectedExamValue = selectedExam?._id || '';

  const selectedMaxMarks = useMemo(() => {
    if (type === 'test') return fixedMaxMarksByType.test;
    if (type === 'assignment') return fixedMaxMarksByType.assignment;
    if(type === 'exam') return Number(selectedExam?.maxMarks || 100);
    return Number(selectedExam?.totalMarks || subject?.maxMarks || 100);
  }, [selectedExam?.totalMarks, subject?.maxMarks, type]);

  useEffect(() => {
    if (subjectId && academicYear) {
      void loadDetails();
    } else {
      Alert.alert('Error', 'Missing required parameters');
      router.back();
    }
  }, [subjectId, academicYear]);

  async function loadDetails() {
    setLoading(true);
    try {
      const res = await apiService.getSubjectDetails(subjectId, academicYear as any);
      if (res && res.success && res.data) {
        setSubject(res.data.subject || null);
        setStudents(res.data.students || []);
        setExams(res.data.exams || []);
        setProgress(res.data.progress || []);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load data for updating marks.');
    } finally {
      setLoading(false);
    }
  }

  const buildManualRows = useCallback((assessmentType: 'test' | 'assignment') => {
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
  }, [progress, students]);

  const handleAssessmentTypeChange = useCallback((nextType: 'exam' | 'test' | 'assignment') => {
    setType(nextType);
    if (nextType === 'exam') {
      setSelectedExam(null);
      setRows([]);
      setTitle('');
      return;
    }
    setSelectedExam(null);
    setTitle(nextType === 'test' ? 'Test' : 'Assignment');
    setRows(buildManualRows(nextType));
  }, [buildManualRows]);

  async function loadExamTemplate(exam: any) {
    if (!exam || !exam._id) return;
    setLoadingTemplate(true);
    try {
      const res = await apiService.getExamProgressTemplate(exam._id, academicYear as any);
      if (res && res.success && res.data) {
        // console.log(JSON.stringify(res.data));
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
          setSelectedExam(null);
          return;
        }
        setRows(mapped);
        setSelectedExam(res.data.exam || exam);
        setTitle((res.data.exam?.name || exam.name || exam.title || '').toString());
      } else {
        Alert.alert('Template', 'No template found for selected exam');
        setRows([]);
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

    // Client-side validation loop
    for (const r of rows) {
      if (!r.studentId) continue;
      const total = Number(r.totalMarks);
      if (Number.isNaN(total) || total < 1) {
        Alert.alert('Validation', 'Total marks must be greater than 0');
        return;
      }
      if (r.marksObtained !== '') {
        const marks = Number(r.marksObtained);
        if (Number.isNaN(marks) || marks < 0 || marks > total) {
          Alert.alert('Validation', 'Marks must be between 0 and max marks');
          return;
        }
      }
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
      Alert.alert('Success', res.msg || 'Saved successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clipboard-edit-outline" size={20} color={PALETTE.accent} />
            <ThemedText style={styles.sectionTitle}>Bulk Marks Entry</ThemedText>
          </View>

          {/* TYPE PICKER */}
          <ThemedText style={styles.label}>Assessment Type</ThemedText>
          <View style={styles.dropdownWrap}>
            <Picker selectedValue={type} onValueChange={handleAssessmentTypeChange} style={styles.picker}>
              {assessmentTypeOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          {/* EXAM TEMPLATE PICKER */}
          {type === 'exam' && (
            <>
              <ThemedText style={styles.label}>Select Exam Template</ThemedText>
              <View style={styles.dropdownWrap}>
                <Picker
                  selectedValue={selectedExamValue}
                  onValueChange={(value) => {
                    const nextExam = exams.find((exam: any) => String(exam._id) === String(value));
                    if (!nextExam) {
                      setSelectedExam(null);
                      setRows([]);
                      setTitle('');
                      return;
                    }
                    void loadExamTemplate(nextExam);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select exam template" value="" />
                  {exams.map((ex: any) => (
                    <Picker.Item
                      key={ex._id}
                      label={ex.code ? `${ex.name || ex.title || 'Exam'} · ${ex.code}` : ex.name || ex.title || 'Exam'}
                      value={ex._id}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* TITLE */}
          <ThemedText style={styles.label}>Title</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'exam' ? 'Exam Title' : type === 'test' ? 'Test Title' : 'Assignment Title'}
            editable={type !== 'exam'}
            placeholderTextColor={PALETTE.textBody}
            style={[styles.input, type === 'exam' && styles.inputDisabled]}
          />

          {loadingTemplate && <ActivityIndicator style={{ marginTop: 12 }} color={PALETTE.accent} />}

          {/* EXAM BADGE OR MAX MARKS INFO */}
          {type === 'exam' && selectedExam && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color={PALETTE.accent} />
              <ThemedText style={styles.infoText}>{selectedExam.title || selectedExam.name}</ThemedText>
              <Pressable onPress={() => { setSelectedExam(null); setRows([]); setTitle(''); setType('exam'); }}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={PALETTE.error} />
              </Pressable>
            </View>
          )}

          {type !== 'exam' && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="calculator-variant-outline" size={18} color={PALETTE.accent} />
              <ThemedText style={styles.infoText}>Max Marks: {selectedMaxMarks}</ThemedText>
            </View>
          )}

        </View>

        {/* STUDENT SEARCH */}
        {rows.length > 0 && (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={PALETTE.textBody} />
            <TextInput
              placeholder="Search student..."
              placeholderTextColor={PALETTE.textBody}
              value={studentSearch}
              onChangeText={setStudentSearch}
              style={styles.searchInput}
            />
          </View>
        )}

        {/* STUDENT ROWS */}
        {rows
          .filter((r) => r.name?.toLowerCase().includes(studentSearch.toLowerCase()))
          .map((r, idx) => (
            <View key={r.studentId || idx} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <MaterialCommunityIcons name="account-school-outline" size={20} color={PALETTE.accent} />
                <ThemedText style={styles.studentName}>{r.name}</ThemedText>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.fieldLabel}>Marks Obtained</ThemedText>
                  <TextInput
                    value={String(r.marksObtained)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={PALETTE.textBody}
                    onChangeText={(text) =>
                      setRows((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], marksObtained: text.replace(/[^0-9.]/g, '') };
                        return copy;
                      })
                    }
                    style={styles.input}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.fieldLabel}>Max Marks</ThemedText>
                  <TextInput
                    editable={true}
                    value={String(r.totalMarks)}
                    style={[styles.input, styles.inputDisabled]}
                  />
                </View>
              </View>
            </View>
          ))}

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
            <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
          </Pressable>
          <Pressable onPress={saveBulk} style={styles.saveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={PALETTE.surface} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={18} color={PALETTE.surface} />
                <ThemedText style={styles.saveBtnText}>Save Marks</ThemedText>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 16 },

  card: {
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    padding: 16,
  },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: PALETTE.border, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: PALETTE.textHeading },

  label: { fontSize: 13, fontWeight: '700', color: PALETTE.textHeading, marginBottom: 6, marginTop: 12 },
  
  dropdownWrap: { 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 4, 
    backgroundColor: PALETTE.background,
    overflow: 'hidden' 
  },
  picker: { height: 50, color: PALETTE.textHeading },

  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: PALETTE.background,
    color: PALETTE.textHeading,
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: PALETTE.border,
    color: PALETTE.textBody,
  },

  infoCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(118,171,174,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(118,171,174,0.3)',
  },
  infoText: { flex: 1, color: PALETTE.textHeading, fontWeight: '600' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: PALETTE.surface,
  },
  searchInput: { flex: 1, height: 44, color: PALETTE.textHeading },

  studentCard: {
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  studentName: { fontWeight: '700', fontSize: 15, color: PALETTE.textHeading },
  
  inputRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 12, color: PALETTE.textBody, marginBottom: 6, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { color: PALETTE.textHeading, fontWeight: '700' },
  
  saveBtn: {
    flex: 1,
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: PALETTE.surface, fontWeight: '700' },
});