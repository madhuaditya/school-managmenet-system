import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { Class, FeePayment, FeeRecord } from '@/src/types';
import { formatMoney, toMoney } from '@/src/utils/finance';

type StudentOption = { id: string; label: string };

const formDefault = {
  amount: '',
  lateFee: '0',
  method: 'UPI' as 'UPI' | 'CARD' | 'NETBANKING' | 'CASH',
  transactionId: '',
  remarks: '',
};

export default function FeePaymentsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [payments, setPayments] = useState<FeePayment[]>([]);

  const [form, setForm] = useState(formDefault);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRecord = useMemo(() => records.find((entry) => entry._id === selectedRecordId) || null, [records, selectedRecordId]);

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

  useEffect(() => {
    if (selectedRecordId) void loadPayments(selectedRecordId);
  }, [selectedRecordId]);

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
        .map((entry: any) => ({ id: entry?.user?._id || entry?._id, label: entry?.user?.name || entry?.name || 'Unnamed student' }))
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
      const list = Array.isArray(result.data?.records) ? result.data.records : [];
      setRecords(list);
      setSelectedRecordId(list[0]?._id || '');
    } catch (error) {
      setRecords([]);
      setSelectedRecordId('');
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (feeRecordId: string) => {
    try {
      setLoading(true);
      const result = await apiService.getFeePaymentsByRecord({ feeRecordId, page: 1, limit: 50 });
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
    if (!selectedRecordId) {
      Alert.alert('Validation', 'Please select a fee record.');
      return;
    }

    const amount = toMoney(form.amount);
    const lateFee = toMoney(form.lateFee);
    if (amount <= 0) {
      Alert.alert('Validation', 'Amount must be greater than 0.');
      return;
    }
    if (lateFee < 0) {
      Alert.alert('Validation', 'Late fee must be non-negative.');
      return;
    }

    const maxAllowed = toMoney(selectedRecord?.dueAmount || 0);
    if (toMoney(amount + lateFee) > maxAllowed) {
      Alert.alert('Validation', `Amount + late fee cannot exceed due amount (${formatMoney(maxAllowed)}).`);
      return;
    }

    try {
      setSaving(true);
      const result = await apiService.createFeePayment({
        feeRecordId: selectedRecordId,
        amount,
        lateFee,
        method: form.method,
        transactionId: form.transactionId.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
      });

      if (!result.success) throw new Error(result.msg || 'Failed to create fee payment');

      setForm(formDefault);
      await Promise.all([loadPayments(selectedRecordId), loadRecords(selectedStudentId)]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create fee payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>Fee Payments (Admin)</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Select Fee Record</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Class</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedClassId} onValueChange={(v) => setSelectedClassId(v)}>
              {classes.map((item) => (
                <Picker.Item key={item._id} label={`${item.name}${item.section ? ` (${item.section})` : ''}`} value={item._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Student</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedStudentId} onValueChange={(v) => setSelectedStudentId(v)}>
              {students.map((item) => (
                <Picker.Item key={item.id} label={item.label} value={item.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Fee Record</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedRecordId} onValueChange={(v) => setSelectedRecordId(v)}>
              {records.map((record) => (
                <Picker.Item
                  key={record._id}
                  value={record._id}
                  label={`${record.month}/${record.year} - Due ${formatMoney(record.dueAmount)} (${record.status})`}
                />
              ))}
            </Picker>
          </View>
        </View>

        {selectedRecord ? (
          <View style={styles.summary}>
            <ThemedText>Total Fee: {formatMoney(selectedRecord.totalFee)}</ThemedText>
            <ThemedText>Paid: {formatMoney(selectedRecord.paidAmount)}</ThemedText>
            <ThemedText>Due: {formatMoney(selectedRecord.dueAmount)}</ThemedText>
            <ThemedText>Status: {selectedRecord.status}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Create Payment</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Amount</ThemedText>
          <TextInput value={form.amount} onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} keyboardType="numeric" style={styles.input} />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Late Fee</ThemedText>
          <TextInput value={form.lateFee} onChangeText={(v) => setForm((p) => ({ ...p, lateFee: v }))} keyboardType="numeric" style={styles.input} />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Method</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.method} onValueChange={(v) => setForm((p) => ({ ...p, method: v as typeof form.method }))}>
              <Picker.Item label="UPI" value="UPI" />
              <Picker.Item label="CARD" value="CARD" />
              <Picker.Item label="NETBANKING" value="NETBANKING" />
              <Picker.Item label="CASH" value="CASH" />
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Transaction ID</ThemedText>
          <TextInput value={form.transactionId} onChangeText={(v) => setForm((p) => ({ ...p, transactionId: v }))} style={styles.input} />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Remarks</ThemedText>
          <TextInput value={form.remarks} onChangeText={(v) => setForm((p) => ({ ...p, remarks: v }))} style={styles.input} />
        </View>

        <Pressable style={[styles.button, styles.primary]} disabled={saving} onPress={createPayment}>
          <ThemedText style={styles.buttonText}>{saving ? 'Saving...' : 'Create Payment'}</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Payment History</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {payments.map((payment) => (
          <View key={payment._id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>Amount: {formatMoney(payment.amount)}</ThemedText>
            <ThemedText>Method: {payment.method}</ThemedText>
            <ThemedText>Late Fee: {formatMoney(payment.lateFee || 0)}</ThemedText>
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
