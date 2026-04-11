import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { isValidEmail, isValidPassword } from '@/src/utils/helpers';
import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { LoginCredentials } from '@/src/types';

const lightColors = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  primary: "#2563EB",
  text: "#111827",
  subText: "#6B7280",
  border: "#E5E7EB",
  error: "#DC2626",
};

const darkColors = {
  bg: "#0F172A",
  card: "#1E293B",
  primary: "#3B82F6",
  text: "#E5E7EB",
  subText: "#9CA3AF",
  border: "#334155",
  error: "#F87171",
};

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [forgotUsername, setForgotUsername] = React.useState('');
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [sendingForgot, setSendingForgot] = React.useState(false);

  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      username: '',
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
    if (!forgotUsername.trim() || !isValidEmail(forgotEmail)) {
      Alert.alert('Validation', 'Please enter a valid username and email');
      return;
    }

    try {
      setSendingForgot(true);
      const response = await apiService.forgotPassword({
        username: forgotUsername.trim(),
        email: forgotEmail.trim(),
      });
      if (!response.success) {
        throw new Error(response.msg || 'Failed to send reset email');
      }
      Alert.alert('Success', 'Password reset link sent to your email');
      setForgotUsername('');
      setForgotEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', message);
    } finally {
      setSendingForgot(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.primary }]}>School MIS</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Management System</Text>

        <View style={[styles.switchBar, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.switchItem, { backgroundColor: colors.primary }]} disabled>
            <Text style={[styles.switchTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchItem} onPress={() => router.push('/school-register')}>
            <Text style={[styles.switchText, { color: colors.primary }]}>Add School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchItem} onPress={() => router.push('/school-login')}>
            <Text style={[styles.switchText, { color: colors.primary }]}>School Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="username"
            rules={{
              required: 'Username is required',
              validate: (value) => value.trim().length >= 5 || 'Username must be at least 5 characters',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.username ? colors.error : colors.border,
                    color: colors.text,
                    backgroundColor: scheme === 'dark' ? '#020617' : '#fff',
                  },
                ]}
                placeholder="Username"
                placeholderTextColor={colors.subText}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isLoading}
                autoCapitalize="none"
              />
            )}
          />
          {errors.username && <Text style={[styles.errorText, { color: colors.error }]}>{errors.username.message}</Text>}

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              validate: (value) => isValidPassword(value) || 'Password must be at least 6 characters',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.password ? colors.error : colors.border,
                    color: colors.text,
                    backgroundColor: scheme === 'dark' ? '#020617' : '#fff',
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.subText}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                editable={!isLoading}
              />
            )}
          />
          {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password.message}</Text>}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.forgotWrap}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: scheme === 'dark' ? '#020617' : '#fff',
                },
              ]}
              placeholder="Forgot password? Enter your username"
              placeholderTextColor={colors.subText}
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize="none"
              editable={!sendingForgot && !isLoading}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: scheme === 'dark' ? '#020617' : '#fff',
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.subText}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!sendingForgot && !isLoading}
            />
            <TouchableOpacity
              style={[styles.forgotButton, (sendingForgot || isLoading) && styles.buttonDisabled]}
              onPress={onForgotPassword}
              disabled={sendingForgot || isLoading}
            >
              {sendingForgot ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.forgotButtonText, { color: colors.primary }]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subText }]}>
            Need an account? Contact your admin.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 22,
  },
  form: {
    marginBottom: 16,
  },
  switchBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
  },
  switchItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchText: {
    fontWeight: '600',
    fontSize: 12,
  },
  switchTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
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
  forgotWrap: {
    marginTop: 14,
  },
  forgotButton: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  forgotButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
  },
});

export default LoginScreen;