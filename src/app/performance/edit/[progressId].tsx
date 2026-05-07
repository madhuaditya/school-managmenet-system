import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SubjectItem {
  _id: string;
  name: string;
  code?: string;
  maxMarks?: number;
}

interface PerformanceDetails {
  _id: string;
  student?: string | { _id?: string };
  subject?: string | { _id?: string; name?: string; code?: string };
  type: 'exam' | 'test' | 'assignment';
  title: string;
  marksObtained: number;
  totalMarks: number;
  academicYear: string;
  remarks?: string;
  date?: string;
}

export default function EditPerformanceScreen() {
  const { progressId, studentId } = useLocalSearchParams<{ progressId: string; studentId?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [resolvedStudentId, setResolvedStudentId] = useState('');

  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<'exam' | 'test' | 'assignment'>('exam');
  const [title, setTitle] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [academicYear, setAcademicYear] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pickerState, setPickerState] = useState<null | {
    title: string;
    options: Array<{ value: string; label: string }>;
    selectedValue: string;
    onPick: (value: string) => void;
  }>(null);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === subjectId),
    [subjects, subjectId],
  );

  const openPicker = (title: string, options: Array<{ value: string; label: string }>, selectedValue: string, onPick: (value: string) => void) => {
    setPickerState({ title, options, selectedValue, onPick });
  };

  const closePicker = () => setPickerState(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Update Performance' });
  }, [navigation]);

  useEffect(() => {
    const load = async () => {
      if (!progressId) return;

      try {
        setLoading(true);
        const perfRes = await apiService.getPerformanceById(progressId);
        if (!perfRes.success || !perfRes.data) {
          throw new Error(perfRes.msg || 'Performance record not found');
        }

        const item = perfRes.data as unknown as PerformanceDetails;
        const currentStudentId =
          (typeof item.student === 'string' ? item.student : item.student?._id) ||
          studentId ||
          '';
        setResolvedStudentId(currentStudentId);

        const currentSubjectId =
          (typeof item.subject === 'string' ? item.subject : item.subject?._id) ||
          '';

        setSubjectId(currentSubjectId);
        setType(item.type || 'exam');
        setTitle(item.title || '');
        setMarksObtained(item.marksObtained != null ? String(item.marksObtained) : '');
        setTotalMarks(item.totalMarks != null ? String(item.totalMarks) : '100');
        setAcademicYear(item.academicYear || '');
        setRemarks(item.remarks || '');

        if (currentStudentId) {
          const validSubjectsRes = await apiService.getValidSubjectsForStudent(currentStudentId);
          const list = ((validSubjectsRes.data as { subjects?: SubjectItem[] })?.subjects || []) as SubjectItem[];
          setSubjects(list);
        }
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load performance details');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [progressId, studentId]);

  const onSubmit = async () => {
    if (!progressId) return;

    if (!subjectId || !title.trim() || !marksObtained.trim() || !totalMarks.trim() || !academicYear.trim()) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }

    const obtained = Number(marksObtained);
    const total = Number(totalMarks);

    if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0 || obtained < 0 || obtained > total) {
      Alert.alert('Validation', 'Marks are invalid. Ensure obtained <= total and total > 0.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        subjectId,
        type,
        title: title.trim(),
        marksObtained: obtained,
        totalMarks: total,
        academicYear: academicYear.trim(),
        remarks: remarks.trim(),
      };

      const res = await apiService.updateProgress(progressId, payload);
      if (!res.success) throw new Error(res.msg || 'Failed to update performance');

      Alert.alert('Success', 'Performance updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            const sid = resolvedStudentId || studentId;
            if (sid) {
              router.replace({ pathname: '/performance/[id]', params: { id: String(sid) } });
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update performance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={[styles.card, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle" style={styles.cardTitle}>Update Record</ThemedText>

        <ThemedText style={styles.label}>Valid Subject</ThemedText>
        <Pressable
          onPress={() =>
            openPicker(
              'Select Subject',
              subjects.map((subject) => ({
                value: subject._id,
                label: `${subject.name}${subject.code ? ` (${subject.code})` : ''}`,
              })),
              subjectId,
              setSubjectId,
            )
          }
          style={[styles.dropdownButton, { borderColor: theme.icon, backgroundColor: theme.background }]}
        >
          <ThemedText style={styles.dropdownText}>
            {selectedSubject ? `${selectedSubject.name}${selectedSubject.code ? ` (${selectedSubject.code})` : ''}` : 'Select subject'}
          </ThemedText>
          <ThemedText style={styles.dropdownArrow}>⌄</ThemedText>
        </Pressable>

        <ThemedText style={styles.label}>Assessment Type</ThemedText>
        <Pressable
          onPress={() =>
            openPicker(
              'Select Type',
              [
                { value: 'exam', label: 'EXAM' },
                { value: 'test', label: 'TEST' },
                { value: 'assignment', label: 'ASSIGNMENT' },
              ],
              type,
              (value) => setType(value as 'exam' | 'test' | 'assignment'),
            )
          }
          style={[styles.dropdownButton, { borderColor: theme.icon, backgroundColor: theme.background }]}
        >
          <ThemedText style={styles.dropdownText}>{type.toUpperCase()}</ThemedText>
          <ThemedText style={styles.dropdownArrow}>⌄</ThemedText>
        </Pressable>

        <ThemedText style={styles.label}>Title</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Unit Test 1"
          placeholderTextColor={theme.icon}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
        />

        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <ThemedText style={styles.label}>Marks Obtained</ThemedText>
            <TextInput
              value={marksObtained}
              onChangeText={setMarksObtained}
              keyboardType="decimal-pad"
              placeholder="85"
              placeholderTextColor={theme.icon}
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>
          <View style={styles.col}>
            <ThemedText style={styles.label}>Total Marks</ThemedText>
            <TextInput
              value={totalMarks}
              onChangeText={setTotalMarks}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor={theme.icon}
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>
        </View>

        <ThemedText style={styles.label}>Academic Year</ThemedText>
        <TextInput
          value={academicYear}
          onChangeText={setAcademicYear}
          placeholder="2025-26"
          placeholderTextColor={theme.icon}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
        />

        <ThemedText style={styles.label}>Remarks (optional)</ThemedText>
        <TextInput
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Updated remarks"
          placeholderTextColor={theme.icon}
          style={[styles.input, styles.multilineInput, { borderColor: theme.icon, color: theme.text }]}
          multiline
        />

        <Pressable style={[styles.submitBtn, { backgroundColor: saving ? theme.icon : theme.tint }]} disabled={saving} onPress={onSubmit}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.submitBtnText}>Update Performance</ThemedText>}
        </Pressable>

        {!!selectedSubject && (
          <ThemedText style={styles.helperText}>
            Selected subject max marks: {selectedSubject.maxMarks || 'N/A'}
          </ThemedText>
        )}
      </ThemedView>

      <Modal visible={!!pickerState} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.background }]} onPress={() => undefined}>
            <ThemedText type="subtitle">{pickerState?.title}</ThemedText>
            {pickerState?.options.map((option) => {
              const selected = option.value === pickerState.selectedValue;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    pickerState.onPick(option.value);
                    closePicker();
                  }}
                  style={[styles.modalItem, selected && { backgroundColor: theme.tint }]}
                >
                  <ThemedText style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{option.label}</ThemedText>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
  subjectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inlineButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
    gap: 10,
  },
  modalItem: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#F9FAFB',
  },
  modalItemText: {
    fontWeight: '600',
  },
  modalItemTextSelected: {
    color: '#fff',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 6,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});