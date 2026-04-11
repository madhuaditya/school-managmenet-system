import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import { SalaryStructure } from '@/src/types';
import { formatMoney, toMoney } from '@/src/utils/finance';

const ROLE_OPTIONS: Array<SalaryStructure['role']> = ['TEACHER', 'ACCOUNTANT', 'DRIVER', 'ADMIN', 'OTHER'];

const defaultForm = {
  role: 'TEACHER' as SalaryStructure['role'],
  basic: '0',
  hra: '0',
  da: '0',
  bonus: '0',
  pf: '0',
  tax: '0',
  other: '0',
};

export default function SalaryStructureScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [records, setRecords] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    void loadData();
  }, [role, router]);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getAllSalaryStructures();
      if (!result.success) throw new Error(result.msg || 'Failed to load salary structures');
      setRecords(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const numericValues = [form.basic, form.hra, form.da, form.bonus, form.pf, form.tax, form.other].map(Number);
    const hasInvalid = numericValues.some((item) => !Number.isFinite(item) || item < 0);
    if (hasInvalid) {
      Alert.alert('Validation', 'All amount fields must be valid non-negative numbers.');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const submit = async () => {
    if (!validate()) return;

    const payload = {
      role: form.role,
      components: {
        basic: toMoney(form.basic),
        hra: toMoney(form.hra),
        da: toMoney(form.da),
        bonus: toMoney(form.bonus),
      },
      deductions: {
        pf: toMoney(form.pf),
        tax: toMoney(form.tax),
        other: toMoney(form.other),
      },
    };

    try {
      setSaving(true);
      const result = editingId
        ? await apiService.updateSalaryStructure(editingId, payload)
        : await apiService.createSalaryStructure(payload);

      if (!result.success) throw new Error(result.msg || 'Failed to save salary structure');

      Alert.alert('Success', result.msg || 'Salary structure saved.');
      resetForm();
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: SalaryStructure) => {
    setEditingId(entry._id);
    setForm({
      role: entry.role,
      basic: String(entry.components?.basic ?? 0),
      hra: String(entry.components?.hra ?? 0),
      da: String(entry.components?.da ?? 0),
      bonus: String(entry.components?.bonus ?? 0),
      pf: String(entry.deductions?.pf ?? 0),
      tax: String(entry.deductions?.tax ?? 0),
      other: String(entry.deductions?.other ?? 0),
    });
  };

  const remove = async (id: string) => {
    Alert.alert('Confirm', 'Delete this salary structure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const result = await apiService.deleteSalaryStructure(id);
            if (!result.success) throw new Error(result.msg || 'Failed to delete salary structure');
            if (editingId === id) resetForm();
            await loadData();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete salary structure');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const renderMoneyInput = (label: string, key: keyof typeof defaultForm) => (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        value={String(form[key])}
        onChangeText={(text) => setForm((prev) => ({ ...prev, [key]: text }))}
        style={styles.input}
        keyboardType="numeric"
        editable={!saving}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.heading}>Salary Structure (Admin)</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>{isEditing ? 'Update Structure' : 'Create Structure'}</ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Role</ThemedText>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={form.role}
              onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as SalaryStructure['role'] }))}
              enabled={!saving}
            >
              {ROLE_OPTIONS.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        {renderMoneyInput('Basic', 'basic')}
        {renderMoneyInput('HRA', 'hra')}
        {renderMoneyInput('DA', 'da')}
        {renderMoneyInput('Bonus', 'bonus')}
        {renderMoneyInput('PF', 'pf')}
        {renderMoneyInput('Tax', 'tax')}
        {renderMoneyInput('Other Deduction', 'other')}

        <View style={styles.row}>
          <Pressable style={[styles.button, styles.primary]} disabled={saving} onPress={submit}>
            <ThemedText style={styles.buttonText}>{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</ThemedText>
          </Pressable>
          {isEditing ? (
            <Pressable style={[styles.button, styles.secondary]} disabled={saving} onPress={resetForm}>
              <ThemedText style={styles.secondaryText}>Cancel</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={styles.subheading}>Existing Structures</ThemedText>
        {loading ? <ThemedText>Loading...</ThemedText> : null}
        {records.map((entry) => {
          const earnings =
            Number(entry.components?.basic || 0) +
            Number(entry.components?.hra || 0) +
            Number(entry.components?.da || 0) +
            Number(entry.components?.bonus || 0);
          const deductions =
            Number(entry.deductions?.pf || 0) + Number(entry.deductions?.tax || 0) + Number(entry.deductions?.other || 0);
          return (
            <View key={entry._id} style={styles.listItem}>
              <ThemedText style={styles.itemTitle}>{entry.role}</ThemedText>
              <ThemedText>Earnings: {formatMoney(earnings)} | Deductions: {formatMoney(deductions)}</ThemedText>
              <ThemedText>Net: {formatMoney(earnings - deductions)}</ThemedText>
              <View style={styles.row}>
                <Pressable style={[styles.smallButton, styles.primary]} onPress={() => startEdit(entry)}>
                  <ThemedText style={styles.buttonText}>Edit</ThemedText>
                </Pressable>
                <Pressable style={[styles.smallButton, styles.danger]} onPress={() => remove(entry._id)}>
                  <ThemedText style={styles.buttonText}>Delete</ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700' },
  subheading: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 12, padding: 12, gap: 8, backgroundColor: '#fff', elevation: 3 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  pickerWrap: { borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  smallButton: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#e2e8f0' },
  danger: { backgroundColor: '#DC2626' },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryText: { color: '#0f172a', fontWeight: '700' },
  listItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, gap: 4 },
  itemTitle: { fontWeight: '700' },
});
