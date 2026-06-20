// import { useEffect, useState } from 'react';
// import { Alert, ScrollView, StyleSheet, View } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { useRouter } from 'expo-router';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { useAuthStore } from '@/src/store/auth.store';
// import { FeePayment, FeeRecord } from '@/src/types';
// import { formatMoney, monthOptions, yearOptions } from '@/src/utils/finance';

// export default function MyFeeScreen() {
//   const router = useRouter();
//   const user = useAuthStore((state) => state.user);
//   const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
//   const studentId = user?._id || '';
//   const years = yearOptions();

//   const [month, setMonth] = useState(monthOptions[new Date().getMonth()].value);
//   const [year, setYear] = useState(years[0] || new Date().getFullYear());

//   const [record, setRecord] = useState<FeeRecord | null>(null);
//   const [history, setHistory] = useState<FeePayment[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (role !== 'student') {
//       router.replace('/(tabs)');
//       return;
//     }
//     void loadMyFee();
//   }, [role, router, month, year, studentId]);

//   const loadMyFee = async () => {
//     try {
//       setLoading(true);
//       const recordResult = await apiService.getStudentFeeByMonth({ studentId, month, year });
//       if (!recordResult.success || !recordResult.data) {
//         setRecord(null);
//         setHistory([]);
//         return;
//       }

//       setRecord(recordResult.data);

//       const historyResult = await apiService.getStudentFeePaymentHistory({ studentId, page: 1, limit: 50 });
//       if (historyResult.success) {
//         const list = Array.isArray(historyResult.data?.records) ? historyResult.data.records : [];
//         setHistory(list.filter((entry) => entry.feeRecordId === recordResult.data?._id));
//       } else {
//         setHistory([]);
//       }
//     } catch (error) {
//       setRecord(null);
//       setHistory([]);
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load fee details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <ThemedText style={styles.heading}>My Fee</ThemedText>

//       <ThemedView style={styles.card}>
//         <ThemedText style={styles.subheading}>Filter</ThemedText>

//         <View style={styles.field}>
//           <ThemedText style={styles.label}>Month</ThemedText>
//           <View style={styles.pickerWrap}>
//             <Picker selectedValue={month} onValueChange={(v) => setMonth(v)}>
//               {monthOptions.map((item) => (
//                 <Picker.Item key={item.value} label={item.label} value={item.value} />
//               ))}
//             </Picker>
//           </View>
//         </View>

//         <View style={styles.field}>
//           <ThemedText style={styles.label}>Year</ThemedText>
//           <View style={styles.pickerWrap}>
//             <Picker selectedValue={year} onValueChange={(v) => setYear(Number(v))}>
//               {years.map((item) => (
//                 <Picker.Item key={item} label={String(item)} value={item} />
//               ))}
//             </Picker>
//           </View>
//         </View>
//       </ThemedView>

//       <ThemedView style={styles.card}>
//         <ThemedText style={styles.subheading}>Fee Details</ThemedText>
//         {loading ? <ThemedText>Loading...</ThemedText> : null}
//         {!loading && !record ? <ThemedText>No fee record found for selected month/year.</ThemedText> : null}

//         {record ? (
//           <View style={styles.summary}>
//             <ThemedText>Total Fee: {formatMoney(record.totalFee)}</ThemedText>
//             <ThemedText>Paid Amount: {formatMoney(record.paidAmount)}</ThemedText>
//             <ThemedText>Due Amount: {formatMoney(record.dueAmount)}</ThemedText>
//             <ThemedText>Status: {record.status}</ThemedText>
//             <ThemedText>Due Date: {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}</ThemedText>
//           </View>
//         ) : null}
//       </ThemedView>

//       <ThemedView style={styles.card}>
//         <ThemedText style={styles.subheading}>Payment History</ThemedText>
//         {!loading && history.length === 0 ? <ThemedText>No payments recorded for this fee cycle.</ThemedText> : null}
//         {history.map((entry) => (
//           <View key={entry._id} style={styles.item}>
//             <ThemedText style={styles.itemTitle}>Amount: {formatMoney(entry.amount)}</ThemedText>
//             <ThemedText>Late Fee: {formatMoney(entry.lateFee || 0)}</ThemedText>
//             <ThemedText>Method: {entry.method}</ThemedText>
//             <ThemedText>Status: {entry.status || '-'}</ThemedText>
//             <ThemedText>Date: {entry.paidAt ? new Date(entry.paidAt).toLocaleString() : 'N/A'}</ThemedText>
//           </View>
//         ))}
//       </ThemedView>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   content: { padding: 16, gap: 12, paddingBottom: 40 },
//   heading: { fontSize: 22, fontWeight: '700' },
//   card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8, elevation: 3 },
//   subheading: { fontSize: 16, fontWeight: '700' },
//   field: { gap: 6 },
//   label: { fontSize: 12, fontWeight: '700' },
//   pickerWrap: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, overflow: 'hidden' },
//   summary: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4, backgroundColor: '#f8fafc' },
//   item: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
//   itemTitle: { fontWeight: '700' },
// });

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { FeePayment, FeeRecord } from '@/src/types';
import { formatMoney, monthOptions, yearOptions } from '@/src/utils/finance';

