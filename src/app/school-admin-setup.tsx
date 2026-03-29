import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { apiService } from '@/api/client';

interface AdminForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

const emptyForm: AdminForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
};

export default function SchoolAdminSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; schoolId?: string; schoolName?: string }>();
  const token = useMemo(() => (typeof params.token === 'string' ? params.token : ''), [params.token]);
  const schoolId = useMemo(() => (typeof params.schoolId === 'string' ? params.schoolId : ''), [params.schoolId]);
  const schoolName = useMemo(() => (typeof params.schoolName === 'string' ? params.schoolName : 'Your School'), [params.schoolName]);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<AdminForm>(emptyForm);

  const update = (key: keyof AdminForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!token || !schoolId) return 'Session expired. Please login again.';
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const createAdmin = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.registerAdminBySchool(token, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        school: schoolId,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pinCode: form.pinCode.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to create admin');
      }

      Alert.alert('Success', 'Admin created successfully.');
      router.replace('/school-login');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create School Admin</Text>
        <Text style={styles.subtitle}>{schoolName}</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Admin Name"
            placeholderTextColor="#999"
            value={form.name}
            onChangeText={(v) => update('name', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Admin Phone (optional)"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => update('phone', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => update('password', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Address (optional)"
            placeholderTextColor="#999"
            value={form.address}
            onChangeText={(v) => update('address', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="City (optional)"
            placeholderTextColor="#999"
            value={form.city}
            onChangeText={(v) => update('city', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="State (optional)"
            placeholderTextColor="#999"
            value={form.state}
            onChangeText={(v) => update('state', v)}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Pin Code (optional)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={form.pinCode}
            onChangeText={(v) => update('pinCode', v)}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={createAdmin}
            disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Admin</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: '#000',
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
