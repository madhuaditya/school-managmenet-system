import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { Class, FeeRecord } from '@/src/types';
import { formatMoney, monthOptions, toMoney, yearOptions } from '@/src/utils/finance';

type StudentOption = { id: string; label: string };

const defaultForm = {
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  totalFee: '',
  dueAmount: '',
  discount: '0',
  fine: '0',
  dueDate: '',
  notes: '',
  status: 'PENDING' as FeeRecord['status'],
};

export default function FeeRecordsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [records, setRecords] = useState<FeeRecord[]>([]);

  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    void loadClasses();
  }, [role, router]);

  useEffect(() => {
    if (selectedClassId) void loadStudents(selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedStudentId) void loadRecords(selectedStudentId);
  }, [selectedStudentId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const result = await apiService.getClasses();
      if (!result.success) throw new Error(result.msg || 'Failed to load classes');
      const classList = Array.isArray(result.data) ? result.data : [];
      setClasses(classList);
      setSelectedClassId(classList[0]?._id || '');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      setLoading(true);
      const result = await apiService.getClassById(classId);
      if (!result.success) throw new Error(result.msg || 'Failed to load class students');

      const options = (Array.isArray(result.data?.students) ? result.data.students : [])
        .map((entry: any) => ({
          id: entry?.user?._id || entry?._id,
          label: entry?.user?.name || entry?.name || 'Unnamed student',
        }))
        .filter((entry) => entry.id);

      setStudents(options);
      setSelectedStudentId(options[0]?.id || '');
    } catch (error) {
      setStudents([]);
      setSelectedStudentId('');
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (studentId: string) => {
    try {
      setLoading(true);
      const result = await apiService.getStudentAllFeeRecords({ studentId, page: 1, limit: 50 });
      if (!result.success) throw new Error(result.msg || 'Failed to load fee records');
      setRecords(Array.isArray(result.data?.records) ? result.data.records : []);
    } catch (error) {
      setRecords([]);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!selectedStudentId) {
      Alert.alert('Validation', 'Please select a student.');
      return false;
    }

    const month = Number(form.month);
    const year = Number(form.year);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      Alert.alert('Validation', 'Month must be between 1 and 12.');
      return false;
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      Alert.alert('Validation', 'Year must be between 2000 and 2100.');
      return false;
    }

    const totalFee = toMoney(form.totalFee);
    const dueAmount = toMoney(form.dueAmount);
    if (totalFee <= 0) {
      Alert.alert('Validation', 'Total fee must be greater than 0.');
      return false;
    }
    if (dueAmount < 0 || dueAmount > totalFee) {
      Alert.alert('Validation', 'Due amount must be between 0 and total fee.');
      return false;
    }

    const discount = toMoney(form.discount);
    const fine = toMoney(form.fine);
    if (discount < 0 || fine < 0) {
      Alert.alert('Validation', 'Discount and fine must be non-negative.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const submit = async () => {
    if (!validate()) return;

    const payload = {
      userId: selectedStudentId,
      month: Number(form.month),
      year: Number(form.year),
      totalFee: toMoney(form.totalFee),
      dueAmount: toMoney(form.dueAmount),
      discount: toMoney(form.discount),
      fine: toMoney(form.fine),
      dueDate: form.dueDate || null,
      notes: form.notes.trim(),
      status: form.status,
    };

    try {
      setSaving(true);
      const result = editingId ? await apiService.updateFeeRecord(editingId, payload) : await apiService.createFeeRecord(payload);
      if (!result.success) throw new Error(result.msg || 'Failed to save fee record');
      resetForm();
      await loadRecords(selectedStudentId);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save fee record');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record: FeeRecord) => {
    setEditingId(record._id);
    setForm({
      month: String(record.month || ''),
      year: String(record.year || ''),
      totalFee: String(record.totalFee ?? 0),
      dueAmount: String(record.dueAmount ?? 0),
      discount: String(record.discount ?? 0),
      fine: String(record.fine ?? 0),
      dueDate: record.dueDate ? new Date(record.dueDate).toISOString().split('T')[0] : '',
      notes: record.notes || '',
      status: record.status || 'PENDING',
    });
  };

  const remove = (id: string) => {
    Alert.alert('Confirm', 'Delete this fee record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const result = await apiService.deleteFeeRecord(id);
            if (!result.success) throw new Error(result.msg || 'Failed to delete fee record');
            if (editingId === id) resetForm();
            await loadRecords(selectedStudentId);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete fee record');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setForm((prev) => ({ ...prev, dueDate: selectedDate.toISOString().split('T')[0] }));
  };

  const renderInput = (label: string, key: keyof typeof defaultForm, numeric = true) => (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        value={String(form[key])}
        onChangeText={(text) => setForm((prev) => ({ ...prev, [key]: text }))}
        keyboardType={numeric ? 'numeric' : 'default'}
        style={styles.input}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>Fee Records (Admin)</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Select Student</ThemedText>
        <View style={styles.field}>
          <ThemedText style={styles.label}>Class</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedClassId} onValueChange={(v) => setSelectedClassId(v)}>
              {classes.map((entry) => (
                <Picker.Item key={entry._id} label={`${entry.name}${entry.section ? ` (${entry.section})` : ''}`} value={entry._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Student</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedStudentId} onValueChange={(v) => setSelectedStudentId(v)}>
              {students.map((entry) => (
                <Picker.Item key={entry.id} label={entry.label} value={entry.id} />
              ))}
            </Picker>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>{isEditing ? 'Update Fee Record' : 'Create Fee Record'}</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Month</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.month} onValueChange={(v) => setForm((p) => ({ ...p, month: String(v) }))}>
              {monthOptions.map((entry) => (
                <Picker.Item key={entry.value} label={entry.label} value={String(entry.value)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Year</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.year} onValueChange={(v) => setForm((p) => ({ ...p, year: String(v) }))}>
              {yearOptions().map((entry) => (
                <Picker.Item key={entry} label={String(entry)} value={String(entry)} />
              ))}
            </Picker>
          </View>
        </View>

        {renderInput('Total Fee', 'totalFee')}
        {renderInput('Due Amount', 'dueAmount')}
        {renderInput('Discount', 'discount')}
        {renderInput('Fine', 'fine')}

        <View style={styles.field}>
          <ThemedText style={styles.label}>Due Date</ThemedText>
          <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <ThemedText>{form.dueDate || 'Select due date'}</ThemedText>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={form.dueDate ? new Date(form.dueDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          ) : null}
        </View>

        {renderInput('Notes', 'notes', false)}

        <View style={styles.field}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as FeeRecord['status'] }))}>
              <Picker.Item label="PENDING" value="PENDING" />
              <Picker.Item label="PARTIAL" value="PARTIAL" />
              <Picker.Item label="PAID" value="PAID" />
            </Picker>
          </View>
        </View>

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
        <ThemedText style={styles.subheading}>Student Fee Records</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {records.map((record) => (
          <View key={record._id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>{record.month}/{record.year} - {record.status}</ThemedText>
            <ThemedText>Total: {formatMoney(record.totalFee)} | Paid: {formatMoney(record.paidAmount)} | Due: {formatMoney(record.dueAmount)}</ThemedText>
            <View style={styles.row}>
              <Pressable style={[styles.smallButton, styles.primary]} onPress={() => startEdit(record)}>
                <ThemedText style={styles.buttonText}>Edit</ThemedText>
              </Pressable>
              <Pressable style={[styles.smallButton, styles.danger]} onPress={() => remove(record._id)}>
                <ThemedText style={styles.buttonText}>Delete</ThemedText>
              </Pressable>
            </View>
          </View>
        ))}
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
  dateBtn: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12 },
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
