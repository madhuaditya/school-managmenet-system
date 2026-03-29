import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';

export default function SchoolLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingForgot, setSendingForgot] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation', 'Email and password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.loginSchool(email.trim(), password);
      if (!response.success || !response.data?.token || !response.data?.school?._id) {
        throw new Error(response.msg || 'School login failed');
      }

      router.replace({
        pathname: '/school-admin-setup',
        params: {
          token: response.data.token,
          schoolId: response.data.school._id,
          schoolName: response.data.school.schoolName || '',
        },
      });
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'School login failed');
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      Alert.alert('Validation', 'Please enter a valid school email');
      return;
    }

    try {
      setSendingForgot(true);
      const response = await apiService.forgotSchoolPassword(forgotEmail.trim());
      if (!response.success) {
        throw new Error(response.msg || 'Failed to send school reset email');
      }
      Alert.alert('Success', 'Password reset link sent to school email');
      setForgotEmail('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send school reset email');
    } finally {
      setSendingForgot(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>School MIS</Text>
        <Text style={styles.subtitle}>School Login</Text>

        <View style={styles.switchBar}>
          <TouchableOpacity style={styles.switchItem} onPress={() => router.replace('/')}>
            <Text style={styles.switchText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchItem} onPress={() => router.replace('/school-register')}>
            <Text style={styles.switchText}>Add School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.switchItem, styles.switchItemActive]} disabled>
            <Text style={[styles.switchText, styles.switchTextActive]}>School Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="School Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onLogin}
            disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>School Login</Text>}
          </TouchableOpacity>

          <View style={styles.forgotWrap}>
            <TextInput
              style={styles.input}
              placeholder="Forgot password? Enter school email"
              placeholderTextColor="#999"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!sendingForgot && !loading}
            />
            <TouchableOpacity
              style={[styles.forgotButton, (sendingForgot || loading) && styles.buttonDisabled]}
              onPress={onForgotPassword}
              disabled={sendingForgot || loading}>
              {sendingForgot ? <ActivityIndicator color="#1976d2" /> : <Text style={styles.forgotButtonText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
  },
  switchBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  switchItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  switchItemActive: {
    backgroundColor: '#1976d2',
  },
  switchText: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 12,
  },
  switchTextActive: {
    color: '#fff',
  },
  form: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotWrap: {
    marginTop: 12,
  },
  forgotButton: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotButtonText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '700',
  },
});
