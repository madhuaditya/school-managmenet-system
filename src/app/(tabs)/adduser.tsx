import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
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
import AddressLookupField from '@/components/forms/AddressLookupField';

type UserType = 'admin' | 'teacher' | 'student' | 'staff';
type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

interface FormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: Gender;
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
  const isDark = colorScheme === 'dark';
  const screenBg = isDark ? '#0B1220' : theme.background;
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const surfaceBg = isDark ? '#0F172A' : '#F5F5F5';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const mutedColor = isDark ? '#94A3B8' : theme.tabIconDefault;
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const primaryButtonBg = isDark ? '#2563EB' : theme.tint;
  const neutralButtonBg = isDark ? 'rgba(37, 99, 235, 0.14)' : '#fff';
  const modalHeaderBorder = isDark ? '#334155' : '#E5E7EB';
  const user = useAuthStore((state) => state.user);

  const [userType, setUserType] = useState<UserType>('student');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Prefer not to say',
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
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [registeredUserSummary, setRegisteredUserSummary] = useState<{ name: string; username: string; password: string } | null>(null);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const buildPassword = (name: string, type: UserType) => {
    const prefix = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 4) || 'user';
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${type.slice(0, 2)}@${suffix}`;
  };

  const parseDate = (value: string) => {
    const parsed = value ? new Date(value) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  useEffect(() => {
    if (userType === 'student') {
      fetchClasses();
    }
  }, [userType]);

  useEffect(() => {
    const fillGeneratedFields = async () => {
      if (!formData.name.trim()) return;

      try {
        const [usernameResult, passwordResult, studentIdResult] = await Promise.all([
          formData.username.trim()
            ? Promise.resolve(null)
            : apiService.generateUsername({ name: formData.name.trim(), role: userType }),
          formData.password.trim()
            ? Promise.resolve(null)
            : Promise.resolve({ data: { password: buildPassword(formData.name, userType) } }),
          userType === 'student' && !formData.studentId.trim()
            ? apiService.generateStudentId()
            : Promise.resolve(null),
        ]);

        const generatedUsername = usernameResult?.data?.username;
        if (usernameResult?.success && generatedUsername) {
          setFormData((prev) => ({ ...prev, username: generatedUsername }));
        }

        if (passwordResult?.data?.password) {
          setFormData((prev) => ({ ...prev, password: passwordResult.data.password, confirmPassword: passwordResult.data.password }));
        }

        const generatedStudentId = studentIdResult?.data?.studentId;
        if (studentIdResult?.success && generatedStudentId) {
          setFormData((prev) => ({ ...prev, studentId: generatedStudentId }));
        }
      } catch {
        if (!formData.password.trim()) {
          const generatedPassword = buildPassword(formData.name, userType);
          setFormData((prev) => ({ ...prev, password: generatedPassword, confirmPassword: generatedPassword }));
        }
      }
    };

    void fillGeneratedFields();
  }, [formData.name, formData.username, formData.password, formData.studentId, userType]);

  useEffect(() => {
    if (userType !== 'student' || !selectedClass) return;

    const fillRollNumber = async () => {
      try {
        const response = await apiService.generateRollNumber({ classId: selectedClass._id });
        const generatedRollNumber = response.data?.rollNumber;
        if (response.success && generatedRollNumber) {
          setFormData((prev) => ({ ...prev, rollNumber: generatedRollNumber }));
        }
      } catch {
        // Keep manual value if generator fails.
      }
    };

    void fillRollNumber();
  }, [selectedClass, userType]);

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
    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 5) {
      nextErrors.username = 'Username must be at least 5 characters';
    }
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
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      gender: 'Prefer not to say',
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
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: userType,
        gender: formData.gender,
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

      setRegisteredUserSummary({
        name: formData.name,
        username: formData.username,
        password: formData.password,
      });
      setSuccessModalVisible(true);
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
    <View style={styles.fieldContainer} >
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
      <ThemedView style={[styles.container, { backgroundColor: screenBg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.typeSelector}>
          {(['admin', 'teacher', 'student', 'staff'] as UserType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                { borderColor, backgroundColor: cardBg },
                userType === type && [styles.typeButtonActive, { backgroundColor: primaryButtonBg, borderColor: primaryButtonBg }],
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
                color={userType === type ? '#fff' : textColor}
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
          {renderFormField('Username', 'username', 'Enter username')}
          {renderFormField('Email', 'email', 'Enter email address', { keyboardType: 'email-address' })}
          {renderFormField('Phone', 'phone', 'Enter phone number', { keyboardType: 'phone-pad' })}
          {renderFormField('Password', 'password', 'Enter password', { secureTextEntry: true })}
          {renderFormField('Confirm Password', 'confirmPassword', 'Confirm password', { secureTextEntry: true })}

          <View style={styles.fieldContainer} >
            <ThemedText style={styles.label}>Gender</ThemedText>
            <View style={styles.genderRow}>
              {(['Male', 'Female', 'Other', 'Prefer not to say'] as Gender[]).map((gender) => {
                const selected = formData.gender === gender;
                return (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderChip,
                      { borderColor, backgroundColor: cardBg },
                      selected && { backgroundColor: primaryButtonBg, borderColor: primaryButtonBg },
                    ]}
                    onPress={() => updateFormField('gender', gender)}
                    disabled={submitting}
                  >
                    <ThemedText style={[styles.genderText, selected && styles.genderTextSelected]}>{gender}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ThemedText style={styles.sectionSubtitle}>Address Information</ThemedText>
          <AddressLookupField
            address={formData.address}
            setAddress={(value) => updateFormField('address', value)}
            pincode={formData.pinCode}
            setPincode={(value) => updateFormField('pinCode', value)}
            city={formData.city}
            setCity={(value) => updateFormField('city', value)}
            state={formData.state}
            setState={(value) => updateFormField('state', value)}
            errors={{
              address: errors.address,
              city: errors.city,
              state: errors.state,
              pincode: errors.pinCode,
            }}
          />

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
                  style={[styles.dateInputButton, { borderColor: errors.dateOfBirth ? '#ff6b6b' : borderColor, backgroundColor: surfaceBg }]}
                  onPress={() => setShowDobPicker(true)}
                  disabled={submitting}
                >
                  <ThemedText style={[styles.dateInputText, { color: formData.dateOfBirth ? textColor : mutedColor }]}>
                    {formData.dateOfBirth || 'Select date of birth'}
                  </ThemedText>
                  <MaterialCommunityIcons name="calendar" size={20} color={textColor} />
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

              <View style={styles.fieldContainer} >
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
                        { borderColor: errors.classId ? '#ff6b6b' : borderColor, backgroundColor: surfaceBg },
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
                                    { backgroundColor: cardBg, borderBottomColor: modalHeaderBorder },
                                    selectedClass?._id === item._id && { backgroundColor: primaryButtonBg },
                                ]}
                                onPress={() => handleClassSelection(item)}
                              >
                                <ThemedText
                                  style={[
                                    styles.classListItemText,
                                      { color: textColor },
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
              <View style={styles.fieldContainer} >
                <ThemedText style={styles.label}>Date of Admission</ThemedText>
                <TouchableOpacity
                  style={[styles.dateInputButton, { borderColor: errors.dateOfAdmission ? '#ff6b6b' : borderColor, backgroundColor: surfaceBg }]}
                  onPress={() => setShowAdmissionPicker(true)}
                  disabled={submitting}
                >
                  <ThemedText style={[styles.dateInputText, { color: formData.dateOfAdmission ? textColor : mutedColor }]}>
                    {formData.dateOfAdmission || 'Select date of admission'}
                  </ThemedText>
                  <MaterialCommunityIcons name="calendar" size={20} color={textColor} />
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
            style={[styles.submitButton, { backgroundColor: submitting ? (isDark ? '#475569' : theme.tabIconDefault) : primaryButtonBg }]}
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
            style={[styles.resetButton, { borderColor: theme.tint, backgroundColor: neutralButtonBg }]}
            onPress={resetForm}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={theme.tint} />
            <ThemedText style={[styles.resetButtonText, { color: theme.tint }]}>Reset Form</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={successModalVisible} transparent animationType="fade" onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: cardBg, borderColor }] }>
            <ThemedText type="subtitle">User Created</ThemedText>
            <ThemedText style={styles.successText}>Name: {registeredUserSummary?.name || 'N/A'}</ThemedText>
            <ThemedText style={styles.successText}>Username: {registeredUserSummary?.username || 'N/A'}</ThemedText>
            <ThemedText style={styles.successText}>Password: {registeredUserSummary?.password || 'N/A'}</ThemedText>

            <TouchableOpacity style={[styles.successButton, { backgroundColor: primaryButtonBg }]} onPress={() => setSuccessModalVisible(false)}>
              <ThemedText style={styles.successButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
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
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#fff',
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
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
  },
  successText: {
    fontSize: 14,
  },
  successButton: {
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  successButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});