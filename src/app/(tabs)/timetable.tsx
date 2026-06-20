// import { useEffect, useMemo, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   View,
// } from 'react-native';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';

// type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// interface ClassItem {
//   _id: string;
//   name: string;
//   grade?: string | number;
//   section?: string;
// }

// interface SubjectItem {
//   _id: string;
//   name: string;
//   code?: string;
// }

// interface PeriodItem {
//   subject: string;
//   startTime: string;
//   endTime: string;
//   hour?: number;
// }

// interface TimeTableItem {
//   _id: string;
//   name?: string;
//   day: DayName;
//   class?: ClassItem | string;
//   classId?: string;
//   periods: Array<
//     PeriodItem & {
//       subject?: SubjectItem | string;
//       _id?: string;
//     }
//   >;
// }

// const DAYS: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// const getRole = (role: unknown) => {
//   if (typeof role === 'string') return role;
//   if (role && typeof role === 'object' && 'role' in role) {
//     const value = (role as { role?: string }).role;
//     return value || '';
//   }
//   return '';
// };

// export default function TimeTableTab() {
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const user = useAuthStore((state) => state.user);
//   const isAdmin = getRole(user?.role) === 'admin';

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const [classes, setClasses] = useState<ClassItem[]>([]);
//   const [subjects, setSubjects] = useState<SubjectItem[]>([]);
//   const [items, setItems] = useState<TimeTableItem[]>([]);

//   const [name, setName] = useState('');
//   const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
//   const [selectedDay, setSelectedDay] = useState<DayName>('Monday');
//   const [periods, setPeriods] = useState<PeriodItem[]>([{ subject: '', startTime: '', endTime: '', hour: 1 }]);

//   const isEditing = useMemo(() => !!editingId, [editingId]);

//   useEffect(() => {
//     void loadAll();
//   }, []);

//   useEffect(() => {
//     if (!selectedClassId) {
//       setSubjects([]);
//       return;
//     }

//     void loadSubjectsForClass(selectedClassId);
//   }, [selectedClassId]);

//   const loadAll = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [classResponse, timetableResponse] = await Promise.all([
//         apiService.getClasses(),
//         apiService.getAllTimetables(),
//       ]);

//       if (!classResponse.success) {
//         throw new Error(classResponse.msg || 'Failed to load classes');
//       }
//       if (!timetableResponse.success) {
//         throw new Error(timetableResponse.msg || 'Failed to load timetables');
//       }

//       setClasses(Array.isArray(classResponse.data) ? (classResponse.data as unknown as ClassItem[]) : []);
//       setItems(Array.isArray(timetableResponse.data) ? (timetableResponse.data as unknown as TimeTableItem[]) : []);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to load timetable data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadSubjectsForClass = async (classId: string) => {
//     try {
//       const response = await apiService.getSubjectsByClass(classId);
//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to load subjects');
//       }
//       setSubjects(Array.isArray(response.data) ? (response.data as unknown as SubjectItem[]) : []);
//     } catch (err) {
//       setSubjects([]);
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load subjects');
//     }
//   };

//   const resetForm = () => {
//     setEditingId(null);
//     setName('');
//     setSelectedClassId(null);
//     setSelectedDay('Monday');
//     setPeriods([{ subject: '', startTime: '', endTime: '', hour: 1 }]);
//     setSubjects([]);
//   };

//   const updatePeriod = (index: number, patch: Partial<PeriodItem>) => {
//     setPeriods((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
//   };

//   const addPeriodRow = () => {
//     setPeriods((prev) => [...prev, { subject: '', startTime: '', endTime: '', hour: prev.length + 1 }]);
//   };

//   const removePeriodRow = (index: number) => {
//     setPeriods((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, hour: idx + 1 })));
//   };

//   const onSubmit = async () => {
//     if (!isAdmin) {
//       Alert.alert('Access denied', 'Only admin can create or update timetable.');
//       return;
//     }

