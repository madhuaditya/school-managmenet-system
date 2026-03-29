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

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface ClassItem {
  _id: string;
  name: string;
  grade?: string | number;
  section?: string;
}

interface SubjectItem {
  _id: string;
  name: string;
  code?: string;
}

interface PeriodItem {
  subject: string;
  startTime: string;
  endTime: string;
  hour?: number;
}

interface TimeTableItem {
  _id: string;
  name?: string;
  day: DayName;
  class?: ClassItem | string;
  classId?: string;
  periods: Array<
    PeriodItem & {
      subject?: SubjectItem | string;
      _id?: string;
    }
  >;
}

const DAYS: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getRole = (role: unknown) => {
  if (typeof role === 'string') return role;
  if (role && typeof role === 'object' && 'role' in role) {
    const value = (role as { role?: string }).role;
    return value || '';
  }
  return '';
};

export default function TimeTableTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const user = useAuthStore((state) => state.user);
  const isAdmin = getRole(user?.role) === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [items, setItems] = useState<TimeTableItem[]>([]);

  const [name, setName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayName>('Monday');
  const [periods, setPeriods] = useState<PeriodItem[]>([{ subject: '', startTime: '', endTime: '', hour: 1 }]);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      return;
    }

    void loadSubjectsForClass(selectedClassId);
  }, [selectedClassId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classResponse, timetableResponse] = await Promise.all([
        apiService.getClasses(),
        apiService.getAllTimetables(),
      ]);

      if (!classResponse.success) {
        throw new Error(classResponse.msg || 'Failed to load classes');
      }
      if (!timetableResponse.success) {
        throw new Error(timetableResponse.msg || 'Failed to load timetables');
      }

      setClasses(Array.isArray(classResponse.data) ? (classResponse.data as unknown as ClassItem[]) : []);
      setItems(Array.isArray(timetableResponse.data) ? (timetableResponse.data as unknown as TimeTableItem[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectsForClass = async (classId: string) => {
    try {
      const response = await apiService.getSubjectsByClass(classId);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to load subjects');
      }
      setSubjects(Array.isArray(response.data) ? (response.data as unknown as SubjectItem[]) : []);
    } catch (err) {
      setSubjects([]);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load subjects');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSelectedClassId(null);
    setSelectedDay('Monday');
    setPeriods([{ subject: '', startTime: '', endTime: '', hour: 1 }]);
    setSubjects([]);
  };

  const updatePeriod = (index: number, patch: Partial<PeriodItem>) => {
    setPeriods((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addPeriodRow = () => {
    setPeriods((prev) => [...prev, { subject: '', startTime: '', endTime: '', hour: prev.length + 1 }]);
  };

  const removePeriodRow = (index: number) => {
    setPeriods((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, hour: idx + 1 })));
  };

  const onSubmit = async () => {
    if (!isAdmin) {
      Alert.alert('Access denied', 'Only admin can create or update timetable.');
      return;
    }

    if (!name.trim() || !selectedClassId || !selectedDay) {
      Alert.alert('Validation', 'Name, class and day are required.');
      return;
    }

    if (periods.length === 0 || periods.some((p) => !p.subject || !p.startTime || !p.endTime)) {
      Alert.alert('Validation', 'Each period must have subject, start time and end time.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        classId: selectedClassId,
        day: selectedDay,
        periods: periods.map((item, idx) => ({
          subject: item.subject,
          startTime: item.startTime,
          endTime: item.endTime,
          hour: item.hour || idx + 1,
        })),
      };

      if (isEditing && editingId) {
        const response = await apiService.updateTimetable(editingId, payload);
        if (!response.success) throw new Error(response.msg || 'Failed to update timetable');
        Alert.alert('Success', 'Timetable updated successfully.');
      } else {
        const response = await apiService.createTimetable(payload);
        if (!response.success) throw new Error(response.msg || 'Failed to create timetable');
        Alert.alert('Success', 'Timetable created successfully.');
      }

      resetForm();
      await loadAll();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!isAdmin) {
      Alert.alert('Access denied', 'Only admin can delete timetable.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.deleteTimetable(id);
      if (!response.success) throw new Error(response.msg || 'Failed to delete timetable');
      Alert.alert('Success', 'Timetable deleted successfully.');
      await loadAll();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete timetable');
    } finally {
      setSaving(false);
    }
  };

  const getClassId = (item: TimeTableItem) => {
    if (item.classId) return item.classId;
    if (item.class && typeof item.class === 'object') return item.class._id;
    if (typeof item.class === 'string') return item.class;
    return null;
  };

  const onEdit = async (item: TimeTableItem) => {
    const classId = getClassId(item);
    setEditingId(item._id);
    setName(item.name || '');
    setSelectedDay(item.day || 'Monday');
    setSelectedClassId(classId);

    if (classId) {
      await loadSubjectsForClass(classId);
    }

    const normalizedPeriods = (item.periods || []).map((period, idx) => ({
      subject:
        typeof period.subject === 'string'
          ? period.subject
          : period.subject && typeof period.subject === 'object'
            ? period.subject._id
            : period.subject || '',
      startTime: period.startTime || '',
      endTime: period.endTime || '',
      hour: period.hour || idx + 1,
    }));

    setPeriods(normalizedPeriods.length > 0 ? normalizedPeriods : [{ subject: '', startTime: '', endTime: '', hour: 1 }]);
  };

  const classLabel = (cls: ClassItem) => {
    const section = cls.section ? ` (${cls.section})` : '';
    const grade = cls.grade !== undefined && cls.grade !== null ? ` Grade ${cls.grade}` : '';
    return `${cls.name}${section}${grade}`;
  };

  const getClassNameFromItem = (item: TimeTableItem) => {
    if (item.class && typeof item.class === 'object') {
      const part = item.class.name || 'Class';
      return `${part}${item.class.section ? ` (${item.class.section})` : ''}`;
    }
    const classId = getClassId(item);
    const cls = classes.find((c) => c._id === classId);
    return cls ? classLabel(cls) : 'Class';
  };

  const getSubjectName = (subjectValue: unknown) => {
    if (subjectValue && typeof subjectValue === 'object' && '_id' in subjectValue) {
      const data = subjectValue as { _id: string; name?: string; code?: string };
      return data.name || data.code || 'Subject';
    }
    if (typeof subjectValue === 'string') {
      const found = subjects.find((sub) => sub._id === subjectValue);
      return found ? found.name : 'Subject';
    }
    return 'Subject';
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
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      {isAdmin ? (
        <ThemedView style={[styles.formCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
          <ThemedText type="defaultSemiBold">{isEditing ? 'Edit Timetable' : 'Create Timetable'}</ThemedText>

          <TextInput
            style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            placeholder="Timetable name"
            placeholderTextColor={theme.icon}
            value={name}
            onChangeText={setName}
            editable={!saving}
          />

          <ThemedText style={styles.label}>Select Day</ThemedText>
          <View style={styles.chipsWrap}>
            {DAYS.map((day) => (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.chip,
                  {
                    borderColor: theme.icon,
                    backgroundColor: selectedDay === day ? theme.tint : theme.background,
                  },
                ]}>
                <ThemedText style={{ color: selectedDay === day ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>
                  {day}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText style={styles.label}>Select Class</ThemedText>
          <View style={styles.chipsWrap}>
            {classes.length === 0 ? (
              <ThemedText style={styles.mutedText}>No classes found</ThemedText>
            ) : (
              classes.map((cls) => (
                <Pressable
                  key={cls._id}
                  onPress={() => setSelectedClassId(cls._id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.icon,
                      backgroundColor: selectedClassId === cls._id ? theme.tint : theme.background,
                    },
                  ]}>
                  <ThemedText
                    style={{
                      color: selectedClassId === cls._id ? '#fff' : theme.text,
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                    {classLabel(cls)}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </View>

          <ThemedText style={styles.label}>Periods</ThemedText>
          {periods.map((period, index) => (
            <ThemedView key={`period-${index}`} style={[styles.periodCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <ThemedText type="defaultSemiBold">Period {index + 1}</ThemedText>

              <View style={styles.chipsWrap}>
                {subjects.length === 0 ? (
                  <ThemedText style={styles.mutedText}>Select class to load subjects</ThemedText>
                ) : (
                  subjects.map((subject) => (
                    <Pressable
                      key={subject._id}
                      onPress={() => updatePeriod(index, { subject: subject._id })}
                      style={[
                        styles.chip,
                        {
                          borderColor: theme.icon,
                          backgroundColor: period.subject === subject._id ? theme.tint : theme.background,
                        },
                      ]}>
                      <ThemedText style={{ color: period.subject === subject._id ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>
                        {subject.name}
                      </ThemedText>
                    </Pressable>
                  ))
                )}
              </View>

              <TextInput
                style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
                placeholder="Start time (09:00)"
                placeholderTextColor={theme.icon}
                value={period.startTime}
                onChangeText={(value) => updatePeriod(index, { startTime: value })}
                editable={!saving}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
                placeholder="End time (09:45)"
                placeholderTextColor={theme.icon}
                value={period.endTime}
                onChangeText={(value) => updatePeriod(index, { endTime: value })}
                editable={!saving}
              />

              {periods.length > 1 ? (
                <Pressable style={styles.removeBtn} onPress={() => removePeriodRow(index)} disabled={saving}>
                  <ThemedText style={styles.actionText}>Remove Period</ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
          ))}

          <View style={styles.row}>
            <Pressable style={[styles.secondaryBtn, saving && styles.disabled]} onPress={addPeriodRow} disabled={saving}>
              <ThemedText style={styles.secondaryText}>+ Add Period</ThemedText>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable style={[styles.primaryBtn, saving && styles.disabled]} onPress={onSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.actionText}>{isEditing ? 'Update' : 'Create'}</ThemedText>}
            </Pressable>

            {isEditing ? (
              <Pressable style={styles.secondaryBtn} onPress={resetForm} disabled={saving}>
                <ThemedText style={styles.secondaryText}>Cancel</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </ThemedView>
      ) : (
        <ThemedView style={[styles.readOnlyCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
          <ThemedText style={styles.mutedText}>Read-only access: timetable create, edit and delete are admin only.</ThemedText>
        </ThemedView>
      )}

      <ThemedText type="subtitle">All Timetables (Your School)</ThemedText>
      {items.length === 0 ? (
        <ThemedText style={styles.mutedText}>No timetable found</ThemedText>
      ) : (
        items.map((item) => (
          <ThemedView key={item._id} style={[styles.itemCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
            <ThemedText type="defaultSemiBold">{item.name || 'Timetable'} | {item.day}</ThemedText>
            <ThemedText style={styles.mutedText}>Class: {getClassNameFromItem(item)}</ThemedText>

            {(item.periods || []).map((period, idx) => (
              <ThemedText key={`${item._id}-p-${idx}`} style={styles.periodText}>
                {idx + 1}. {getSubjectName(period.subject)} | {period.startTime} - {period.endTime}
              </ThemedText>
            ))}

            {isAdmin ? (
              <View style={styles.row}>
                <Pressable style={styles.editBtn} onPress={() => void onEdit(item)} disabled={saving}>
                  <ThemedText style={styles.actionText}>Edit</ThemedText>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => void onDelete(item._id)} disabled={saving}>
                  <ThemedText style={styles.actionText}>Delete</ThemedText>
                </Pressable>
              </View>
            ) : null}
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
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  readOnlyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  label: {
    opacity: 0.8,
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  periodCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1976d2',
  },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  editBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  deleteBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
  },
  removeBtn: {
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryText: {
    color: '#1976d2',
    fontWeight: '700',
  },
  mutedText: {
    opacity: 0.7,
    fontSize: 13,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  periodText: {
    fontSize: 13,
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.65,
  },
});
