import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { SalaryPayment, SalaryRecord } from '@/src/types';
import { formatMoney, toMoney } from '@/src/utils/finance';

type RoleKey = 'admin' | 'teacher' | 'staff';
type UserOption = { id: string; label: string };

const paymentDefault = {
  amount: '',
  method: 'BANK' as 'BANK' | 'UPI' | 'CASH',
  transactionId: '',
  remarks: '',
};

export default function SalaryPaymentsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [selectedRole, setSelectedRole] = useState<RoleKey>('teacher');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [form, setForm] = useState(paymentDefault);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRecord = useMemo(() => records.find((item) => item._id === selectedRecordId) || null, [records, selectedRecordId]);
  const pendingAmount = useMemo(() => {
    if (!selectedRecord) return 0;
    return Math.max(toMoney(selectedRecord.netSalary) - toMoney(selectedRecord.paidAmount), 0);
  }, [selectedRecord]);

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    void loadUsers(selectedRole);
  }, [role, router, selectedRole]);

  useEffect(() => {
    if (selectedUserId) void loadRecords(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedRecordId) void loadPayments(selectedRecordId);
  }, [selectedRecordId]);

  const loadUsers = async (roleKey: RoleKey) => {
    try {
      setLoading(true);
      const result =
        roleKey === 'admin' ? await apiService.getAdmins() : roleKey === 'teacher' ? await apiService.getTeachers() : await apiService.getStaff();
      if (!result.success) throw new Error(result.msg || 'Failed to load users');

      const mapped = (Array.isArray(result.data) ? result.data : [])
        .map((entry: any) => ({
          id: entry?.user?._id || entry?._id,
          label: entry?.user?.name || entry?.name || 'Unnamed user',
        }))
        .filter((entry) => entry.id);

      setUsers(mapped);
      setSelectedUserId(mapped[0]?.id || '');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (staffId: string) => {
    try {
      setLoading(true);
      const result = await apiService.getStaffAllSalaries({ staffId, page: 1, limit: 50 });
      if (!result.success) throw new Error(result.msg || 'Failed to load salary records');
      const items = Array.isArray(result.data?.records) ? result.data.records : [];
      setRecords(items);
      setSelectedRecordId(items[0]?._id || '');
    } catch (error) {
      setRecords([]);
      setSelectedRecordId('');
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (salaryRecordId: string) => {
    try {
      setLoading(true);
      const result = await apiService.getSalaryPaymentsByRecord({ salaryRecordId, page: 1, limit: 50 });
      if (!result.success) throw new Error(result.msg || 'Failed to load payments');
      setPayments(Array.isArray(result.data?.records) ? result.data.records : []);
    } catch (error) {
      setPayments([]);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async () => {
    const amount = toMoney(form.amount);
    if (!selectedRecordId) {
      Alert.alert('Validation', 'Please select a salary record.');
      return;
    }
    if (amount <= 0) {
      Alert.alert('Validation', 'Amount must be greater than 0.');
      return;
    }
    if (amount > pendingAmount) {
      Alert.alert('Validation', `Amount cannot exceed pending salary (${formatMoney(pendingAmount)}).`);
      return;
    }

    try {
      setSaving(true);
      const result = await apiService.recordSalaryPayment({
        salaryRecordId: selectedRecordId,
        amount,
        method: form.method,
        transactionId: form.transactionId.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
      });

      if (!result.success) throw new Error(result.msg || 'Failed to record salary payment');

      setForm(paymentDefault);
      await Promise.all([loadRecords(selectedUserId), loadPayments(selectedRecordId)]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to record salary payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>Salary Payments (Admin)</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Select Salary Record</ThemedText>

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
              {users.map((entry) => (
                <Picker.Item key={entry.id} label={entry.label} value={entry.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Salary Record</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedRecordId} onValueChange={(v) => setSelectedRecordId(v)}>
              {records.map((record) => (
                <Picker.Item
                  key={record._id}
                  label={`${record.month}/${record.year} - Net ${formatMoney(record.netSalary)} - Paid ${formatMoney(record.paidAmount)}`}
                  value={record._id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {selectedRecord ? (
          <View style={styles.summary}>
            <ThemedText>Net Salary: {formatMoney(selectedRecord.netSalary)}</ThemedText>
            <ThemedText>Paid: {formatMoney(selectedRecord.paidAmount)}</ThemedText>
            <ThemedText>Pending: {formatMoney(pendingAmount)}</ThemedText>
            <ThemedText>Status: {selectedRecord.status}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Record Payment</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Amount</ThemedText>
          <TextInput value={form.amount} onChangeText={(text) => setForm((p) => ({ ...p, amount: text }))} keyboardType="numeric" style={styles.input} />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Method</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.method} onValueChange={(v) => setForm((p) => ({ ...p, method: v as typeof form.method }))}>
              <Picker.Item label="BANK" value="BANK" />
              <Picker.Item label="UPI" value="UPI" />
              <Picker.Item label="CASH" value="CASH" />
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Transaction ID</ThemedText>
          <TextInput value={form.transactionId} onChangeText={(text) => setForm((p) => ({ ...p, transactionId: text }))} style={styles.input} />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Remarks</ThemedText>
          <TextInput value={form.remarks} onChangeText={(text) => setForm((p) => ({ ...p, remarks: text }))} style={styles.input} />
        </View>

        <Pressable style={[styles.button, styles.primary]} disabled={saving} onPress={createPayment}>
          <ThemedText style={styles.buttonText}>{saving ? 'Saving...' : 'Record Payment'}</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Payment History</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {payments.map((payment) => (
          <View key={payment._id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>Amount: {formatMoney(payment.amount)}</ThemedText>
            <ThemedText>Method: {payment.method}</ThemedText>
            <ThemedText>Status: {payment.status || '-'}</ThemedText>
            <ThemedText>Date: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}</ThemedText>
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
  summary: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4, backgroundColor: '#f8fafc' },
  button: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginTop: 4 },
  primary: { backgroundColor: '#2563EB' },
  buttonText: { color: '#fff', fontWeight: '700' },
  item: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { fontWeight: '700' },
});
