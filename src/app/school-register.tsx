import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  // Keyboard,
  // KeyboardAvoidingView,
  // KeyboardEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';

interface SchoolForm {
  schoolId: string;
  email: string;
  password: string;
  schoolName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  role: 'admin' | 'school';
}

const defaultForm: SchoolForm = {
  schoolId: '',
  email: '',
  password: '',
  schoolName: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  role : 'admin',
};

export default function SchoolRegisterScreen() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
//   const [loading, setLoading] = useState(false);
//   const [form, setForm] = useState<SchoolForm>(defaultForm);
//   const [keyboardInset, setKeyboardInset] = useState(0);
//   const scrollRef = React.useRef<ScrollView>(null);
//   const fieldYRef = React.useRef<Record<string, number>>({});

//   React.useEffect(() => {
//     const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
//     const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

//     const onShow = (event: KeyboardEvent) => {
//       setKeyboardInset(event.endCoordinates?.height || 0);
//     };

//     const onHide = () => {
//       setKeyboardInset(0);
//     };

//     const showSub = Keyboard.addListener(showEvent, onShow);
//     const hideSub = Keyboard.addListener(hideEvent, onHide);

//     return () => {
//       showSub.remove();
//       hideSub.remove();
//     };
//   }, []);

//   const update = (key: keyof SchoolForm, value: string) => {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   };

//   const validate = () => {
//     if (!form.schoolId.trim()) return 'School ID is required';
//     if (!form.schoolName.trim()) return 'School name is required';
//     if (!form.email.trim()) return 'Email is required';
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email';
//     if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
//     if (!form.address.trim()) return 'Address is required';
//     if (!form.city.trim()) return 'City is required';
//     if (!form.state.trim()) return 'State is required';
//     if (!/^\d{6}$/.test(form.pinCode)) return 'Pin code must be 6 digits';
//     return null;
//   };

//   const submit = async () => {
//     const error = validate();
//     if (error) {
//       Alert.alert('Validation', error);
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await apiService.registerSchool({
//         schoolId: form.schoolId.trim(),
//         email: form.email.trim(),
//         password: form.password,
//         schoolName: form.schoolName.trim(),
//         address: form.address.trim(),
//         city: form.city.trim(),
//         state: form.state.trim(),
//         pinCode: form.pinCode.trim(),
//         role: 'admin',
//       });

//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to register school');
//       }

//       Alert.alert('Success', 'School registered successfully. Please login.');
//       setForm(defaultForm);
//       router.replace('/');
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to register school');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const trackFieldLayout = (key: string) => (event: any) => {
//     fieldYRef.current[key] = event.nativeEvent.layout.y;
//   };

//   const scrollToField = (key: string) => {
//     const y = fieldYRef.current[key];
//     if (typeof y !== 'number') return;
//     requestAnimationFrame(() => {
//       scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
//     });
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       keyboardVerticalOffset={0}>
//       <ScrollView
//         ref={scrollRef}
//         contentContainerStyle={[
//           styles.content,
//           keyboardInset > 0 ? styles.contentWithKeyboard : null,
//           { paddingBottom: keyboardInset + 16 },
//         ]}
//         keyboardShouldPersistTaps="handled"
//         keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
//         scrollIndicatorInsets={{ bottom: keyboardInset }}
//         showsVerticalScrollIndicator={false}>
//         <Text style={styles.title}>School MIS</Text>
//         <Text style={styles.subtitle}>Create School</Text>

//         <View style={styles.switchBar}>
//           <TouchableOpacity style={styles.switchItem} onPress={() => router.replace('/')}>
//             <Text style={styles.switchText}>Login</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.switchItem, styles.switchItemActive]} disabled>
//             <Text style={[styles.switchText, styles.switchTextActive]}>Add School</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.switchItem} onPress={() => router.replace('/school-login')}>
//             <Text style={styles.switchText}>School Login</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.form}>
//           <View onLayout={trackFieldLayout('schoolId')}>
//           <TextInput
//             style={styles.input}
//             placeholder="School ID"
//             placeholderTextColor="#999"
//             value={form.schoolId}
//             onChangeText={(v) => update('schoolId', v)}
//             onFocus={() => scrollToField('schoolId')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('schoolName')}>
//           <TextInput
//             style={styles.input}
//             placeholder="School Name"
//             placeholderTextColor="#999"
//             value={form.schoolName}
//             onChangeText={(v) => update('schoolName', v)}
//             onFocus={() => scrollToField('schoolName')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('email')}>
//           <TextInput
//             style={styles.input}
//             placeholder="Email"
//             placeholderTextColor="#999"
//             keyboardType="email-address"
//             autoCapitalize="none"
//             value={form.email}
//             onChangeText={(v) => update('email', v)}
//             onFocus={() => scrollToField('email')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('password')}>
//           <TextInput
//             style={styles.input}
//             placeholder="Password"
//             placeholderTextColor="#999"
//             secureTextEntry
//             value={form.password}
//             onChangeText={(v) => update('password', v)}
//             onFocus={() => scrollToField('password')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('address')}>
//           <TextInput
//             style={styles.input}
//             placeholder="Address"
//             placeholderTextColor="#999"
//             value={form.address}
//             onChangeText={(v) => update('address', v)}
//             onFocus={() => scrollToField('address')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('city')}>
//           <TextInput
//             style={styles.input}
//             placeholder="City"
//             placeholderTextColor="#999"
//             value={form.city}
//             onChangeText={(v) => update('city', v)}
//             onFocus={() => scrollToField('city')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('state')}>
//           <TextInput
//             style={styles.input}
//             placeholder="State"
//             placeholderTextColor="#999"
//             value={form.state}
//             onChangeText={(v) => update('state', v)}
//             onFocus={() => scrollToField('state')}
//             editable={!loading}
//           />
//           </View>
//           <View onLayout={trackFieldLayout('pinCode')}>
//           <TextInput
//             style={styles.input}
//             placeholder="Pin Code"
//             placeholderTextColor="#999"
//             keyboardType="numeric"
//             value={form.pinCode}
//             onChangeText={(v) => update('pinCode', v)}
//             onFocus={() => scrollToField('pinCode')}
//             editable={!loading}
//           />
//           </View>

//           <TouchableOpacity
//             style={[styles.button, loading && styles.buttonDisabled]}
//             onPress={submit}
//             disabled={loading}>
//             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add School</Text>}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   content: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//   },
//   contentWithKeyboard: {
//     justifyContent: 'flex-start',
//     paddingTop: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1976d2',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 18,
//   },
//   switchBar: {
//     flexDirection: 'row',
//     borderWidth: 1,
//     borderColor: '#d0d7de',
//     borderRadius: 10,
//     overflow: 'hidden',
//     marginBottom: 16,
//     backgroundColor: '#fff',
//   },
//   switchItem: {
//     flex: 1,
//     paddingVertical: 10,
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   switchItemActive: {
//     backgroundColor: '#1976d2',
//   },
//   switchText: {
//     color: '#1976d2',
//     fontWeight: '600',
//     fontSize: 12,
//   },
//   switchTextActive: {
//     color: '#fff',
//   },
//   form: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 18,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     marginBottom: 10,
//     fontSize: 15,
//     color: '#000',
//   },
//   button: {
//     backgroundColor: '#1976d2',
//     borderRadius: 8,
//     paddingVertical: 12,
//     alignItems: 'center',
//     marginTop: 6,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });
