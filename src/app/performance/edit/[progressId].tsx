import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === subjectId),
    [subjects, subjectId],
  );

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
        <View style={styles.subjectWrap}>
          {subjects.map((subject) => {
            const selected = subject._id === subjectId;
            return (
              <Pressable
                key={subject._id}
                onPress={() => setSubjectId(subject._id)}
                style={[
                  styles.subjectChip,
                  {
                    borderColor: selected ? theme.tint : theme.icon,
                    backgroundColor: selected ? `${theme.tint}22` : 'rgba(127,127,127,0.08)',
                  },
                ]}>
                <ThemedText style={[styles.subjectText, { color: selected ? theme.tint : theme.text }]}>
                  {subject.name}{subject.code ? ` (${subject.code})` : ''}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={styles.label}>Assessment Type</ThemedText>
        <View style={styles.inlineButtonsRow}>
          {(['exam', 'test', 'assignment'] as const).map((itemType) => {
            const selected = type === itemType;
            return (
              <Pressable
                key={itemType}
                onPress={() => setType(itemType)}
                style={[
                  styles.inlineChip,
                  {
                    borderColor: selected ? theme.tint : theme.icon,
                    backgroundColor: selected ? theme.tint : 'transparent',
                  },
                ]}>
                <ThemedText style={[styles.inlineChipText, { color: selected ? '#fff' : theme.text }]}>
                  {itemType.toUpperCase()}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

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
  subjectChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  subjectText: {
    fontSize: 12,
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
  inlineChip: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inlineChipText: {
    fontSize: 12,
    fontWeight: '800',
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