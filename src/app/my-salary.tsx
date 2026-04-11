import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { SalaryPayment, SalaryRecord } from '@/src/types';
import { formatMoney, monthOptions, yearOptions } from '@/src/utils/finance';

export default function MySalaryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const userId = user?._id || '';

  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [record, setRecord] = useState<SalaryRecord | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const canAccess = useMemo(() => ['admin', 'teacher', 'staff'].includes(String(role || '')), [role]);

  useEffect(() => {
    if (!canAccess) {
      router.replace('/(tabs)');
      return;
    }
    if (userId) void loadMySalary();
  }, [canAccess, router, userId, month, year]);

  const loadMySalary = async () => {
    try {
      setLoading(true);
      const salaryResult = await apiService.getStaffSalaryByMonth({
        staffId: userId,
        month: Number(month),
        year: Number(year),
      });

      if (!salaryResult.success || !salaryResult.data) {
        setRecord(null);
        setPayments([]);
        return;
      }

      setRecord(salaryResult.data);

      const paymentResult = await apiService.getSalaryPaymentsByRecord({
        salaryRecordId: salaryResult.data._id,
        page: 1,
        limit: 50,
      });

      if (!paymentResult.success) {
        setPayments([]);
      } else {
        setPayments(Array.isArray(paymentResult.data?.records) ? paymentResult.data.records : []);
      }
    } catch (error) {
      setRecord(null);
      setPayments([]);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>My Salary</ThemedText>

      <ThemedView style={styles.card}>
        <View style={styles.field}>
          <ThemedText style={styles.label}>Month</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={month} onValueChange={(v) => setMonth(String(v))}>
              {monthOptions.map((entry) => (
                <Picker.Item key={entry.value} label={entry.label} value={String(entry.value)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Year</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={year} onValueChange={(v) => setYear(String(v))}>
              {yearOptions().map((entry) => (
                <Picker.Item key={entry} label={String(entry)} value={String(entry)} />
              ))}
            </Picker>
          </View>
        </View>

        <Pressable style={[styles.button, styles.primary]} onPress={loadMySalary}>
          <ThemedText style={styles.buttonText}>{loading ? 'Loading...' : 'Refresh'}</ThemedText>
        </Pressable>
      </ThemedView>

      {record ? (
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subheading}>Salary Record</ThemedText>
          <ThemedText>Status: {record.status}</ThemedText>
          <ThemedText>Base Salary: {formatMoney(record.baseSalary)}</ThemedText>
          <ThemedText>Total Earnings: {formatMoney(record.totalEarnings)}</ThemedText>
          <ThemedText>Total Deductions: {formatMoney(record.totalDeductions)}</ThemedText>
          <ThemedText>Net Salary: {formatMoney(record.netSalary)}</ThemedText>
          <ThemedText>Paid Amount: {formatMoney(record.paidAmount)}</ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.card}>
          <ThemedText>No salary record found for selected month/year.</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Payment History</ThemedText>
        {payments.length === 0 ? <ThemedText>No payments found.</ThemedText> : null}
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
  subheading: { fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, elevation: 3 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  pickerWrap: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, overflow: 'hidden' },
  button: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginTop: 4 },
  primary: { backgroundColor: '#2563EB' },
  buttonText: { color: '#fff', fontWeight: '700' },
  item: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { fontWeight: '700' },
});
