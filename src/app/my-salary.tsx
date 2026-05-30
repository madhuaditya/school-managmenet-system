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

interface StaffOption {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
  };
}

export default function MySalaryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const userId = user?._id || '';
  const isAdmin = role === 'admin';

  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState(userId);
  const [record, setRecord] = useState<SalaryRecord | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canAccess = useMemo(() => ['admin', 'teacher', 'staff'].includes(String(role || '')), [role]);

  const staffOptions = useMemo(
    () =>
      staffList.map((item) => ({
        value: item.user?._id || item._id,
        label: item.user?.name || item.user?.email || 'Unnamed Staff',
        meta: item.user?.email || '',
      })),
    [staffList],
  );

  const selectedStaffLabel = useMemo(() => {
    if (!selectedStaffId) return 'Select a staff member';
    if (selectedStaffId === userId) return user?.name || 'My profile';
    return staffOptions.find((entry) => entry.value === selectedStaffId)?.label || 'Selected staff';
  }, [selectedStaffId, staffOptions, user?.name, userId]);

  useEffect(() => {
    if (!canAccess) {
      router.replace('/(tabs)');
      return;
    }
    if (isAdmin) {
      void loadStaffList();
      return;
    }

    setSelectedStaffId(userId);
  }, [canAccess, isAdmin, router, userId]);

  useEffect(() => {
    if (!canAccess) return;
    if (!selectedStaffId) return;
    void loadMySalary(selectedStaffId);
  }, [canAccess, month, year, selectedStaffId]);

  const loadStaffList = async () => {
    try {
      setStaffLoading(true);
      const response = await apiService.getStaff();
      if (!response.success) throw new Error(response.msg || 'Failed to load staff list');

      const list = (response.data as StaffOption[]) || [];
      setStaffList(list);

      const defaultStaffId = userId && list.some((item) => (item.user?._id || item._id) === userId)
        ? userId
        : list[0]?.user?._id || list[0]?._id || '';

      if (defaultStaffId) {
        setSelectedStaffId(defaultStaffId);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load staff list');
    } finally {
      setStaffLoading(false);
    }
  };

  const loadMySalary = async (staffId: string) => {
    if (!staffId) return;

    try {
      setLoading(true);
      setHistoryLoading(true);

      const [salaryResult, historyResult] = await Promise.all([
        apiService.getStaffSalaryByMonth({
          staffId,
          month: Number(month),
          year: Number(year),
        }),
        apiService.getStaffSalaryPaymentHistory({
          staffId,
          page: 1,
          limit: 10,
        }),
      ]);

      if (!salaryResult.success || !salaryResult.data) {
        setRecord(null);
        setPayments([]);
      } else {
        setRecord(salaryResult.data);
        setPayments(Array.isArray((salaryResult.data as any)?.payments) ? (salaryResult.data as any).payments : []);
      }

      if (!historyResult.success) {
        throw new Error(historyResult.msg || 'Failed to load salary history');
      }

      setPaymentHistory(Array.isArray((historyResult.data as any)?.records) ? (historyResult.data as any).records : []);
    } catch (error) {
      setRecord(null);
      setPayments([]);
      setPaymentHistory([]);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary');
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  };

  const currentDueAmount = record ? Math.max(0, Number((record as any)?.dueAmount ?? record.netSalary - record.paidAmount)) : 0;
  const currentPaymentCount = record ? Number((record as any)?.paymentCount ?? payments.length) : 0;
  const currentExpectedAmount = record ? Number((record as any)?.expectedAmount ?? record.totalEarnings) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>{isAdmin ? 'Staff Salary Browser' : 'My Salary'}</ThemedText>
      <ThemedText style={styles.helper}>
        {isAdmin
          ? 'Pick a staff member, then filter by month and year to inspect salary details.'
          : 'Review your monthly salary summary and payment history.'}
      </ThemedText>

      {isAdmin ? (
        <ThemedView style={styles.card}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Staff Member</ThemedText>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={selectedStaffId}
                onValueChange={(value) => setSelectedStaffId(String(value))}
                enabled={!staffLoading && staffOptions.length > 0}
              >
                <Picker.Item label={staffLoading ? 'Loading staff...' : 'Select staff'} value="" />
                {staffOptions.map((entry) => (
                  <Picker.Item
                    key={entry.value}
                    label={entry.meta ? `${entry.label} • ${entry.meta}` : entry.label}
                    value={entry.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Filters</ThemedText>
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

        <Pressable style={[styles.button, styles.primary]} onPress={() => loadMySalary(selectedStaffId)}>
          <ThemedText style={styles.buttonText}>{loading ? 'Loading...' : 'Refresh'}</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>{selectedStaffLabel}</ThemedText>
        <ThemedText>Month: {monthOptions.find((entry) => String(entry.value) === month)?.label || month}</ThemedText>
        <ThemedText>Year: {year}</ThemedText>
      </ThemedView>

      {record ? (
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subheading}>Salary Record</ThemedText>
          <ThemedText>Selected Staff: {selectedStaffLabel}</ThemedText>
          <ThemedText>Expected Amount: {formatMoney(currentExpectedAmount)}</ThemedText>
          <ThemedText>Status: {record.status}</ThemedText>
          <ThemedText>Base Salary: {formatMoney(record.baseSalary)}</ThemedText>
          <ThemedText>Total Earnings: {formatMoney(record.totalEarnings)}</ThemedText>
          <ThemedText>Total Deductions: {formatMoney(record.totalDeductions)}</ThemedText>
          <ThemedText>Net Salary: {formatMoney(record.netSalary)}</ThemedText>
          <ThemedText>Paid Amount: {formatMoney(record.paidAmount)}</ThemedText>
          <ThemedText>Due Amount: {formatMoney(currentDueAmount)}</ThemedText>
          <ThemedText>Payments Count: {currentPaymentCount}</ThemedText>
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

      <ThemedView style={styles.card}>
        <View style={styles.historyHeader}>
          <ThemedText style={styles.subheading}>Recent Salary Payments</ThemedText>
          {historyLoading ? <ThemedText style={styles.historyLoading}>Loading...</ThemedText> : null}
        </View>
        {paymentHistory.length === 0 ? <ThemedText>No payment history found for this staff member.</ThemedText> : null}
        {paymentHistory.map((payment) => (
          <View key={payment._id} style={styles.historyItem}>
            <View style={styles.historyTopRow}>
              <ThemedText style={styles.itemTitle}>{formatMoney(payment.amount)}</ThemedText>
              <ThemedText style={styles.historyStatus}>{payment.status || 'PENDING'}</ThemedText>
            </View>
            <ThemedText>Method: {payment.method}</ThemedText>
            <ThemedText>Date: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}</ThemedText>
            {payment.transactionId ? <ThemedText>Txn: {payment.transactionId}</ThemedText> : null}
            {payment.remarks ? <ThemedText>Remarks: {payment.remarks}</ThemedText> : null}
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
  helper: { fontSize: 13, lineHeight: 18, color: '#6b7280', marginTop: -4 },
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
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  historyLoading: { fontSize: 12, color: '#6b7280', fontWeight: '700' },
  historyItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  historyTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  historyStatus: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
});
