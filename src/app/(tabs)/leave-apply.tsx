// import { useMemo, useState } from 'react';
// import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';

// const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

// export default function LeaveApplyTab() {
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const user = useAuthStore((state) => state.user);
//   const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
//   const userId = user?._id || '';

//   const [startDate, setStartDate] = useState(toDateInput(new Date()));
//   const [endDate, setEndDate] = useState(toDateInput(new Date()));
//   const [reason, setReason] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   const canApply = useMemo(() => ['admin', 'teacher', 'student', 'staff'].includes(role || ''), [role]);

//   const submitLeave = async () => {
//     if (!userId) {
//       Alert.alert('Error', 'User context is missing. Please login again.');
//       return;
//     }

//     if (!startDate || !endDate || !reason.trim()) {
//       Alert.alert('Validation', 'Start date, end date and reason are required.');
//       return;
//     }

//     if (new Date(startDate) > new Date(endDate)) {
//       Alert.alert('Validation', 'End date must be on or after start date.');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       const response = await apiService.applyLeave({
//         userId,
//         startDate,
//         endDate,
//         reason: reason.trim(),
//       });

//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to apply leave.');
//       }

//       setReason('');
//       Alert.alert('Success', 'Leave request submitted.');
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to apply leave.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!canApply) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ThemedText>Access denied. Your role cannot apply leave.</ThemedText>
//       </ThemedView>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//         <ThemedText type="subtitle">Apply Leave</ThemedText>
//         <ThemedText style={styles.hint}>Use YYYY-MM-DD format for dates.</ThemedText>

//         <ThemedText style={styles.label}>Start Date</ThemedText>
//         <TextInput
//           value={startDate}
//           onChangeText={setStartDate}
//           editable={!submitting}
//           style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="2026-04-21"
//           placeholderTextColor={theme.icon}
//         />

//         <ThemedText style={styles.label}>End Date</ThemedText>
//         <TextInput
//           value={endDate}
//           onChangeText={setEndDate}
//           editable={!submitting}
//           style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="2026-04-22"
//           placeholderTextColor={theme.icon}
//         />

//         <ThemedText style={styles.label}>Reason</ThemedText>
//         <TextInput
//           value={reason}
//           onChangeText={setReason}
//           editable={!submitting}
//           multiline
//           style={[styles.input, styles.textArea, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="Write reason for leave"
//           placeholderTextColor={theme.icon}
//         />

//         <Pressable style={[styles.submit, submitting && styles.disabled]} onPress={submitLeave} disabled={submitting}>
//           {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitText}>Submit Leave</ThemedText>}
//         </Pressable>
//       </ThemedView>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   content: { padding: 16, paddingBottom: 40 },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//   card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
//   hint: { opacity: 0.7, fontSize: 12 },
//   label: { fontSize: 13, fontWeight: '600', marginTop: 4 },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     minHeight: 42,
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//   },
//   textArea: {
//     minHeight: 110,
//     textAlignVertical: 'top',
//   },
//   submit: {
//     marginTop: 8,
//     height: 42,
//     borderRadius: 8,
//     backgroundColor: '#2563EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   submitText: { color: '#fff', fontWeight: '700' },
//   disabled: { opacity: 0.65 },
// });

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';

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

const LEAVE_TYPES = [
  { label: 'Select Leave Type', value: '' },
  { label: 'Sick Leave', value: 'sick' },
  { label: 'Casual Leave', value: 'casual' },
  { label: 'Earned Leave', value: 'earned' },
  { label: 'Unpaid Leave', value: 'maternity' },
  { label: 'Maternity Leave', value: 'maternity' },
  { label: 'Paternity Leave', value: 'paternity' },
  { label: 'Other Leave', value: 'other' },
];

// Helper to format date nicely
const formatDate = (date: Date | null) => {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
};

