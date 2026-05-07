import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

export default function LeaveApplyTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const userId = user?._id || '';

  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canApply = useMemo(() => ['admin', 'teacher', 'student', 'staff'].includes(role || ''), [role]);

  const submitLeave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User context is missing. Please login again.');
      return;
    }

    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Validation', 'Start date, end date and reason are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('Validation', 'End date must be on or after start date.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.applyLeave({
        userId,
        startDate,
        endDate,
        reason: reason.trim(),
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to apply leave.');
      }

      setReason('');
      Alert.alert('Success', 'Leave request submitted.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to apply leave.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canApply) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Access denied. Your role cannot apply leave.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">Apply Leave</ThemedText>
        <ThemedText style={styles.hint}>Use YYYY-MM-DD format for dates.</ThemedText>

        <ThemedText style={styles.label}>Start Date</ThemedText>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          editable={!submitting}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
          placeholder="2026-04-21"
          placeholderTextColor={theme.icon}
        />

        <ThemedText style={styles.label}>End Date</ThemedText>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          editable={!submitting}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
          placeholder="2026-04-22"
          placeholderTextColor={theme.icon}
        />

        <ThemedText style={styles.label}>Reason</ThemedText>
        <TextInput
          value={reason}
          onChangeText={setReason}
          editable={!submitting}
          multiline
          style={[styles.input, styles.textArea, { borderColor: theme.icon, color: theme.text }]}
          placeholder="Write reason for leave"
          placeholderTextColor={theme.icon}
        />

        <Pressable style={[styles.submit, submitting && styles.disabled]} onPress={submitLeave} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitText}>Submit Leave</ThemedText>}
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  hint: { opacity: 0.7, fontSize: 12 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: 8,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
