import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { SalaryRecord } from '@/src/types';
import { formatMoney, monthOptions, toMoney, yearOptions } from '@/src/utils/finance';

type RoleKey = 'admin' | 'teacher' | 'staff';

type UserOption = { id: string; label: string };

const defaultForm = {
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  baseSalary: '0',
  basic: '0',
  hra: '0',
  da: '0',
  bonus: '0',
  pf: '0',
  tax: '0',
  other: '0',
  leaveDeduction: '0',
  remarks: '',
  status: 'UNPAID' as SalaryRecord['status'],
};

export default function SalaryRecordsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentRole = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [selectedRole, setSelectedRole] = useState<RoleKey>('teacher');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [records, setRecords] = useState<SalaryRecord[]>([]);

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    if (currentRole !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    void loadUsers(selectedRole);
  }, [currentRole, router, selectedRole]);

  useEffect(() => {
    if (selectedUserId) void loadRecords(selectedUserId);
  }, [selectedUserId]);

  const loadUsers = async (role: RoleKey) => {
    try {
      setLoading(true);
      const response =
        role === 'admin' ? await apiService.getAdmins() : role === 'teacher' ? await apiService.getTeachers() : await apiService.getStaff();
      if (!response.success) throw new Error(response.msg || 'Failed to load users');

      const list = (Array.isArray(response.data) ? response.data : [])
        .map((entry: any) => ({
          id: entry?.user?._id || entry?._id,
          label: entry?.user?.name || entry?.name || 'Unnamed user',
        }))
        .filter((entry) => entry.id);

      setUsers(list);
      setSelectedUserId(list[0]?.id || '');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load users');
      setUsers([]);
      setSelectedUserId('');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (staffId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getStaffAllSalaries({ staffId, page: 1, limit: 50 });
      if (!response.success) throw new Error(response.msg || 'Failed to load salary records');
      setRecords(Array.isArray(response.data?.records) ? response.data.records : []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!selectedUserId) {
      Alert.alert('Validation', 'Please select a user.');
      return false;
    }
    const month = Number(form.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      Alert.alert('Validation', 'Month must be between 1 and 12.');
      return false;
    }
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      Alert.alert('Validation', 'Year must be between 2000 and 2100.');
      return false;
    }

    const numericKeys: Array<keyof typeof defaultForm> = ['baseSalary', 'basic', 'hra', 'da', 'bonus', 'pf', 'tax', 'other', 'leaveDeduction'];
    const invalid = numericKeys.some((key) => {
      const value = Number(form[key]);
      return !Number.isFinite(value) || value < 0;
    });
    if (invalid) {
      Alert.alert('Validation', 'All amount values must be valid non-negative numbers.');
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
      staffId: selectedUserId,
      month: Number(form.month),
      year: Number(form.year),
      baseSalary: toMoney(form.baseSalary),
      earnings: {
        basic: toMoney(form.basic),
        hra: toMoney(form.hra),
        da: toMoney(form.da),
        bonus: toMoney(form.bonus),
      },
      deductions: {
        pf: toMoney(form.pf),
        tax: toMoney(form.tax),
        other: toMoney(form.other),
        leaveDeduction: toMoney(form.leaveDeduction),
      },
      status: form.status,
      remarks: form.remarks.trim(),
    };

    try {
      setSaving(true);
      const result = editingId
        ? await apiService.updateSalaryRecord(editingId, payload)
        : await apiService.createSalaryRecord(payload);
      if (!result.success) throw new Error(result.msg || 'Failed to save salary record');
      resetForm();
      await loadRecords(selectedUserId);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save salary record');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record: SalaryRecord) => {
    setEditingId(record._id);
    setForm({
      month: String(record.month || ''),
      year: String(record.year || ''),
      baseSalary: String(record.baseSalary ?? 0),
      basic: String(record.earnings?.basic ?? 0),
      hra: String(record.earnings?.hra ?? 0),
      da: String(record.earnings?.da ?? 0),
      bonus: String(record.earnings?.bonus ?? 0),
      pf: String(record.deductions?.pf ?? 0),
      tax: String(record.deductions?.tax ?? 0),
      other: String(record.deductions?.other ?? 0),
      leaveDeduction: String(record.deductions?.leaveDeduction ?? 0),
      remarks: record.remarks || '',
      status: record.status || 'UNPAID',
    });
  };

  const remove = (id: string) => {
    Alert.alert('Confirm', 'Delete this salary record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const result = await apiService.deleteSalaryRecord(id);
            if (!result.success) throw new Error(result.msg || 'Failed to delete salary record');
            if (editingId === id) resetForm();
            await loadRecords(selectedUserId);
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete salary record');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
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
      <ThemedText style={styles.heading}>Salary Records (Admin)</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Select User</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Role</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedRole} onValueChange={(v) => setSelectedRole(v as RoleKey)}>
              <Picker.Item label="Teacher" value="teacher" />
              <Picker.Item label="Staff" value="staff" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>User</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedUserId} onValueChange={(v) => setSelectedUserId(v)}>
              {users.map((u) => (
                <Picker.Item key={u.id} label={u.label} value={u.id} />
              ))}
            </Picker>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>{isEditing ? 'Update Record' : 'Create Record'}</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Month</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.month} onValueChange={(v) => setForm((p) => ({ ...p, month: String(v) }))}>
              {monthOptions.map((month) => (
                <Picker.Item key={month.value} label={month.label} value={String(month.value)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Year</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.year} onValueChange={(v) => setForm((p) => ({ ...p, year: String(v) }))}>
              {yearOptions().map((year) => (
                <Picker.Item key={year} label={String(year)} value={String(year)} />
              ))}
            </Picker>
          </View>
        </View>

        {renderInput('Base Salary', 'baseSalary')}
        {renderInput('Basic', 'basic')}
        {renderInput('HRA', 'hra')}
        {renderInput('DA', 'da')}
        {renderInput('Bonus', 'bonus')}
        {renderInput('PF', 'pf')}
        {renderInput('Tax', 'tax')}
        {renderInput('Other', 'other')}
        {renderInput('Leave Deduction', 'leaveDeduction')}
        {renderInput('Remarks', 'remarks', false)}

        <View style={styles.field}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as SalaryRecord['status'] }))}>
              <Picker.Item label="UNPAID" value="UNPAID" />
              <Picker.Item label="PARTIAL" value="PARTIAL" />
              <Picker.Item label="PAID" value="PAID" />
            </Picker>
          </View>
        </View>

        <View style={styles.row}>
          <Pressable style={[styles.button, styles.primary]} disabled={saving} onPress={submit}>
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
        <ThemedText style={styles.subheading}>Records</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {records.map((record) => (
          <View key={record._id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>{record.month}/{record.year} - {record.status}</ThemedText>
            <ThemedText>Net: {formatMoney(record.netSalary)} | Paid: {formatMoney(record.paidAmount)}</ThemedText>
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
