import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { SalaryPayment, SalaryRecord } from '@/src/types';
import { formatMoney, monthOptions, yearOptions } from '@/src/utils/finance';

type SalaryHistoryPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type SalaryHistoryResponseData = {
  staffId: string;
  totalPayments: number;
  records: SalaryPayment[];
  pagination: SalaryHistoryPagination;
};

const historyLimitOptions = [10, 20, 50, 100];
const defaultMonth = new Date().getMonth() + 1;
const defaultYear = new Date().getFullYear();

const emptyPagination: SalaryHistoryPagination = {
  page: 1,
  limit: 50,
  totalRecords: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const isValidMonth = (value: number) => Number.isInteger(value) && value >= 1 && value <= 12;
const isValidYear = (value: number) => Number.isInteger(value) && value >= 2020 && value <= new Date().getFullYear() + 2;
const isValidPage = (value: number) => Number.isInteger(value) && value >= 1;
const isValidLimit = (value: number) => Number.isInteger(value) && value >= 1 && value <= 200;

export default function MySalaryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const userId = user?._id || '';
  const canAccess = useMemo(() => ['admin', 'teacher', 'staff'].includes(String(role || '')), [role]);

  const years = useMemo(() => yearOptions(), []);

  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [record, setRecord] = useState<SalaryRecord | null>(null);
  const [summaryPayments, setSummaryPayments] = useState<SalaryPayment[]>([]);
  const [historyRecords, setHistoryRecords] = useState<SalaryPayment[]>([]);
  const [historyPagination, setHistoryPagination] = useState<SalaryHistoryPagination>(emptyPagination);
  const [historyLimit, setHistoryLimit] = useState(50);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const selectedMonthLabel = useMemo(
    () => monthOptions.find((entry) => entry.value === month)?.label || String(month),
    [month],
  );

  const validateMonthYear = (monthValue: number, yearValue: number) => {
    if (!isValidMonth(monthValue)) {
      Alert.alert('Validation', 'Please select a valid month.');
      return false;
    }
    if (!isValidYear(yearValue)) {
      Alert.alert('Validation', 'Please select a valid year.');
      return false;
    }
    if (!userId) {
      Alert.alert('Validation', 'Unable to resolve the current staff account.');
      return false;
    }
    return true;
  };

  const validatePagination = (pageValue: number, limitValue: number) => {
    if (!isValidPage(pageValue)) {
      Alert.alert('Validation', 'Please select a valid page number.');
      return false;
    }
    if (!isValidLimit(limitValue)) {
      Alert.alert('Validation', 'Please select a valid page size.');
      return false;
    }
    return true;
  };

  const loadSalarySummary = async (monthValue = month, yearValue = year) => {
    if (!validateMonthYear(monthValue, yearValue)) return;

    try {
      setSummaryLoading(true);
      const result = await apiService.getStaffSalaryByMonth({
        staffId: userId,
        month: monthValue,
        year: yearValue,
      });

      if (!result.success || !result.data) {
        setRecord(null);
        setSummaryPayments([]);
        return;
      }

      setRecord(result.data);
      setSummaryPayments(Array.isArray((result.data as any)?.payments) ? (result.data as any).payments : []);
    } catch (error) {
      setRecord(null);
      setSummaryPayments([]);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadSalaryHistory = async (pageValue = 1, limitValue = historyLimit) => {
    if (!validatePagination(pageValue, limitValue)) return;
    if (!userId) {
      Alert.alert('Validation', 'Unable to resolve the current staff account.');
      return;
    }

    try {
      setHistoryLoading(true);
      const result = await apiService.getStaffSalaryPaymentHistory({
        staffId: userId,
        page: pageValue,
        limit: limitValue,
      });

      if (!result.success || !result.data) {
        setHistoryRecords([]);
        setHistoryPagination(emptyPagination);
        return;
      }

      const historyData = result.data as SalaryHistoryResponseData;
      setHistoryRecords(Array.isArray(historyData.records) ? historyData.records : []);
      setHistoryPagination(historyData.pagination || { ...emptyPagination, page: pageValue, limit: limitValue });
      setHistoryLimit(historyData.pagination?.limit || limitValue);
    } catch (error) {
      setHistoryRecords([]);
      setHistoryPagination(emptyPagination);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshAll = async () => {
    if (!validateMonthYear(month, year)) return;
    if (!validatePagination(1, historyLimit)) return;

    try {
      setInitialLoading(true);
      await Promise.all([loadSalarySummary(month, year), loadSalaryHistory(1, historyLimit)]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess) {
      router.replace('/(tabs)');
      return;
    }

    if (!userId) return;
    void loadSalarySummary();
    void loadSalaryHistory(1, historyLimit);
    // Initial load only; pagination is handled by explicit button actions.
  }, [canAccess, router, userId]);

  const handlePreviousPage = async () => {
    const nextPage = historyPagination.page - 1;
    if (!historyPagination.hasPrevPage || !validatePagination(nextPage, historyLimit)) return;
    await loadSalaryHistory(nextPage, historyLimit);
  };

  const handleNextPage = async () => {
    const nextPage = historyPagination.page + 1;
    if (!historyPagination.hasNextPage || !validatePagination(nextPage, historyLimit)) return;
    await loadSalaryHistory(nextPage, historyLimit);
  };

  const handleLimitChange = async (nextLimit: number) => {
    if (!validatePagination(1, nextLimit)) return;
    setHistoryLimit(nextLimit);
    await loadSalaryHistory(1, nextLimit);
  };

  const currentDueAmount = record ? Math.max(0, Number((record as any)?.dueAmount ?? record.netSalary - record.paidAmount)) : 0;
  const currentPaymentCount = record ? Number((record as any)?.paymentCount ?? summaryPayments.length) : 0;
  const currentExpectedAmount = record ? Number((record as any)?.expectedAmount ?? record.totalEarnings) : 0;

  const renderPaymentItem = ({ item }: { item: SalaryPayment }) => {
    const paidAt = item.paidAt ? new Date(item.paidAt).toLocaleString() : 'N/A';
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyTopRow}>
          <ThemedText style={styles.itemTitle}>{formatMoney(item.amount)}</ThemedText>
          <ThemedText style={styles.historyStatus}>{item.status || 'PENDING'}</ThemedText>
        </View>
        <ThemedText>Method: {item.method}</ThemedText>
        <ThemedText>Date: {paidAt}</ThemedText>
        <ThemedText>Salary Record: {item.salaryRecordId}</ThemedText>
        {item.transactionId ? <ThemedText>Txn: {item.transactionId}</ThemedText> : null}
        {item.remarks ? <ThemedText>Remarks: {item.remarks}</ThemedText> : null}
      </View>
    );
  };

  const listHeader = (
    <View style={styles.headerGap}>
      <ThemedText style={styles.heading}>My Salary</ThemedText>
      <ThemedText style={styles.helper}>
        Review your monthly salary summary and page through your salary payment history.
      </ThemedText>

      {/* <ThemedView style={styles.card}>
        {/* <ThemedText style={styles.subheading}>Month and Year</ThemedText>
        <View style={styles.field}>
          <ThemedText style={styles.label}>Month</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={month}
              onValueChange={(value) => {
                const nextMonth = Number(value);
                if (!isValidMonth(nextMonth)) {
                  Alert.alert('Validation', 'Please select a valid month.');
                  return;
                }
                setMonth(nextMonth);
              }}
            >
              {monthOptions.map((entry) => (
                <Picker.Item key={entry.value} label={entry.label} value={entry.value} />
              ))}
            </Picker>
          </View>
        </View> */}

        {/* <View style={styles.field}>
          <ThemedText style={styles.label}>Year</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={year}
              onValueChange={(value) => {
                const nextYear = Number(value);
                if (!isValidYear(nextYear)) {
                  Alert.alert('Validation', 'Please select a valid year.');
                  return;
                }
                setYear(nextYear);
              }}
            >
              {years.map((entry) => (
                <Picker.Item key={entry} label={String(entry)} value={entry} />
              ))}
            </Picker>
          </View>
        </View> */}

        {/* <Pressable style={[styles.button, styles.primary]} onPress={() => void loadSalarySummary(month, year)}>
          <ThemedText style={styles.buttonText}>{summaryLoading ? 'Loading...' : 'Load Salary Summary'}</ThemedText>
        </Pressable>
      </ThemedView> */}
{/* 
      <ThemedView style={styles.card}>
        <View style={styles.summaryHeader}>
          <ThemedText style={styles.subheading}>Selected Salary Cycle</ThemedText>
          {(summaryLoading || initialLoading) ? <ThemedText style={styles.historyLoading}>Loading...</ThemedText> : null}
        </View>
        <ThemedText>Month: {selectedMonthLabel}</ThemedText>
        <ThemedText>Year: {year}</ThemedText>
        {record ? (
          <View style={styles.summaryBox}>
            <ThemedText>Expected Amount: {formatMoney(currentExpectedAmount)}</ThemedText>
            <ThemedText>Status: {record.status}</ThemedText>
            <ThemedText>Base Salary: {formatMoney(record.baseSalary)}</ThemedText>
            <ThemedText>Total Earnings: {formatMoney(record.totalEarnings)}</ThemedText>
            <ThemedText>Total Deductions: {formatMoney(record.totalDeductions)}</ThemedText>
            <ThemedText>Net Salary: {formatMoney(record.netSalary)}</ThemedText>
            <ThemedText>Paid Amount: {formatMoney(record.paidAmount)}</ThemedText>
            <ThemedText>Due Amount: {formatMoney(currentDueAmount)}</ThemedText>
            <ThemedText>Payments Count: {currentPaymentCount}</ThemedText>
          </View>
        ) : (
          <ThemedText>No salary record found for the selected month and year.</ThemedText>
        )}

        {summaryPayments.length > 0 ? (
          <View style={styles.inlineList}>
            <ThemedText style={styles.inlineLabel}>Payments in this cycle</ThemedText>
            {summaryPayments.map((payment) => (
              <View key={payment._id} style={styles.item}>
                <ThemedText style={styles.itemTitle}>Amount: {formatMoney(payment.amount)}</ThemedText>
                <ThemedText>Method: {payment.method}</ThemedText>
                <ThemedText>Status: {payment.status || '-'}</ThemedText>
                <ThemedText>Date: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </ThemedView> */}

      <ThemedView style={styles.card}>
        <View style={styles.historyHeader}>
          <View>
            <ThemedText style={styles.subheading}>Salary Payment History</ThemedText>
            <ThemedText style={styles.historyMeta}>
              Page {historyPagination.page} of {historyPagination.totalPages} · {historyPagination.totalRecords} records
            </ThemedText>
          </View>
          {historyLoading ? <ActivityIndicator size="small" color="#2563EB" /> : null}
        </View>

        <View style={styles.paginationRow}>
          <Pressable
            style={[styles.pagerButton, !historyPagination.hasPrevPage || historyLoading ? styles.disabledButton : styles.secondary]}
            onPress={() => void handlePreviousPage()}
            disabled={!historyPagination.hasPrevPage || historyLoading}
          >
            <ThemedText style={styles.pagerButtonText}>Previous</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.pagerButton, !historyPagination.hasNextPage || historyLoading ? styles.disabledButton : styles.secondary]}
            onPress={() => void handleNextPage()}
            disabled={!historyPagination.hasNextPage || historyLoading}
          >
            <ThemedText style={styles.pagerButtonText}>Next</ThemedText>
          </Pressable>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Page Size</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={historyLimit}
              onValueChange={(value) => {
                const nextLimit = Number(value);
                void handleLimitChange(nextLimit);
              }}
            >
              {historyLimitOptions.map((entry) => (
                <Picker.Item key={entry} label={String(entry)} value={entry} />
              ))}
            </Picker>
          </View>
        </View>
      </ThemedView>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={historyRecords}
        keyExtractor={(item) => item._id}
        renderItem={renderPaymentItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <ThemedView style={styles.card}>
            <ThemedText>
              {historyLoading ? 'Loading history...' : 'No salary payments found for this staff member.'}
            </ThemedText>
          </ThemedView>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {historyLoading ? <ThemedText style={styles.historyLoading}>Fetching history...</ThemedText> : null}
            <Pressable style={[styles.button, styles.primary]} onPress={() => void refreshAll()}>
              <ThemedText style={styles.buttonText}>{initialLoading ? 'Refreshing...' : 'Refresh All'}</ThemedText>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  headerGap: { gap: 12 },
  heading: { fontSize: 22, fontWeight: '700' },
  helper: { fontSize: 13, lineHeight: 18, color: '#6b7280', marginTop: -4 },
  subheading: { fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, elevation: 3 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  pickerWrap: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, overflow: 'hidden' },
  button: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginTop: 4 },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' },
  disabledButton: { backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' },
  buttonText: { color: '#fff', fontWeight: '700' },
  pagerButtonText: { color: '#1e3a8a', fontWeight: '700' },
  item: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { fontWeight: '700' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  historyLoading: { fontSize: 12, color: '#6b7280', fontWeight: '700' },
  historyItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  historyTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  historyStatus: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  summaryBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4, backgroundColor: '#f8fafc' },
  inlineList: { gap: 8 },
  inlineLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  historyMeta: { fontSize: 12, color: '#6b7280' },
  paginationRow: { flexDirection: 'row', gap: 10 },
  pagerButton: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  footer: { gap: 10, paddingTop: 4 },
});
