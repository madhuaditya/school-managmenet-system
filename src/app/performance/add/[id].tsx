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

const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

export default function AddPerformanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<'exam' | 'test' | 'assignment'>('exam');
  const [title, setTitle] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [remarks, setRemarks] = useState('');

  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === subjectId),
    [subjects, subjectId],
  );

  useEffect(() => {
    navigation.setOptions({ title: 'Add Performance' });
  }, [navigation]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await apiService.getValidSubjectsForStudent(id);
        const subjectList = ((res.data as { subjects?: SubjectItem[] })?.subjects || []) as SubjectItem[];
        setSubjects(subjectList);
        if (subjectList.length > 0) {
          setSubjectId(subjectList[0]._id);
          if (subjectList[0].maxMarks) {
            setTotalMarks(String(subjectList[0].maxMarks));
          }
        }
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load valid subjects');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const onSubmit = async () => {
    if (!id) return;
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
        studentId: id,
        subjectId,
        type,
        title: title.trim(),
        marksObtained: obtained,
        totalMarks: total,
        academicYear: academicYear.trim(),
        remarks: remarks.trim(),
      };

      const res = await apiService.createProgress(payload);
      if (!res.success) throw new Error(res.msg || 'Failed to create performance');

      Alert.alert('Success', 'Performance added successfully', [
        {
          text: 'OK',
          onPress: () => router.replace({ pathname: '/performance/[id]', params: { id: String(id) } }),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create performance');
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
        <ThemedText type="subtitle" style={styles.cardTitle}>Valid Subjects</ThemedText>
        <ThemedText style={styles.helperText}>You can add performance only for these class-valid subjects.</ThemedText>

        <View style={styles.subjectWrap}>
          {subjects.map((subject) => {
            const selected = subject._id === subjectId;
            return (
              <Pressable
                key={subject._id}
                onPress={() => {
                  setSubjectId(subject._id);
                  if (subject.maxMarks) setTotalMarks(String(subject.maxMarks));
                }}
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
      </ThemedView>

      <ThemedView style={[styles.card, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle" style={styles.cardTitle}>Create Record</ThemedText>

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
          placeholder="Strong understanding, improve speed"
          placeholderTextColor={theme.icon}
          style={[styles.input, styles.multilineInput, { borderColor: theme.icon, color: theme.text }]}
          multiline
        />

        <Pressable style={[styles.submitBtn, { backgroundColor: saving ? theme.icon : theme.tint }]} disabled={saving} onPress={onSubmit}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.submitBtnText}>Add Performance</ThemedText>}
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