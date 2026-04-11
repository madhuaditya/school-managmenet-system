import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { FeePayment, FeeRecord } from '@/src/types';
import { formatMoney, monthOptions, yearOptions } from '@/src/utils/finance';

export default function MyFeeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const studentId = user?._id || '';
  const years = yearOptions();

  const [month, setMonth] = useState(monthOptions[new Date().getMonth()].value);
  const [year, setYear] = useState(years[0] || new Date().getFullYear());

  const [record, setRecord] = useState<FeeRecord | null>(null);
  const [history, setHistory] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== 'student') {
      router.replace('/(tabs)');
      return;
    }
    void loadMyFee();
  }, [role, router, month, year, studentId]);

  const loadMyFee = async () => {
    try {
      setLoading(true);
      const recordResult = await apiService.getStudentFeeByMonth({ studentId, month, year });
      if (!recordResult.success || !recordResult.data) {
        setRecord(null);
        setHistory([]);
        return;
      }

      setRecord(recordResult.data);

      const historyResult = await apiService.getStudentFeePaymentHistory({ studentId, page: 1, limit: 50 });
      if (historyResult.success) {
        const list = Array.isArray(historyResult.data?.records) ? historyResult.data.records : [];
        setHistory(list.filter((entry) => entry.feeRecordId === recordResult.data?._id));
      } else {
        setHistory([]);
      }
    } catch (error) {
      setRecord(null);
      setHistory([]);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load fee details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>My Fee</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Filter</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Month</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={month} onValueChange={(v) => setMonth(v)}>
              {monthOptions.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Year</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={year} onValueChange={(v) => setYear(Number(v))}>
              {years.map((item) => (
                <Picker.Item key={item} label={String(item)} value={item} />
              ))}
            </Picker>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Fee Details</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {!loading && !record ? <ThemedText>No fee record found for selected month/year.</ThemedText> : null}

        {record ? (
          <View style={styles.summary}>
            <ThemedText>Total Fee: {formatMoney(record.totalFee)}</ThemedText>
            <ThemedText>Paid Amount: {formatMoney(record.paidAmount)}</ThemedText>
            <ThemedText>Due Amount: {formatMoney(record.dueAmount)}</ThemedText>
            <ThemedText>Status: {record.status}</ThemedText>
            <ThemedText>Due Date: {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Payment History</ThemedText>
        {!loading && history.length === 0 ? <ThemedText>No payments recorded for this fee cycle.</ThemedText> : null}
        {history.map((entry) => (
          <View key={entry._id} style={styles.item}>
            <ThemedText style={styles.itemTitle}>Amount: {formatMoney(entry.amount)}</ThemedText>
            <ThemedText>Late Fee: {formatMoney(entry.lateFee || 0)}</ThemedText>
            <ThemedText>Method: {entry.method}</ThemedText>
            <ThemedText>Status: {entry.status || '-'}</ThemedText>
            <ThemedText>Date: {entry.paidAt ? new Date(entry.paidAt).toLocaleString() : 'N/A'}</ThemedText>
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
  pickerWrap: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, overflow: 'hidden' },
  summary: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4, backgroundColor: '#f8fafc' },
  item: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { fontWeight: '700' },
});