//     if (!name.trim() || !selectedClassId || !selectedDay) {
//       Alert.alert('Validation', 'Name, class and day are required.');
//       return;
//     }

//     if (periods.length === 0 || periods.some((p) => !p.subject || !p.startTime || !p.endTime)) {
//       Alert.alert('Validation', 'Each period must have subject, start time and end time.');
//       return;
//     }

//     try {
//       setSaving(true);

//       const payload = {
//         name: name.trim(),
//         classId: selectedClassId,
//         day: selectedDay,
//         periods: periods.map((item, idx) => ({
//           subject: item.subject,
//           startTime: item.startTime,
//           endTime: item.endTime,
//           hour: item.hour || idx + 1,
//         })),
//       };

//       if (isEditing && editingId) {
//         const response = await apiService.updateTimetable(editingId, payload);
//         if (!response.success) throw new Error(response.msg || 'Failed to update timetable');
//         Alert.alert('Success', 'Timetable updated successfully.');
//       } else {
//         const response = await apiService.createTimetable(payload);
//         if (!response.success) throw new Error(response.msg || 'Failed to create timetable');
//         Alert.alert('Success', 'Timetable created successfully.');
//       }

//       resetForm();
//       await loadAll();
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save timetable');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const onDelete = async (id: string) => {
//     if (!isAdmin) {
//       Alert.alert('Access denied', 'Only admin can delete timetable.');
//       return;
//     }

//     try {
//       setSaving(true);
//       const response = await apiService.deleteTimetable(id);
//       if (!response.success) throw new Error(response.msg || 'Failed to delete timetable');
//       Alert.alert('Success', 'Timetable deleted successfully.');
//       await loadAll();
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete timetable');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const getClassId = (item: TimeTableItem) => {
//     if (item.classId) return item.classId;
//     if (item.class && typeof item.class === 'object') return item.class._id;
//     if (typeof item.class === 'string') return item.class;
//     return null;
//   };

//   const onEdit = async (item: TimeTableItem) => {
//     const classId = getClassId(item);
//     setEditingId(item._id);
//     setName(item.name || '');
//     setSelectedDay(item.day || 'Monday');
//     setSelectedClassId(classId);

//     if (classId) {
//       await loadSubjectsForClass(classId);
//     }

//     const normalizedPeriods = (item.periods || []).map((period, idx) => ({
//       subject:
//         typeof period.subject === 'string'
//           ? period.subject
//           : period.subject && typeof period.subject === 'object'
//             ? period.subject._id
//             : period.subject || '',
//       startTime: period.startTime || '',
//       endTime: period.endTime || '',
//       hour: period.hour || idx + 1,
//     }));

//     setPeriods(normalizedPeriods.length > 0 ? normalizedPeriods : [{ subject: '', startTime: '', endTime: '', hour: 1 }]);
//   };

//   const classLabel = (cls: ClassItem) => {
//     const section = cls.section ? ` (${cls.section})` : '';
//     const grade = cls.grade !== undefined && cls.grade !== null ? ` Grade ${cls.grade}` : '';
//     return `${cls.name}${section}${grade}`;
//   };

//   const getClassNameFromItem = (item: TimeTableItem) => {
//     if (item.class && typeof item.class === 'object') {
//       const part = item.class.name || 'Class';
//       return `${part}${item.class.section ? ` (${item.class.section})` : ''}`;
//     }
//     const classId = getClassId(item);
//     const cls = classes.find((c) => c._id === classId);
//     return cls ? classLabel(cls) : 'Class';
//   };

//   const getSubjectName = (subjectValue: unknown) => {
//     if (subjectValue && typeof subjectValue === 'object' && '_id' in subjectValue) {
//       const data = subjectValue as { _id: string; name?: string; code?: string };
//       return data.name || data.code || 'Subject';
//     }
//     if (typeof subjectValue === 'string') {
//       const found = subjects.find((sub) => sub._id === subjectValue);
//       return found ? found.name : 'Subject';
//     }
//     return 'Subject';
//   };

//   if (loading) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ActivityIndicator size="large" color={theme.tint} />
//       </ThemedView>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

//       {isAdmin ? (
//         <ThemedView style={[styles.formCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//           <ThemedText type="defaultSemiBold">{isEditing ? 'Edit Timetable' : 'Create Timetable'}</ThemedText>

//           <TextInput
//             style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//             placeholder="Timetable name"
//             placeholderTextColor={theme.icon}
//             value={name}
//             onChangeText={setName}
//             editable={!saving}
//           />

//           <ThemedText style={styles.label}>Select Day</ThemedText>
//           <View style={styles.chipsWrap}>
//             {DAYS.map((day) => (
//               <Pressable
//                 key={day}
//                 onPress={() => setSelectedDay(day)}
//                 style={[
//                   styles.chip,
//                   {
//                     borderColor: theme.icon,
//                     backgroundColor: selectedDay === day ? theme.tint : theme.background,
//                   },
//                 ]}>
//                 <ThemedText style={{ color: selectedDay === day ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>
//                   {day}
//                 </ThemedText>
//               </Pressable>
//             ))}
//           </View>

//           <ThemedText style={styles.label}>Select Class</ThemedText>
//           <View style={styles.chipsWrap}>
//             {classes.length === 0 ? (
//               <ThemedText style={styles.mutedText}>No classes found</ThemedText>
//             ) : (
//               classes.map((cls) => (
//                 <Pressable
//                   key={cls._id}
//                   onPress={() => setSelectedClassId(cls._id)}
//                   style={[
//                     styles.chip,
//                     {
//                       borderColor: theme.icon,
//                       backgroundColor: selectedClassId === cls._id ? theme.tint : theme.background,
//                     },
//                   ]}>
//                   <ThemedText
//                     style={{
//                       color: selectedClassId === cls._id ? '#fff' : theme.text,
//                       fontSize: 12,
//                       fontWeight: '600',
//                     }}>
//                     {classLabel(cls)}
//                   </ThemedText>
//                 </Pressable>
//               ))
//             )}
//           </View>

//           <ThemedText style={styles.label}>Periods</ThemedText>
//           {periods.map((period, index) => (
//             <ThemedView key={`period-${index}`} style={[styles.periodCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//               <ThemedText type="defaultSemiBold">Period {index + 1}</ThemedText>

//               <View style={styles.chipsWrap}>
//                 {subjects.length === 0 ? (
//                   <ThemedText style={styles.mutedText}>Select class to load subjects</ThemedText>
//                 ) : (
//                   subjects.map((subject) => (
//                     <Pressable
//                       key={subject._id}
//                       onPress={() => updatePeriod(index, { subject: subject._id })}
//                       style={[
//                         styles.chip,
//                         {
//                           borderColor: theme.icon,
//                           backgroundColor: period.subject === subject._id ? theme.tint : theme.background,
//                         },
//                       ]}>
//                       <ThemedText style={{ color: period.subject === subject._id ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>
//                         {subject.name}
//                       </ThemedText>
//                     </Pressable>
//                   ))
//                 )}
//               </View>

//               <TextInput
//                 style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//                 placeholder="Start time (09:00)"
//                 placeholderTextColor={theme.icon}
//                 value={period.startTime}
//                 onChangeText={(value) => updatePeriod(index, { startTime: value })}
//                 editable={!saving}
//               />
//               <TextInput
//                 style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//                 placeholder="End time (09:45)"
//                 placeholderTextColor={theme.icon}
//                 value={period.endTime}
//                 onChangeText={(value) => updatePeriod(index, { endTime: value })}
//                 editable={!saving}
//               />

//               {periods.length > 1 ? (
//                 <Pressable style={styles.removeBtn} onPress={() => removePeriodRow(index)} disabled={saving}>
//                   <ThemedText style={styles.actionText}>Remove Period</ThemedText>
//                 </Pressable>
//               ) : null}
//             </ThemedView>
//           ))}

