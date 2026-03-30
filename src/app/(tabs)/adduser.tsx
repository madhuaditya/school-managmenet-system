import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

type UserType = 'admin' | 'teacher' | 'student' | 'staff';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  classId: string;
  qualifications: string;
  school: string;
  // Student specific fields
  studentId: string;
  fatherName: string;
  motherName: string;
  parentContact: string;
  dateOfBirth: string;
  dateOfAdmission: string;
  rollNumber: string;
}

interface ClassItem {
  _id: string;
  name: string;
  grade?: string;
  section?: string;
}

const getSchoolId = (school: unknown): string => {
  if (!school) return '';
  if (typeof school === 'string') return school;
  if (typeof school === 'object' && school !== null && '_id' in school) {
    const maybe = school as { _id?: unknown };
    return typeof maybe._id === 'string' ? maybe._id : '';
  }
  return '';
};

export default function AddUserScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((state) => state.user);

  const [userType, setUserType] = useState<UserType>('student');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    classId: '',
    qualifications: '',
    school: getSchoolId(user?.school),
    studentId: '',
    fatherName: '',
    motherName: '',
    parentContact: '',
    dateOfBirth: '',
    dateOfAdmission: '',
    rollNumber: '',
  });

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showAdmissionPicker, setShowAdmissionPicker] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const parseDate = (value: string) => {
    const parsed = value ? new Date(value) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  useEffect(() => {
    if (userType === 'student') {
      fetchClasses();
    }
  }, [userType]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await apiService.getClasses();
      setClasses(response.data || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const updateFormField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleClassSelection = (item: ClassItem) => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedClass(item);
    setFormData((prev) => ({
      ...prev,
      classId: item._id,
      dateOfAdmission: today,
    }));
    setClassModalVisible(false);
    if (errors.classId) {
      setErrors((prev) => ({ ...prev, classId: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      nextErrors.phone = 'Invalid phone number';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      nextErrors.pinCode = 'Pin code must be 6 digits';
    }

    if (userType === 'student') {
      if (!formData.classId) nextErrors.classId = 'Class is required';
      if (!formData.studentId.trim()) nextErrors.studentId = 'Student ID is required';
      if (!formData.fatherName.trim()) nextErrors.fatherName = 'Father name is required';
      if (!formData.motherName.trim()) nextErrors.motherName = 'Mother name is required';
      if (!formData.parentContact.trim()) {
        nextErrors.parentContact = 'Parent contact is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.parentContact)) {
        nextErrors.parentContact = 'Invalid parent contact';
      }
      if (!formData.dateOfBirth.trim()) nextErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.rollNumber.trim()) nextErrors.rollNumber = 'Roll number is required';
      if (!formData.dateOfAdmission.trim()) nextErrors.dateOfAdmission = 'Date of admission is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      classId: '',
      qualifications: '',
      school: getSchoolId(user?.school),
      studentId: '',
      fatherName: '',
      motherName: '',
      parentContact: '',
      dateOfBirth: '',
      dateOfAdmission: '',
      rollNumber: '',
    });
    setSelectedClass(null);
    setShowDobPicker(false);
    setShowAdmissionPicker(false);
    setErrors({});
  };

  const onDateChange = (field: 'dateOfBirth' | 'dateOfAdmission') => (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (field === 'dateOfBirth') setShowDobPicker(false);
      if (field === 'dateOfAdmission') setShowAdmissionPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) return;
    updateFormField(field, formatDate(selectedDate));
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const registrationData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: userType,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        pinCode: formData.pinCode,
        school: formData.school,
      };

      if (userType === 'student') {
        registrationData.studentId = formData.studentId;
        registrationData.fatherName = formData.fatherName;
        registrationData.motherName = formData.motherName;
        registrationData.parentContact = formData.parentContact;
        registrationData.dateOfBirth = formData.dateOfBirth;
        registrationData.rollNumber = formData.rollNumber;
        registrationData.dateOfAdmission = formData.dateOfAdmission;
      }

      const response = await apiService.register(registrationData);

      if (response.data?.userId && userType === 'student' && formData.classId) {
        await apiService.assignStudentToClass(response.data.userId, formData.classId);
      }

      Alert.alert('Success', `${userType.charAt(0).toUpperCase() + userType.slice(1)} added successfully!`);
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Failed to add ${userType}`;
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    options?: {
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      multiline?: boolean;
      editable?: boolean;
    }
  ) => (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: errors[field] ? '#ff6b6b' : theme.tabIconDefault,
            color: theme.text,
            backgroundColor: options?.editable === false ? '#f0f0f0' : '#f5f5f5',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.tabIconDefault}
        value={formData[field]}
        onChangeText={(value) => updateFormField(field, value)}
        secureTextEntry={options?.secureTextEntry}
        keyboardType={options?.keyboardType}
        multiline={options?.multiline}
        editable={options?.editable ?? !submitting}
      />
      {errors[field] ? <ThemedText style={styles.errorText}>{errors[field]}</ThemedText> : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.typeSelector}>
          {(['admin', 'teacher', 'student', 'staff'] as UserType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                userType === type && [styles.typeButtonActive, { backgroundColor: theme.tint }],
              ]}
              onPress={() => setUserType(type)}
              disabled={submitting}
            >
              <MaterialCommunityIcons
                name={
                  type === 'admin'
                    ? 'shield-account'
                    : type === 'teacher'
                      ? 'book-open'
                      : type === 'student'
                        ? 'account-school'
                        : 'briefcase'
                }
                size={22}
                color={userType === type ? '#fff' : theme.text}
              />
              <ThemedText style={[styles.typeButtonText, userType === type && styles.typeButtonTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formContainer}>
          <ThemedText style={styles.sectionTitle}>Add New {userType.charAt(0).toUpperCase() + userType.slice(1)}</ThemedText>

          {renderFormField('Full Name', 'name', 'Enter full name')}
          {renderFormField('Email', 'email', 'Enter email address', { keyboardType: 'email-address' })}
          {renderFormField('Phone', 'phone', 'Enter phone number', { keyboardType: 'phone-pad' })}
          {renderFormField('Password', 'password', 'Enter password', { secureTextEntry: true })}
          {renderFormField('Confirm Password', 'confirmPassword', 'Confirm password', { secureTextEntry: true })}

          <ThemedText style={styles.sectionSubtitle}>Address Information</ThemedText>
          {renderFormField('Address', 'address', 'Enter address', { multiline: true })}
          {renderFormField('City', 'city', 'Enter city')}
          {renderFormField('State', 'state', 'Enter state')}
          {renderFormField('Pin Code', 'pinCode', 'Enter 6-digit pin code', { keyboardType: 'numeric' })}

          {userType === 'teacher' &&
            renderFormField('Qualifications', 'qualifications', 'Enter qualifications (e.g., B.Tech, M.Tech)', {
              multiline: true,
            })}

          {userType === 'student' && (
            <>
              <ThemedText style={styles.sectionSubtitle}>Student Information</ThemedText>
              {renderFormField('Student ID', 'studentId', 'Enter student ID')}
              {renderFormField('Father Name', 'fatherName', 'Enter father name')}
              {renderFormField('Mother Name', 'motherName', 'Enter mother name')}
              {renderFormField('Parent Contact', 'parentContact', 'Enter parent contact', {
                keyboardType: 'phone-pad',
              })}

              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>Date of Birth</ThemedText>
                <TouchableOpacity
                  style={[styles.dateInputButton, { borderColor: errors.dateOfBirth ? '#ff6b6b' : theme.tabIconDefault }]}
                  onPress={() => setShowDobPicker(true)}
                  disabled={submitting}
                >
                  <ThemedText style={[styles.dateInputText, { color: formData.dateOfBirth ? theme.text : theme.tabIconDefault }]}>
                    {formData.dateOfBirth || 'Select date of birth'}
                  </ThemedText>
                  <MaterialCommunityIcons name="calendar" size={20} color={theme.text} />
                </TouchableOpacity>
                {showDobPicker ? (
                  <DateTimePicker
                    value={parseDate(formData.dateOfBirth)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={onDateChange('dateOfBirth')}
                  />
                ) : null}
                {errors.dateOfBirth ? <ThemedText style={styles.errorText}>{errors.dateOfBirth}</ThemedText> : null}
              </View>

              {renderFormField('Roll Number', 'rollNumber', 'Enter roll number')}

              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>Select Class *</ThemedText>
                {loadingClasses ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.tint} />
                  </View>
                ) : classes.length > 0 ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.dropdownButton,
                        { borderColor: errors.classId ? '#ff6b6b' : theme.tabIconDefault },
                      ]}
                      onPress={() => setClassModalVisible(true)}
                      disabled={submitting}
                    >
                      <ThemedText style={styles.dropdownButtonText}>
                        {selectedClass
                          ? `${selectedClass.name}${selectedClass.grade ? ` (Grade ${selectedClass.grade})` : ''}${selectedClass.section ? ` - Section ${selectedClass.section}` : ''}`
                          : 'Select a class...'}
                      </ThemedText>
                      <MaterialCommunityIcons name="chevron-down" size={22} color={theme.text} />
                    </TouchableOpacity>

                    <Modal
                      visible={classModalVisible}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setClassModalVisible(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                          <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select a Class</ThemedText>
                            <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                          </View>

                          <FlatList
                            data={classes}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[
                                  styles.classListItem,
                                  selectedClass?._id === item._id && { backgroundColor: theme.tint },
                                ]}
                                onPress={() => handleClassSelection(item)}
                              >
                                <ThemedText
                                  style={[
                                    styles.classListItemText,
                                    selectedClass?._id === item._id && styles.classListItemTextSelected,
                                  ]}
                                >
                                  {`${item.name}${item.grade ? ` (Grade ${item.grade})` : ''}${item.section ? ` - Section ${item.section}` : ''}`}
                                </ThemedText>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      </View>
                    </Modal>
                  </>
                ) : (
                  <ThemedText style={styles.errorText}>No classes available</ThemedText>
                )}
                {errors.classId ? <ThemedText style={styles.errorText}>{errors.classId}</ThemedText> : null}
              </View>

              <ThemedText style={styles.sectionSubtitle}>Auto-filled From Class</ThemedText>
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>Date of Admission</ThemedText>
                <TouchableOpacity
                  style={[styles.dateInputButton, { borderColor: errors.dateOfAdmission ? '#ff6b6b' : theme.tabIconDefault }]}
                  onPress={() => setShowAdmissionPicker(true)}
                  disabled={submitting}
                >
                  <ThemedText style={[styles.dateInputText, { color: formData.dateOfAdmission ? theme.text : theme.tabIconDefault }]}>
                    {formData.dateOfAdmission || 'Select date of admission'}
                  </ThemedText>
                  <MaterialCommunityIcons name="calendar" size={20} color={theme.text} />
                </TouchableOpacity>
                {showAdmissionPicker ? (
                  <DateTimePicker
                    value={parseDate(formData.dateOfAdmission)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={onDateChange('dateOfAdmission')}
                  />
                ) : null}
                {errors.dateOfAdmission ? <ThemedText style={styles.errorText}>{errors.dateOfAdmission}</ThemedText> : null}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: submitting ? theme.tabIconDefault : theme.tint }]}
            onPress={handleAddUser}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                <ThemedText style={styles.submitButtonText}>
                  Add {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.tint }]}
            onPress={resetForm}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={theme.tint} />
            <ThemedText style={[styles.resetButtonText, { color: theme.tint }]}>Reset Form</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingBottom: 20,
//   },
//   typeSelector: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     paddingHorizontal: 10,
//     paddingVertical: 15,
//     gap: 8,
//   },
//   typeButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 8,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     gap: 4,
//   },
//   typeButtonActive: {
//     borderWidth: 0,
//   },
//   typeButtonText: {
//     fontSize: 12,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   typeButtonTextActive: {
//     color: '#fff',
//   },
//   formContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     marginTop: 10,
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginTop: 15,
//     marginBottom: 10,
//     opacity: 0.7,
//   },
//   fieldContainer: {
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 6,
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 14,
//     minHeight: 44,
//   },
//   loadingContainer: {
//     height: 44,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   errorText: {
//     color: '#ff6b6b',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   submitButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginTop: 20,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   resetButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginTop: 10,
//     borderWidth: 2,
//     gap: 8,
//   },
//   resetButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   dropdownButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     minHeight: 44,
//     backgroundColor: '#f5f5f5',
//   },
//   dropdownButtonText: {
//     fontSize: 14,
//     flex: 1,
//   },
//   dateInputButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     minHeight: 44,
//     backgroundColor: '#f5f5f5',
//   },
//   dateInputText: {
//     fontSize: 14,
//     flex: 1,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     maxHeight: '80%',
//     paddingBottom: 20,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   classListItem: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   classListItemText: {
//     fontSize: 14,
//   },
//   classListItemTextSelected: {
//     color: '#fff',
//     fontWeight: '600',
//   },
// });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },

  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },

  typeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },

  typeButtonActive: {
    elevation: 4,
  },

  typeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  typeButtonTextActive: {
    color: '#fff',
  },

  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 10,
  },

  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 10,
    opacity: 0.7,
  },

  fieldContainer: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 46,
  },

  loadingContainer: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1.5,
    gap: 8,
  },

  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },

  dropdownButtonText: {
    fontSize: 14,
    flex: 1,
  },

  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },

  dateInputText: {
    fontSize: 14,
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  classListItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  classListItemText: {
    fontSize: 14,
  },

  classListItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});