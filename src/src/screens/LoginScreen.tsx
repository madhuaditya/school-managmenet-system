import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { isValidEmail, isValidPassword } from '@/src/utils/helpers';
import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { LoginCredentials } from '@/src/types';
import { TextInput as RNTextInput } from 'react-native';

const lightColors = {
  bg: '#F5F5F5',
  card: '#FFFFFF',
  primary: '#FF5722',
  accent: '#76ABAE',
  text: '#303841',
  subText: '#6B7280',
  border: '#E6E6E6',
  error: '#DC2626',
};

const darkColors = {
  bg: '#1F2428',
  card: '#2A3136',
  primary: '#FF5722',
  accent: '#76ABAE',
  text: '#F5F5F5',
  subText: '#B8BDC1',
  border: '#3A4349',
  error: '#F87171',
};

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [forgotUsername, setForgotUsername] = React.useState('');
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [sendingForgot, setSendingForgot] = React.useState(false);
  const [openOtp, setOpenOtp] = React.useState(false);
  const [otpToken, setOtpToken] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [otpMessage, setOtpMessage] = React.useState('');
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [resendCount, setResendCount] = React.useState(0);
  const [cooldown, setCooldown] = React.useState(0);
  const inputsRef = React.useRef<Array<RNTextInput | null>>([]);

  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginCredentials) => {
    // Send OTP to user's phone (two-step login)
    try {
      setSendingOtp(true);
      const response = await apiService.login(values.username.trim(), values.password);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to send OTP');
      }

      const token = (response.data as any)?.token || '';
      setOtpToken(token);
      setOtpMessage(response.msg || `OTP sent successfully`);
      setOpenOtp(true);
      setResendCount(1);
      setCooldown(90);
      // focus first OTP input after small delay
      setTimeout(() => inputsRef.current[0]?.focus?.(), 50);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP. Please try again.';
      Alert.alert('OTP Error', message);
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and complete login
  const onVerifyOtp = async () => {
    if (!otpToken || !otp.trim()) {
      Alert.alert('Validation', 'OTP and token are required.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const response = await login({ token: otpToken, code: otp.trim() });
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.';
      Alert.alert('OTP Verification Failed', message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onResendOtp = async (username: string, password: string) => {
    if (resendCount >= 5) return;
    if (cooldown > 0) return;
    try {
      setSendingOtp(true);
      const response = await apiService.login(username.trim(), password);
      if (!response.success) throw new Error(response.msg || 'Failed to resend OTP');
      setOtpToken((response.data as any)?.token || '');
      setOtpMessage(response.msg || 'OTP resent successfully');
      setResendCount((c) => c + 1);
      setCooldown(90);
      setTimeout(() => inputsRef.current[0]?.focus?.(), 50);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP.';
      Alert.alert('Resend Failed', message);
    } finally {
      setSendingOtp(false);
    }
  };

  // cooldown timer for resend OTP
  React.useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);


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
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        <Text style={[styles.title, { color: colors.text }]}>
          School MIS
        </Text>

        <Text style={[styles.subtitle, { color: colors.subText }]}>
          Sign in to continue
        </Text>

        {/* <View style={[styles.switchBar, { borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.switchItem, { backgroundColor: '#FF5722' }]} disabled>
            <Text style={[styles.switchTextActive]}>Login</Text>
          </TouchableOpacity>
        </View> */}

        <View style={styles.form}>
          <View>
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
          </View>
          {errors.username && <Text style={[styles.errorText, { color: colors.error }]}>{errors.username.message}</Text>}

          <View >
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
          </View>
          {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password.message}</Text>}

          {!openOtp ? (
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: '#FF5722' },
                (isLoading || sendingOtp) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || sendingOtp}
            >
              {sendingOtp || isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={[styles.subtitle, { color: colors.subText, textAlign: 'center' }]}>{otpMessage}</Text>
              <View style={styles.otpRow} >
                {Array.from({ length: 6 }).map((_, idx) => {
                  const val = otp[idx] || '';
                  return (
                    <TextInput
                      key={idx}
                      ref={(el) => {
                        inputsRef.current[idx] = el;
                      }}
                      value={val}
                      keyboardType="number-pad"
                      maxLength={1}
                      onChangeText={(text) => {
                        const digit = text.replace(/\D/g, '').slice(-1);
                        const arr = otp.split('');
                        while (arr.length < 6) arr.push('');
                        arr[idx] = digit;
                        const newOtp = arr.join('').slice(0, 6);
                        setOtp(newOtp);
                        if (digit && idx < 5) inputsRef.current[idx + 1]?.focus?.();
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace') {
                          const arr = otp.split('');
                          while (arr.length < 6) arr.push('');
                          if (arr[idx]) {
                            arr[idx] = '';
                            setOtp(arr.join(''));
                          } else if (idx > 0) {
                            inputsRef.current[idx - 1]?.focus?.();
                            arr[idx - 1] = '';
                            setOtp(arr.join(''));
                          }
                        }
                      }}
                      style={[styles.otpInput, { borderColor: colors.border, color: colors.text }]}
                    />
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#FF5722', flex: 1 }]}
                  onPress={onVerifyOtp}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, flex: 1 }]}
                  onPress={() => {
                    setOpenOtp(false);
                    setOtp('');
                    setOtpToken('');
                  }}
                >
                  <Text
                    style={{
                      color: '#303841',
                      fontSize: 14,
                      fontWeight: '600',
                    }}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => onResendOtp(getValues().username || '', getValues().password || '')}
                  disabled={sendingOtp || cooldown > 0 || resendCount >= 5}
                >
                  <Text style={{ color: colors.primary }}>
                    {resendCount >= 5 ? 'Resend limit reached' : cooldown > 0 ? `Resend in ${cooldown}s` : `Resend OTP (${resendCount}/5)`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.forgotWrap} >
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
          <View style={styles.footerLinksRow}>
            <TouchableOpacity onPress={() => router.push('/about')} style={styles.footerLinkButton}>
              <Text style={[styles.footerLinkText, { color: colors.primary }]}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/contact')} style={styles.footerLinkButton}>
              <Text style={[styles.footerLinkText, { color: colors.primary }]}>Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/feedback')} style={styles.footerLinkButton}>
              <Text style={[styles.footerLinkText, { color: colors.primary }]}>Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    borderRadius: 10,
    padding: 22,
    borderWidth: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 6,
  },

  button: {
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    gap: 10,
  },
  footerText: {
    fontSize: 12,
  },
  footerLinksRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLinkButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  otpInput: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
  },
});

export default LoginScreen;