//           <View style={styles.row}>
//             <Pressable style={[styles.secondaryBtn, saving && styles.disabled]} onPress={addPeriodRow} disabled={saving}>
//               <ThemedText style={styles.secondaryText}>+ Add Period</ThemedText>
//             </Pressable>
//           </View>

//           <View style={styles.row}>
//             <Pressable style={[styles.primaryBtn, saving && styles.disabled]} onPress={onSubmit} disabled={saving}>
//               {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.actionText}>{isEditing ? 'Update' : 'Create'}</ThemedText>}
//             </Pressable>

//             {isEditing ? (
//               <Pressable style={styles.secondaryBtn} onPress={resetForm} disabled={saving}>
//                 <ThemedText style={styles.secondaryText}>Cancel</ThemedText>
//               </Pressable>
//             ) : null}
//           </View>
//         </ThemedView>
//       ) : (
//         <ThemedView style={[styles.readOnlyCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//           <ThemedText style={styles.mutedText}>Read-only access: timetable create, edit and delete are admin only.</ThemedText>
//         </ThemedView>
//       )}

//       <ThemedText type="subtitle">All Timetables (Your School)</ThemedText>
//       {items.length === 0 ? (
//         <ThemedText style={styles.mutedText}>No timetable found</ThemedText>
//       ) : (
//         items.map((item) => (
//           <ThemedView key={item._id} style={[styles.itemCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//             <ThemedText type="defaultSemiBold">{item.name || 'Timetable'} | {item.day}</ThemedText>
//             <ThemedText style={styles.mutedText}>Class: {getClassNameFromItem(item)}</ThemedText>

//             {(item.periods || []).map((period, idx) => (
//               <ThemedText key={`${item._id}-p-${idx}`} style={styles.periodText}>
//                 {idx + 1}. {getSubjectName(period.subject)} | {period.startTime} - {period.endTime}
//               </ThemedText>
//             ))}

//             {isAdmin ? (
//               <View style={styles.row}>
//                 <Pressable style={styles.editBtn} onPress={() => void onEdit(item)} disabled={saving}>
//                   <ThemedText style={styles.actionText}>Edit</ThemedText>
//                 </Pressable>
//                 <Pressable style={styles.deleteBtn} onPress={() => void onDelete(item._id)} disabled={saving}>
//                   <ThemedText style={styles.actionText}>Delete</ThemedText>
//                 </Pressable>
//               </View>
//             ) : null}
//           </ThemedView>
//         ))
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     padding: 16,
//     gap: 12,
//     paddingBottom: 36,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   subtitle: {
//     opacity: 0.75,
//   },
//   errorText: {
//     color: '#d93025',
//     fontSize: 13,
//   },
//   formCard: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     gap: 10,
//   },
//   readOnlyCard: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     minHeight: 42,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 14,
//   },
//   label: {
//     opacity: 0.8,
//     fontSize: 13,
//   },
//   chipsWrap: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   chip: {
//     borderWidth: 1,
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },
//   periodCard: {
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 10,
//     gap: 8,
//   },
//   row: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   primaryBtn: {
//     flex: 1,
//     height: 40,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1976d2',
//   },
//   secondaryBtn: {
//     flex: 1,
//     height: 40,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#1976d2',
//     backgroundColor: '#fff',
//   },
//   editBtn: {
//     flex: 1,
//     height: 36,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#2e7d32',
//   },
//   deleteBtn: {
//     flex: 1,
//     height: 36,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#d32f2f',
//   },
//   removeBtn: {
//     height: 34,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#d32f2f',
//   },
//   actionText: {
//     color: '#fff',
//     fontWeight: '700',
//   },
//   secondaryText: {
//     color: '#1976d2',
//     fontWeight: '700',
//   },
//   mutedText: {
//     opacity: 0.7,
//     fontSize: 13,
//   },
//   itemCard: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     gap: 8,
//   },
//   periodText: {
//     fontSize: 13,
//     opacity: 0.9,
//   },
//   disabled: {
//     opacity: 0.65,
//   },
// });

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, Text } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';