export default function LeaveApplyTab() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const userId = user?._id || '';

  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [purpose, setPurpose] = useState('');
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canApply = useMemo(() => ['admin', 'teacher', 'student', 'staff'].includes(role || ''), [role]);

  // Calculate Total Days
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 'Invalid dates';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return String(diffDays);
  }, [startDate, endDate]);

  const onStartChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios'); // iOS picker stays open
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate && selectedDate > endDate) {
        setEndDate(null); // Reset end date if it becomes invalid
      }
    }
  };

  const onEndChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const resetForm = () => {
    setLeaveType('');
    setStartDate(null);
    setEndDate(null);
    setPurpose('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError('User context is missing. Please login again.');
      return;
    }

    if (!leaveType) {
      setError('Please select a Leave Type.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Start date and End date are required.');
      return;
    }

    if (startDate > endDate) {
      setError('End date must be on or after start date.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.applyLeave({
        userId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        leaveType: leaveType,
        reason: purpose.trim(), // Assuming backend still expects "reason" key
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to apply leave.');
      }

      setSuccess('Leave request submitted successfully.');
      setTimeout(() => resetForm(), 2000); // Clear after success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply leave.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canApply) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Access denied. Your role cannot apply for leave.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Header Section */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.pageTitle}>Apply Leave</Text>
          <Text style={styles.pageSubtitle}>Create a leave request for admin approval.</Text>
        </View>
        <Pressable 
          onPress={() => router.push('/my-leaves')}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressedOpacity]}
        >
          <Text style={styles.headerButtonText}>View My Leaves</Text>
        </Pressable>
      </View>

      {/* Banners */}
      {error ? (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerErrorText}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Text style={styles.bannerSuccessText}>{success}</Text>
        </View>
      ) : null}

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Leave Application</Text>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={[styles.pickerWrap, submitting && styles.disabledInput]}>
              <Picker
                selectedValue={leaveType}
                onValueChange={(itemValue) => setLeaveType(itemValue)}
                enabled={!submitting}
                style={styles.picker}
              >
                {LEAVE_TYPES.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>Total Days</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{totalDays || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <Pressable 
              onPress={() => !submitting && setShowStartPicker(true)}
              style={[styles.input, submitting && styles.disabledInput]}
            >
              <Text style={startDate ? styles.inputText : styles.placeholderText}>
                {startDate ? formatDate(startDate) : 'Select Start Date'}
              </Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={onStartChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>End Date</Text>
            <Pressable 
              onPress={() => !submitting && setShowEndPicker(true)}
              style={[styles.input, submitting && styles.disabledInput]}
            >
              <Text style={endDate ? styles.inputText : styles.placeholderText}>
                {endDate ? formatDate(endDate) : 'Select End Date'}
              </Text>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || startDate || new Date()}
                mode="date"
                display="default"
                minimumDate={startDate || new Date()}
                onChange={onEndChange}
              />
            )}
          </View>
        </View>

        <View style={styles.fieldGap}>
          <Text style={styles.inputLabel}>Purpose (optional)</Text>
          <TextInput
            value={purpose}
            onChangeText={setPurpose}
            editable={!submitting}
            maxLength={1000}
            multiline
            style={[styles.input, styles.textArea, submitting && styles.disabledInput]}
            placeholder="Write reason/purpose for leave"
            placeholderTextColor={PALETTE.textBody}
          />
          <Text style={styles.charCount}>{purpose.length}/1000</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable 
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressedOpacity]} 
            onPress={resetForm} 
            disabled={submitting}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.submitButton, (submitting || pressed) && styles.pressedOpacity]} 
            onPress={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={PALETTE.surface} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Leave</Text>
            )}
          </Pressable>
        </View>
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
    paddingBottom: 40,
    gap: 16,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24,
    backgroundColor: PALETTE.background,
  },
  pressedOpacity: { 
    opacity: 0.7 
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 200,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textHeading,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.textBody,
    marginTop: 4,
  },
  headerButton: {
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)', // Soft blue border
    backgroundColor: 'rgba(37, 99, 235, 0.05)', // Soft blue bg
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  headerButtonText: {
    color: '#2563EB', // Blue link color
    fontWeight: '700',
    fontSize: 13,
  },

  /* BANNERS */
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  bannerError: {
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
    borderColor: 'rgba(211, 47, 47, 0.2)',
  },
  bannerErrorText: {
    color: PALETTE.error,
    fontSize: 13,
    fontWeight: '600',
  },
  bannerSuccess: {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  bannerSuccessText: {
    color: PALETTE.success,
    fontSize: 13,
    fontWeight: '600',
  },

  /* CARD & FORM */
  card: { 
    borderWidth: 1, 
    borderRadius: 4, 
    padding: 20, 
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formCol: {
    flex: 1,
    gap: 6,
  },
  fieldGap: {
    gap: 6,
    marginBottom: 16,
  },
  inputLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: PALETTE.textHeading,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    color: PALETTE.textHeading,
    fontSize: 14,
  },
  inputText: {
    color: PALETTE.textHeading,
    fontSize: 14,
  },
  placeholderText: {
    color: PALETTE.textBody,
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: PALETTE.background,
    opacity: 0.7,
  },
  readOnlyInput: {
    backgroundColor: PALETTE.background,
    borderColor: PALETTE.border,
  },
  readOnlyText: {
    color: PALETTE.textBody,
    fontSize: 14,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 4,
    height: 44,
    justifyContent: 'center',
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: PALETTE.textHeading,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  charCount: {
    fontSize: 11,
    color: PALETTE.textBody,
    textAlign: 'right',
  },

  /* ACTIONS */
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: PALETTE.textHeading,
    fontWeight: '700',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#2563EB', // Used the exact blue from the web snippet
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  submitButtonText: { 
    color: PALETTE.surface, 
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: PALETTE.error,
    fontWeight: '600',
    fontSize: 14,
  },
});