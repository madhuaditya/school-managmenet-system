import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { Class, FeeStructure } from '@/src/types';
import { formatMoney, toMoney } from '@/src/utils/finance';

const defaultForm = {
  classId: '',
  tuition: '0',
  exam: '0',
  transport: '0',
  hostel: '0',
  activity: '0',
  development: '0',
};

export default function FeeStructureScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [classes, setClasses] = useState<Class[]>([]);
  const [records, setRecords] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    void loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classResult, feeResult] = await Promise.all([apiService.getClasses(), apiService.getAllFeeStructures()]);
      if (!classResult.success) throw new Error(classResult.msg || 'Failed to load classes');
      if (!feeResult.success) throw new Error(feeResult.msg || 'Failed to load fee structures');
      const classList = Array.isArray(classResult.data) ? classResult.data : [];
      setClasses(classList);
      setRecords(Array.isArray(feeResult.data) ? feeResult.data : []);
      if (!form.classId && classList[0]?._id) setForm((prev) => ({ ...prev, classId: classList[0]._id }));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load fee structure data');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!form.classId) {
      Alert.alert('Validation', 'Class is required.');
      return false;
    }
    const values = [form.tuition, form.exam, form.transport, form.hostel, form.activity, form.development].map(Number);
    if (values.some((item) => !Number.isFinite(item) || item < 0)) {
      Alert.alert('Validation', 'Fee components must be non-negative numbers.');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm((prev) => ({ ...defaultForm, classId: prev.classId || classes[0]?._id || '' }));
  };

  const submit = async () => {
    if (!validate()) return;

    const payload = {
      classId: form.classId,
      components: {
        tuition: toMoney(form.tuition),
        exam: toMoney(form.exam),
        transport: toMoney(form.transport),
        hostel: toMoney(form.hostel),
        activity: toMoney(form.activity),
        development: toMoney(form.development),
      },
    };

    try {
      setSaving(true);
      const result = editingId ? await apiService.updateFeeStructure(editingId, payload) : await apiService.createFeeStructure(payload);
      if (!result.success) throw new Error(result.msg || 'Failed to save fee structure');
      resetForm();
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: FeeStructure) => {
    const classId = typeof entry.class === 'object' ? entry.class?._id || '' : entry.class || '';
    setEditingId(entry._id);
    setForm({
      classId,
      tuition: String(entry.components?.tuition ?? 0),
      exam: String(entry.components?.exam ?? 0),
      transport: String(entry.components?.transport ?? 0),
      hostel: String(entry.components?.hostel ?? 0),
      activity: String(entry.components?.activity ?? 0),
      development: String(entry.components?.development ?? 0),
    });
  };

  const remove = (id: string) => {
    Alert.alert('Confirm', 'Delete this fee structure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const result = await apiService.deleteFeeStructure(id);
            if (!result.success) throw new Error(result.msg || 'Failed to delete fee structure');
            if (editingId === id) resetForm();
            await loadData();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete fee structure');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const classLabel = (entry: FeeStructure) => {
    if (typeof entry.class === 'object') {
      return `${entry.class?.name || 'Class'}${entry.class?.section ? ` (${entry.class.section})` : ''}`;
    }
    const found = classes.find((c) => c._id === entry.class);
    return found ? `${found.name}${found.section ? ` (${found.section})` : ''}` : 'Class';
  };

  const renderInput = (label: string, key: keyof typeof defaultForm) => (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        value={String(form[key])}
        onChangeText={(text) => setForm((prev) => ({ ...prev, [key]: text }))}
        keyboardType="numeric"
        style={styles.input}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>Fee Structure (Admin)</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>{isEditing ? 'Update Structure' : 'Create Structure'}</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Class</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.classId} onValueChange={(v) => setForm((p) => ({ ...p, classId: v }))}>
              {classes.map((item) => (
                <Picker.Item key={item._id} label={`${item.name}${item.section ? ` (${item.section})` : ''}`} value={item._id} />
              ))}
            </Picker>
          </View>
        </View>

        {renderInput('Tuition', 'tuition')}
        {renderInput('Exam', 'exam')}
        {renderInput('Transport', 'transport')}
        {renderInput('Hostel', 'hostel')}
        {renderInput('Activity', 'activity')}
        {renderInput('Development', 'development')}

        <View style={styles.row}>
          <Pressable style={[styles.button, styles.primary]} onPress={submit} disabled={saving}>
            <ThemedText style={styles.buttonText}>{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</ThemedText>
          </Pressable>
          {isEditing ? (
            <Pressable style={[styles.button, styles.secondary]} onPress={resetForm}>
              <ThemedText style={styles.secondaryText}>Cancel</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Existing Structures</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {records.map((entry) => {
          const total =
            Number(entry.components?.tuition || 0) +
            Number(entry.components?.exam || 0) +
            Number(entry.components?.transport || 0) +
            Number(entry.components?.hostel || 0) +
            Number(entry.components?.activity || 0) +
            Number(entry.components?.development || 0);

          return (
            <View key={entry._id} style={styles.item}>
              <ThemedText style={styles.itemTitle}>{classLabel(entry)}</ThemedText>
              <ThemedText>Total: {formatMoney(total)}</ThemedText>
              <View style={styles.row}>
                <Pressable style={[styles.smallButton, styles.primary]} onPress={() => startEdit(entry)}>
                  <ThemedText style={styles.buttonText}>Edit</ThemedText>
                </Pressable>
                <Pressable style={[styles.smallButton, styles.danger]} onPress={() => remove(entry._id)}>
                  <ThemedText style={styles.buttonText}>Delete</ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, elevation: 3 },
  subheading: { fontSize: 16, fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  pickerWrap: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  smallButton: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#e2e8f0' },
  danger: { backgroundColor: '#DC2626' },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryText: { color: '#0f172a', fontWeight: '700' },
  item: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { fontWeight: '700' },
});