// --- ERP BRANDING PALETTE ---
const PALETTE = {
  primary: '#303841',
  accent: '#76ABAE',
  cta: '#FF5722',
  background: '#F5F5F5',
  border: '#E6E6E6',
  surface: '#FFFFFF',
  textBody: '#5D646B',
  textHeading: '#303841',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F9A825',
};

type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface ClassItem {
  _id: string;
  name: string;
  grade?: string | number;
  section?: string;
}

interface SubjectItem {
  _id: string;
  name: string;
  code?: string;
}

interface PeriodItem {
  subject: string;
  startTime: string;
  endTime: string;
  hour?: number;
}

interface TimeTableItem {
  _id: string;
  name?: string;
  day: DayName;
  class?: ClassItem | string;
  classId?: string;
  periods: Array<
    PeriodItem & {
      subject?: SubjectItem | string;
      _id?: string;
    }
  >;
}

const DAYS: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getRole = (role: unknown) => {
  if (typeof role === 'string') return role;
  if (role && typeof role === 'object' && 'role' in role) {
    const value = (role as { role?: string }).role;
    return value || '';
  }
  return '';
};

// Helper for parsing times from HH:MM string to Date object
const parseTimeStr = (timeStr: string) => {
  if (!timeStr) return new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper for formatting Date object to HH:MM string
const formatTimeStr = (date: Date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export default function TimeTableTab() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = getRole(user?.role) === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [items, setItems] = useState<TimeTableItem[]>([]);

  const [name, setName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayName>('Monday');
  const [periods, setPeriods] = useState<PeriodItem[]>([{ subject: '', startTime: '', endTime: '', hour: 1 }]);

  // Time Picker States
  const [activePicker, setActivePicker] = useState<{ index: number; type: 'start' | 'end' } | null>(null);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      return;
    }

    void loadSubjectsForClass(selectedClassId);
  }, [selectedClassId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classResponse, timetableResponse] = await Promise.all([
        apiService.getClasses(),
        apiService.getAllTimetables(),
      ]);

      if (!classResponse.success) {
        throw new Error(classResponse.msg || 'Failed to load classes');
      }
      if (!timetableResponse.success) {
        throw new Error(timetableResponse.msg || 'Failed to load timetables');
      }

      setClasses(Array.isArray(classResponse.data) ? (classResponse.data as unknown as ClassItem[]) : []);
      setItems(Array.isArray(timetableResponse.data) ? (timetableResponse.data as unknown as TimeTableItem[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectsForClass = async (classId: string) => {
    try {
      const response = await apiService.getSubjectsByClass(classId);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to load subjects');
      }
      setSubjects(Array.isArray(response.data) ? (response.data as unknown as SubjectItem[]) : []);
    } catch (err) {
      setSubjects([]);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load subjects');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSelectedClassId(null);
    setSelectedDay('Monday');
    setPeriods([{ subject: '', startTime: '', endTime: '', hour: 1 }]);
    setSubjects([]);
  };

  const updatePeriod = (index: number, patch: Partial<PeriodItem>) => {
    setPeriods((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addPeriodRow = () => {
    setPeriods((prev) => [...prev, { subject: '', startTime: '', endTime: '', hour: prev.length + 1 }]);
  };

  const removePeriodRow = (index: number) => {
    setPeriods((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, hour: idx + 1 })));
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (!selectedDate || event.type === 'dismissed' || !activePicker) {
      return;
    }

    const timeStr = formatTimeStr(selectedDate);
    const { index, type } = activePicker;

    updatePeriod(index, type === 'start' ? { startTime: timeStr } : { endTime: timeStr });
  };

  const onSubmit = async () => {
    if (!isAdmin) {
      Alert.alert('Access denied', 'Only admin can create or update timetable.');
      return;
    }

    if (!name.trim() || !selectedClassId || !selectedDay) {
      Alert.alert('Validation Error', 'Name, class and day are required.');
      return;
    }

    if (periods.length === 0 || periods.some((p) => !p.subject || !p.startTime || !p.endTime)) {
      Alert.alert('Validation Error', 'Each period must have subject, start time and end time.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        classId: selectedClassId,
        day: selectedDay,
        periods: periods.map((item, idx) => ({
          subject: item.subject,
          startTime: item.startTime,
          endTime: item.endTime,
          hour: item.hour || idx + 1,
        })),
      };

      if (isEditing && editingId) {
        const response = await apiService.updateTimetable(editingId, payload);
        if (!response.success) throw new Error(response.msg || 'Failed to update timetable');
        Alert.alert('Success', 'Timetable updated successfully.');
      } else {
        const response = await apiService.createTimetable(payload);
        if (!response.success) throw new Error(response.msg || 'Failed to create timetable');
        Alert.alert('Success', 'Timetable created successfully.');
      }

      resetForm();
      await loadAll();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!isAdmin) {
      Alert.alert('Access denied', 'Only admin can delete timetable.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.deleteTimetable(id);
      if (!response.success) throw new Error(response.msg || 'Failed to delete timetable');
      Alert.alert('Success', 'Timetable deleted successfully.');
      await loadAll();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete timetable');
    } finally {
      setSaving(false);
    }
  };

  const getClassId = (item: TimeTableItem) => {
    if (item.classId) return item.classId;
    if (item.class && typeof item.class === 'object') return item.class._id;
    if (typeof item.class === 'string') return item.class;
    return null;
  };

  const onEdit = async (item: TimeTableItem) => {
    const classId = getClassId(item);
    setEditingId(item._id);
    setName(item.name || '');
    setSelectedDay(item.day || 'Monday');
    setSelectedClassId(classId);

    if (classId) {
      await loadSubjectsForClass(classId);
    }

    const normalizedPeriods = (item.periods || []).map((period, idx) => ({
      subject:
        typeof period.subject === 'string'
          ? period.subject
          : period.subject && typeof period.subject === 'object'
            ? period.subject._id
            : period.subject || '',
      startTime: period.startTime || '',
      endTime: period.endTime || '',
      hour: period.hour || idx + 1,
    }));

    setPeriods(normalizedPeriods.length > 0 ? normalizedPeriods : [{ subject: '', startTime: '', endTime: '', hour: 1 }]);
  };

  const classLabel = (cls: ClassItem) => {
    const section = cls.section ? ` (${cls.section})` : '';
    const grade = cls.grade !== undefined && cls.grade !== null ? ` Grade ${cls.grade}` : '';
    return `${cls.name}${section}${grade}`;
  };

  const getClassNameFromItem = (item: TimeTableItem) => {
    if (item.class && typeof item.class === 'object') {
      const part = item.class.name || 'Class';
      return `${part}${item.class.section ? ` (${item.class.section})` : ''}`;
    }
    const classId = getClassId(item);
    const cls = classes.find((c) => c._id === classId);
    return cls ? classLabel(cls) : 'Class';
  };

  const getSubjectName = (subjectValue: unknown) => {
    if (subjectValue && typeof subjectValue === 'object' && '_id' in subjectValue) {
      const data = subjectValue as { _id: string; name?: string; code?: string };
      return data.name || data.code || 'Subject';
    }
    if (typeof subjectValue === 'string') {
      const found = subjects.find((sub) => sub._id === subjectValue);
      return found ? found.name : 'Subject';
    }
    return 'Subject';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isAdmin ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{isEditing ? 'Edit Timetable' : 'Create Timetable'}</Text>

          <View style={styles.fieldGap}>
            <Text style={styles.inputLabel}>Timetable Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Science Batch A"
              placeholderTextColor={PALETTE.textBody}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.inputLabel}>Select Day</Text>
            <View style={styles.chipsWrap}>
              {DAYS.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: isSelected ? PALETTE.primary : PALETTE.surface,
                        borderColor: isSelected ? PALETTE.primary : PALETTE.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <Text style={[styles.chipText, { color: isSelected ? PALETTE.surface : PALETTE.textHeading }]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGap}>
            <Text style={styles.inputLabel}>Select Class</Text>
            <View style={styles.chipsWrap}>
              {classes.length === 0 ? (
                <Text style={styles.mutedText}>No classes found.</Text>
              ) : (
                classes.map((cls) => {
                  const isSelected = selectedClassId === cls._id;
                  return (
                    <Pressable
                      key={cls._id}
                      onPress={() => setSelectedClassId(cls._id)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: isSelected ? PALETTE.primary : PALETTE.surface,
                          borderColor: isSelected ? PALETTE.primary : PALETTE.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}>
                      <Text style={[styles.chipText, { color: isSelected ? PALETTE.surface : PALETTE.textHeading }]}>
                        {classLabel(cls)}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>

          <View style={[styles.fieldGap, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>Periods</Text>
            {periods.map((period, index) => (
              <View key={`period-${index}`} style={styles.periodCard}>
                <Text style={styles.periodTitle}>Period {index + 1}</Text>

                <View style={styles.fieldGap}>
                  <Text style={styles.inputLabel}>Select Subject</Text>
                  <View style={styles.chipsWrap}>
                    {subjects.length === 0 ? (
                      <Text style={styles.mutedText}>Select a class above to load subjects.</Text>
                    ) : (
                      subjects.map((subject) => {
                        const isSelected = period.subject === subject._id;
                        return (
                          <Pressable
                            key={subject._id}
                            onPress={() => updatePeriod(index, { subject: subject._id })}
                            style={({ pressed }) => [
                              styles.chip,
                              {
                                backgroundColor: isSelected ? PALETTE.accent : PALETTE.surface,
                                borderColor: isSelected ? PALETTE.accent : PALETTE.border,
                                opacity: pressed ? 0.8 : 1,
                              },
                            ]}>
                            <Text style={[styles.chipText, { color: isSelected ? PALETTE.surface : PALETTE.textHeading }]}>
                              {subject.name}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <Pressable 
                      style={({ pressed }) => [styles.input, styles.timeInput, pressed && styles.pressedOpacity]}
                      onPress={() => !saving && setActivePicker({ index, type: 'start' })}
                    >
                      <Text style={[styles.timeText, !period.startTime && { color: PALETTE.textBody }]}>
                        {period.startTime || 'Select time...'}
                      </Text>
                    </Pressable>
                  </View>
                  
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <Pressable 
                      style={({ pressed }) => [styles.input, styles.timeInput, pressed && styles.pressedOpacity]}
                      onPress={() => !saving && setActivePicker({ index, type: 'end' })}
                    >
                      <Text style={[styles.timeText, !period.endTime && { color: PALETTE.textBody }]}>
                        {period.endTime || 'Select time...'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {periods.length > 1 ? (
                  <Pressable 
                    style={({ pressed }) => [styles.removeBtn, pressed && styles.pressedOpacity]} 
                    onPress={() => removePeriodRow(index)} 
                    disabled={saving}
                  >
                    <Text style={styles.actionTextWhite}>Remove Period</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            {activePicker && (
              <DateTimePicker
                value={
                  activePicker.type === 'start' && periods[activePicker.index]?.startTime
                    ? parseTimeStr(periods[activePicker.index].startTime)
                    : activePicker.type === 'end' && periods[activePicker.index]?.endTime
                    ? parseTimeStr(periods[activePicker.index].endTime)
                    : new Date()
                }
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>

          <View style={styles.actionRow}>
            <Pressable 
              style={({ pressed }) => [styles.secondaryBtn, (saving || pressed) && styles.pressedOpacity]} 
              onPress={addPeriodRow} 
              disabled={saving}
            >
              <Text style={styles.secondaryText}>+ Add Period</Text>
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            {isEditing ? (
              <Pressable 
                style={({ pressed }) => [styles.secondaryBtn, { flex: 1 }, pressed && styles.pressedOpacity]} 
                onPress={resetForm} 
                disabled={saving}
              >
                <Text style={styles.secondaryText}>Cancel Edit</Text>
              </Pressable>
            ) : null}
            <Pressable 
              style={({ pressed }) => [styles.primaryBtn, { flex: 1 }, (saving || pressed) && styles.pressedOpacity]} 
              onPress={onSubmit} 
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionTextWhite}>{isEditing ? 'Update Timetable' : 'Create Timetable'}</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.readOnlyCard}>
          <Text style={styles.mutedText}>Read-only access: Timetable creation, editing, and deletion are restricted to administrators.</Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>All Timetables</Text>
      
      {items.length === 0 ? (
        <Text style={styles.mutedText}>No timetable found.</Text>
      ) : (
        items.map((item) => (
          <View key={item._id} style={styles.itemCard}>
            <View>
              <Text style={styles.itemTitle}>{item.name || 'Timetable'} | {item.day}</Text>
              <Text style={styles.itemMeta}>Class: {getClassNameFromItem(item)}</Text>
            </View>

            <View style={styles.periodsList}>
              {(item.periods || []).map((period, idx) => (
                <Text key={`${item._id}-p-${idx}`} style={styles.periodText}>
                  <Text style={styles.periodIndex}>{idx + 1}.</Text> {getSubjectName(period.subject)} | {period.startTime} - {period.endTime}
                </Text>
              ))}
            </View>

            {isAdmin ? (
              <View style={styles.actionRow}>
                <Pressable 
                  style={({ pressed }) => [styles.editBtn, pressed && styles.pressedOpacity]} 
                  onPress={() => void onEdit(item)} 
                  disabled={saving}
                >
                  <Text style={styles.actionTextWhite}>Edit</Text>
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressedOpacity]} 
                  onPress={() => void onDelete(item._id)} 
                  disabled={saving}
                >
                  <Text style={styles.actionTextWhite}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.background,
  },
  pressedOpacity: {
    opacity: 0.8,
  },

  /* TEXT & TYPOGRAPHY */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textHeading,
    marginBottom: 4,
  },
  mutedText: {
    fontSize: 13,
    color: PALETTE.textBody,
  },
  errorText: {
    color: PALETTE.error,
    fontSize: 13,
    fontWeight: '600',
  },

  /* CARDS */
  formCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    gap: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  readOnlyCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
  },
  periodCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 12,
    backgroundColor: PALETTE.background,
    borderColor: PALETTE.border,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    gap: 12,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  /* FORMS */
  fieldGap: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: PALETTE.background,
    borderColor: PALETTE.border,
    color: PALETTE.textHeading,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    color: PALETTE.textHeading,
  },

  /* CHIPS */
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* BUTTONS & ACTIONS */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.cta,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
  },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.success,
  },
  deleteBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.error,
  },
  removeBtn: {
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.1)', // Soft red
    borderWidth: 1,
    borderColor: PALETTE.error,
  },
  actionTextWhite: {
    color: PALETTE.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryText: {
    color: PALETTE.textHeading,
    fontWeight: '700',
    fontSize: 13,
  },

  /* TIMETABLE DISPLAY */
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  itemMeta: {
    fontSize: 13,
    color: PALETTE.textBody,
    marginTop: 2,
  },
  periodsList: {
    gap: 4,
    marginTop: 4,
  },
  periodText: {
    fontSize: 14,
    color: PALETTE.textHeading,
  },
  periodIndex: {
    fontWeight: '700',
  }
});