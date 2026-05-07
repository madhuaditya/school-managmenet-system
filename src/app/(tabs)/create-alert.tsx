import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

export default function CreateAlertTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = useMemo(() => role === 'admin', [role]);

  const submit = async () => {
    if (!message.trim()) {
      Alert.alert('Validation', 'Message is required.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createAlert({
        userId: userId.trim() || undefined,
        title: title.trim() || undefined,
        message: message.trim(),
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to create alert.');
      }

      setUserId('');
      setTitle('');
      setMessage('');
      Alert.alert('Success', 'Alert created successfully.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create alert.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Access denied. Admin role is required.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">Create Alert</ThemedText>
        <ThemedText style={styles.hint}>Leave User ID empty to use backend default behavior.</ThemedText>

        <TextInput
          value={userId}
          onChangeText={setUserId}
          editable={!submitting}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
          placeholder="Target user ID (optional)"
          placeholderTextColor={theme.icon}
        />

        <TextInput
          value={title}
          onChangeText={setTitle}
          editable={!submitting}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
          placeholder="Title (optional)"
          placeholderTextColor={theme.icon}
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          editable={!submitting}
          multiline
          style={[styles.input, styles.textArea, { borderColor: theme.icon, color: theme.text }]}
          placeholder="Alert message"
          placeholderTextColor={theme.icon}
        />

        <Pressable style={[styles.submit, submitting && styles.disabled]} disabled={submitting} onPress={submit}>
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitText}>Send Alert</ThemedText>}
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
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
