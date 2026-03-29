import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { isValidEmail, isValidPassword } from '@/src/utils/helpers';
import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { LoginCredentials } from '@/src/types';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [sendingForgot, setSendingForgot] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginCredentials) => {
    try {
      await login(values);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login. Please try again.';
      Alert.alert('Login Failed', message);
    }
  };

  const onForgotPassword = async () => {
    if (!isValidEmail(forgotEmail)) {
      Alert.alert('Validation', 'Please enter a valid email');
      return;
    }

    try {
      setSendingForgot(true);
      const response = await apiService.forgotPassword(forgotEmail.trim());
      if (!response.success) {
        throw new Error(response.msg || 'Failed to send reset email');
      }
      Alert.alert('Success', 'Password reset link sent to your email');
      setForgotEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', message);
    } finally {
      setSendingForgot(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>School MIS</Text>
        <Text style={styles.subtitle}>Management System</Text>

        <View style={styles.switchBar}>
          <TouchableOpacity style={[styles.switchItem, styles.switchItemActive]} disabled>
            <Text style={[styles.switchText, styles.switchTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchItem} onPress={() => router.push('/school-register')}>
            <Text style={styles.switchText}>Add School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchItem} onPress={() => router.push('/school-login')}>
            <Text style={styles.switchText}>School Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              validate: (value) => isValidEmail(value) || 'Please enter a valid email address',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                editable={!isLoading}
                autoCapitalize="none"
              />
            )}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              validate: (value) => isValidPassword(value) || 'Password must be at least 6 characters',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                editable={!isLoading}
              />
            )}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.forgotWrap}>
            <TextInput
              style={styles.input}
              placeholder="Forgot password? Enter your email"
              placeholderTextColor="#999"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!sendingForgot && !isLoading}
            />
            <TouchableOpacity
              style={[styles.forgotButton, (sendingForgot || isLoading) && styles.buttonDisabled]}
              onPress={onForgotPassword}
              disabled={sendingForgot || isLoading}>
              {sendingForgot ? <ActivityIndicator color="#1976d2" /> : <Text style={styles.forgotButtonText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Need an account? Contact your admin.</Text>
        </View>
      </View>
    </View>
  );
};

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
    marginBottom: 24,
  },
  form: {
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
  inputError: {
    borderColor: '#d93025',
  },
  errorText: {
    color: '#d93025',
    fontSize: 12,
    marginBottom: 8,
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
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
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

export default LoginScreen;