// --- ERP BRANDING PALETTE ---
const PALETTE = {
  primary: '#303841',
  accent: '#76ABAE',
  cta: '#FF5722',
  background: '#F5F5F5',
  border: '#E6E6E6',
  surface: '#FFFFFF',
  textBody: '#5D646B',
  textHeading: '#303841',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F9A825',
};

// Helper for status colors
const getStatusStyles = (status: string | undefined) => {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'success') {
    return { bg: 'rgba(46, 125, 50, 0.1)', text: PALETTE.success, border: 'rgba(46, 125, 50, 0.3)' };
  }
  if (s === 'pending' || s === 'partial') {
    return { bg: 'rgba(249, 168, 37, 0.1)', text: PALETTE.warning, border: 'rgba(249, 168, 37, 0.3)' };
  }
  if (s === 'due' || s === 'unpaid' || s === 'failed') {
    return { bg: 'rgba(211, 47, 47, 0.1)', text: PALETTE.error, border: 'rgba(211, 47, 47, 0.3)' };
  }
  return { bg: PALETTE.background, text: PALETTE.textBody, border: PALETTE.border };
};

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

  const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Fee</Text>
        <Text style={styles.subText}>View your fee statements and payment history.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subheading}>Filter Cycle</Text>

        <View style={styles.filterRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Month</Text>
            <View style={styles.pickerWrap}>
              <Picker 
                selectedValue={month} 
                onValueChange={(v) => setMonth(v)}
                style={styles.picker}
              >
                {monthOptions.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Year</Text>
            <View style={styles.pickerWrap}>
              <Picker 
                selectedValue={year} 
                onValueChange={(v) => setYear(Number(v))}
                style={styles.picker}
              >
                {years.map((item) => (
                  <Picker.Item key={item} label={String(item)} value={item} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.subheading}>Fee Statement</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PALETTE.accent} />
          </View>
        ) : !record ? (
          <Text style={styles.emptyText}>No fee record found for the selected cycle.</Text>
        ) : (
          <View style={styles.summaryBox}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Monthly Dues</Text>
              <View style={[styles.badge, { backgroundColor: getStatusStyles(record.status).bg, borderColor: getStatusStyles(record.status).border }]}>
                <Text style={[styles.badgeText, { color: getStatusStyles(record.status).text }]}>
                  {(record.status || 'Unknown').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <InfoRow label="Total Fee" value={formatMoney(record.totalFee)} />
            <InfoRow label="Paid Amount" value={formatMoney(record.paidAmount)} />
            <InfoRow label="Due Amount" value={formatMoney(record.dueAmount)} />
            <InfoRow label="Due Date" value={record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'} />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.subheading}>Payment History</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PALETTE.accent} />
          </View>
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded for this fee cycle.</Text>
        ) : (
          <View style={styles.historyList}>
            {history.map((entry) => {
              const statusStyle = getStatusStyles(entry.status);
              return (
                <View key={entry._id} style={styles.historyItem}>
                  <View style={styles.historyTopRow}>
                    <Text style={styles.historyAmount}>{formatMoney(entry.amount)}</Text>
                    <View style={[styles.badge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                        {(entry.status || '-').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyDetail}>Method: <Text style={styles.historyDetailValue}>{entry.method}</Text></Text>
                  <Text style={styles.historyDetail}>Late Fee: <Text style={styles.historyDetailValue}>{formatMoney(entry.lateFee || 0)}</Text></Text>
                  <Text style={styles.historyDetail}>Date: <Text style={styles.historyDetailValue}>{entry.paidAt ? new Date(entry.paidAt).toLocaleString() : 'N/A'}</Text></Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  content: { 
    padding: 16, 
    gap: 16, 
    paddingBottom: 50,
  },
  header: {
    marginBottom: 4,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: '800',
    color: PALETTE.textHeading,
  },
  subText: {
    fontSize: 14,
    color: PALETTE.textBody,
    marginTop: 4,
  },
  
  /* CARDS */
  card: { 
    backgroundColor: PALETTE.surface, 
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4, 
    padding: 16, 
    gap: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  subheading: { 
    fontSize: 16, 
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.textBody,
    textAlign: 'center',
    paddingVertical: 12,
  },

  /* FILTERS */
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: { 
    flex: 1,
    gap: 6, 
  },
  label: { 
    fontSize: 12, 
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  pickerWrap: { 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 4, 
    backgroundColor: PALETTE.background,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: PALETTE.textHeading,
  },

  /* SUMMARY BOX */
  summaryBox: { 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 4, 
    padding: 16, 
    gap: 8, 
    backgroundColor: PALETTE.background,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: PALETTE.textBody,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },

  /* BADGES */
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* HISTORY LIST */
  historyList: {
    gap: 12,
  },
  historyItem: { 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 4, 
    padding: 16, 
    gap: 6,
    backgroundColor: PALETTE.background,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textHeading,
  },
  historyDetail: {
    fontSize: 13,
    color: PALETTE.textBody,
  },
  historyDetailValue: {
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
});