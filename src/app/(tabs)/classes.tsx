// import { useEffect, useMemo, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Modal,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   View,
// } from 'react-native';
// import { useRouter } from 'expo-router';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';
// import { Subject } from '@/src/types';


// type IdLabel = { _id: string; name: string; subtitle?: string };

// interface ClassItem {
//   _id: string;
//   name: string;
//   grade?: string;
//   section?: string;
//   room?: string;
//   capacity?: number;
//   students?: Array<{ _id: string }>;
//   subjects?: Array<{ _id: string; name?: string }>;
//   classTeacher?: {
//     _id: string;
//     user?: { _id: string; name?: string; email?: string };
//   };
//   studentCount?: number;
// }

// interface TeacherItem {
//   _id: string;
//   user?: { _id: string; name?: string; email?: string };
// }

// const getSubjectSubtitle = (subject: Subject) => {
//   const className = typeof subject.class === 'object' ? subject.class?.name : subject.class;
//   const teacherName =
//     typeof subject.teacher === 'object'
//       ? subject.teacher?.name || undefined
//       : subject.teacher;

//   const parts = [
//     subject.code ? `Code: ${subject.code}` : '',
//     className ? `Class: ${className}` : '',
//     teacherName ? `Teacher: ${teacherName}` : '',
//     typeof subject.maxMarks === 'number' ? `Max Marks: ${subject.maxMarks}` : '',
//   ].filter(Boolean);

//   return parts.join(' • ');
// };

// export default function ClassesTab() {
//   const router = useRouter();
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
//   const isDark = colorScheme === 'dark';
//   const cardBg = isDark ? '#111827' : '#FFFFFF';
//   const surfaceBg = isDark ? '#0B1220' : '#F9FAFB';
//   const textColor = isDark ? '#F9FAFB' : '#111827';
//   const mutedColor = isDark ? '#9CA3AF' : '#6B7280';
//   const borderColor = isDark ? '#334155' : '#D1D5DB';
//   const addClassButtonBg = isDark ? '#2563EB' : theme.tint;
//   const user = useAuthStore((state) => state.user);
//   const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
//   const isAdmin = role === 'admin';

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [classes, setClasses] = useState<ClassItem[]>([]);
//   const [teachers, setTeachers] = useState<TeacherItem[]>([]);
//   const [subjects, setSubjects] = useState<Subject[]>([]);

//   const [newClassName, setNewClassName] = useState('');
//   const [newClassGrade, setNewClassGrade] = useState('');
//   const [newClassSection, setNewClassSection] = useState('');
//   const [newClassCapacity, setNewClassCapacity] = useState('40');
//   const [newClassRoom, setNewClassRoom] = useState('R001');

//   const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<string | null>(null);
//   const [selectedTeacherForClass, setSelectedTeacherForClass] = useState<string | null>(null);

//   const [subjectName, setSubjectName] = useState('');
//   const [subjectCode, setSubjectCode] = useState('');
//   const [subjectMaxMarks, setSubjectMaxMarks] = useState('100');
//   const [selectedClassForSubject, setSelectedClassForSubject] = useState<string | null>(null);
//   const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState<string | null>(null);

//   const [selectedClassForExistingSubject, setSelectedClassForExistingSubject] = useState<string | null>(null);
//   const [selectedExistingSubject, setSelectedExistingSubject] = useState<string | null>(null);
//   const [pickerState, setPickerState] = useState<{
//     title: string;
//     options: IdLabel[];
//     value: string | null;
//     onPick: (id: string) => void;
//   } | null>(null);

//   useEffect(() => {
//     void fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [classResponse, teacherResponse , subjectResponse] = await Promise.all([
//         apiService.getClasses(),
//         apiService.getTeachers(),
//         apiService.getAllSubjects()
//       ]);

//       if (!classResponse.success) {
//         throw new Error(classResponse.msg || 'Failed to fetch classes');
//       }
//       if (!teacherResponse.success) {
//         throw new Error(teacherResponse.msg || 'Failed to fetch teachers');
//       }
//       if (!subjectResponse.success) {
//         throw new Error(subjectResponse.msg || 'Failed to fetch subjects');
//       }
//       setClasses((classResponse.data as ClassItem[]) || []);
//       setTeachers((teacherResponse.data as TeacherItem[]) || []);
//       setSubjects((subjectResponse.data as Subject[]) || []);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     try {
//       setRefreshing(true);
//       setError(null);

//       const [classResponse, teacherResponse, subjectResponse] = await Promise.all([
//         apiService.getClasses(),
//         apiService.getTeachers(),
//         apiService.getAllSubjects()
//       ]);

//       if (!classResponse.success) {
//         throw new Error(classResponse.msg || 'Failed to fetch classes');
//       }
//       if (!teacherResponse.success) {
//         throw new Error(teacherResponse.msg || 'Failed to fetch teachers');
//       }
//       if (!subjectResponse.success) {
//         throw new Error(subjectResponse.msg || 'Failed to fetch subjects');
//       }
//       setClasses((classResponse.data as ClassItem[]) || []);
//       setTeachers((teacherResponse.data as TeacherItem[]) || []);
//       setSubjects((subjectResponse.data as Subject[]) || []);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const teacherOptions: IdLabel[] = useMemo(
//     () =>
//       teachers
//         .map((teacher) => ({ _id: teacher._id, name: teacher.user?.name || 'Unnamed teacher' }))
//         .sort((a, b) => a.name.localeCompare(b.name)),
//     [teachers]
//   );

//   const classOptions: IdLabel[] = useMemo(
//     () =>
//       classes
//         .map((cls) => ({
//           _id: cls._id,
//           name: `${cls.name}${cls.section ? ` (${cls.section})` : ''}`,
//         }))
//         .sort((a, b) => a.name.localeCompare(b.name)),
//     [classes]
//   );

//   const subjectOptions: IdLabel[] = useMemo(() => {
//     const map = new Map<string, string>();
//     const subtitleMap = new Map<string, string>();

//     subjects.forEach((subject) => {
//         if (subject._id && subject.name) {
//           map.set(subject._id, subject.name);
//           subtitleMap.set(subject._id, getSubjectSubtitle(subject));
//         }
//       });
//     return Array.from(map.entries()).map(([id, name]) => ({
//       _id: id,
//       name,
//       subtitle: subtitleMap.get(id),
//     }));
//   }, [subjects]);

//   const createClass = async () => {
//     if (!newClassName.trim() || !newClassGrade.trim() || !newClassSection.trim()) {
//       Alert.alert('Missing fields', 'Name, Grade and Section are required.');
//       return; 
//     }

//     try {
//       setSaving(true);
//       const response = await apiService.createClass({
//         name: newClassName.trim(),
//         grade: newClassGrade.trim(),
//         section: newClassSection.trim(),
//         capacity: Number(newClassCapacity || '40'),
//         room: newClassRoom.trim() || 'R001',
//       });

//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to create class');
//       }

//       setNewClassName('');
//       setNewClassGrade('');
//       setNewClassSection('');
//       setNewClassCapacity('40');
//       setNewClassRoom('R001');
//       await fetchData();
//       Alert.alert('Success', 'Class created successfully.');
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create class');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const assignTeacher = async () => {
//     if (!selectedClassForTeacher || !selectedTeacherForClass) {
//       Alert.alert('Missing selection', 'Please select class and teacher.');
//       return;
//     }

//     try {
//       setSaving(true);
//       const response = await apiService.assignClassTeacher(selectedClassForTeacher, selectedTeacherForClass);
//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to assign class teacher');
//       }
//       await fetchData();
//       Alert.alert('Success', 'Teacher assigned to class.');
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign teacher');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const addSubjectInClass = async () => {
//     if (!subjectName.trim() || !subjectCode.trim() || !selectedClassForSubject || !selectedTeacherForSubject) {
//       Alert.alert('Missing fields', 'Subject name, code, class, and teacher are required.');
//       return;
//     }

//     try {
//       setSaving(true);
//       const response = await apiService.createSubject({
//         name: subjectName.trim(),
//         code: subjectCode.trim(),
//         classId: selectedClassForSubject,
//         teacherId: selectedTeacherForSubject,
//         maxMarks: Number(subjectMaxMarks || '100'),
//       });
//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to create subject');
//       }

//       setSubjectName('');
//       setSubjectCode('');
//       setSubjectMaxMarks('100');
//       await fetchData();
//       Alert.alert('Success', 'Subject added in class.');
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add subject');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const assignExistingSubject = async () => {
//     if (!selectedClassForExistingSubject || !selectedExistingSubject) {
//       Alert.alert('Missing selection', 'Please select class and subject.');
//       return;
//     }

//     try {
//       setSaving(true);
//       const response = await apiService.assignSubjectToClass(
//         selectedExistingSubject,
//         selectedClassForExistingSubject
//       );
//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to assign subject to class');
//       }
//       await fetchData();
//       Alert.alert('Success', 'Subject assigned to class.');
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign subject');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const openPicker = (title: string, options: IdLabel[], value: string | null, onPick: (id: string) => void) => {
//     setPickerState({ title, options, value, onPick });
//   };

//   const closePicker = () => setPickerState(null);

//   const renderDropdown = (
//     title: string,
//     options: IdLabel[],
//     value: string | null,
//     onPick: (id: string) => void,
//     placeholder: string,
//   ) => {
//     const selectedLabel = options.find((item) => item._id === value)?.name || placeholder;

//     return (
//       <Pressable
//         style={[styles.dropdownButton, { borderColor: theme.icon, backgroundColor: theme.background }]}
//         onPress={() => openPicker(title, options, value, onPick)}>
//         <View style={styles.dropdownLabelWrap}>
//           <ThemedText style={styles.dropdownText}>{selectedLabel}</ThemedText>
//           {options.find((item) => item._id === value)?.subtitle ? (
//             <ThemedText style={styles.dropdownSubtitle} numberOfLines={1}>
//               {options.find((item) => item._id === value)?.subtitle}
//             </ThemedText>
//           ) : null}
//         </View>
//         <ThemedText style={styles.dropdownArrow}>⌄</ThemedText>
//       </Pressable>
//     );
//   };

//   if (loading) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ActivityIndicator size="large" color={theme.tint} />
//       </ThemedView>
//     );
//   }

//   return (
//     <ScrollView 
//       style={[styles.container, { backgroundColor: theme.background }]} 
//       contentContainerStyle={styles.content}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           tintColor={theme.tint}
//         />
//       }>

//       {error ? (
//         <ThemedView style={styles.errorBox}>
//           <ThemedText style={styles.errorText}>{error}</ThemedText>
//         </ThemedView>
//       ) : null}

//       <ThemedView style={[styles.section, { borderColor, backgroundColor: cardBg }]}> 
//         <ThemedText type="subtitle">All Classes</ThemedText>
//         {classes.length === 0 ? (
//           <ThemedText style={[styles.mutedText, { color: mutedColor }]}>No classes found</ThemedText>
//         ) : (
//           <FlatList
//             data={classes}
//             horizontal={true}
//             keyExtractor={(cls) => cls._id}
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.classListContainer}
//             renderItem={({ item: cls }) => (
//               <Pressable
//                 onPress={() => router.push(`/class-details/${cls._id}`)}
//                 style={[styles.classCard, { borderColor, backgroundColor: cardBg }]}>
//                 <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
//                   {cls.name}{cls.section ? ` (${cls.section})` : ''}
//                 </ThemedText>
//                 <ThemedText style={[styles.mutedText, { color: mutedColor }]}>Grade: {cls.grade || 'N/A'} | Room: {cls.room || 'N/A'}</ThemedText>
//                 <ThemedText style={[styles.mutedText, { color: mutedColor }]}>Students: {cls.studentCount || 0}</ThemedText>
//                 <ThemedText style={[styles.mutedText, { color: mutedColor }]}>Teacher: {cls.classTeacher?.user?.name || 'Not assigned'}</ThemedText>
//                 <ThemedText style={[styles.mutedText, { color: mutedColor }]}>Subjects: {(cls.subjects || []).map((s) => s.name).filter(Boolean).join(', ') || 'None'}</ThemedText>
//               </Pressable>
//             )}
//           />
//         )}
//       </ThemedView>

//       {isAdmin ? (
//         <>
//           <ThemedView style={[styles.section, { borderColor, backgroundColor: cardBg }]}> 
//             <ThemedText type="subtitle">Add New Class</ThemedText>
//             <ThemedText style={styles.inputLabel}>Class Name</ThemedText>
//             <TextInput placeholder="Class Name" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} value={newClassName} onChangeText={setNewClassName} />
//             <ThemedText style={styles.inputLabel}>Grade</ThemedText>
//             <TextInput placeholder="Grade" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} value={newClassGrade} onChangeText={setNewClassGrade} />
//             <ThemedText style={styles.inputLabel}>Section</ThemedText>
//             <TextInput placeholder="Section" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} value={newClassSection} onChangeText={setNewClassSection} />
//             <ThemedText style={styles.inputLabel}>Capacity</ThemedText>
//             <TextInput placeholder="Capacity" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} keyboardType="numeric" value={newClassCapacity} onChangeText={setNewClassCapacity} />
//             <ThemedText style={styles.inputLabel}>Room</ThemedText>
//             <TextInput placeholder="Room" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} value={newClassRoom} onChangeText={setNewClassRoom} />
//             <Pressable style={[styles.actionButton, { backgroundColor: addClassButtonBg }]} onPress={createClass} disabled={saving}>
//               <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Create Class'}</ThemedText>
//             </Pressable>
//           </ThemedView>

//           <ThemedView style={[styles.section, { borderColor, backgroundColor: cardBg }]}> 
//             <ThemedText type="subtitle">Add Class Teacher</ThemedText>
//             <ThemedText style={styles.label}>Select Class</ThemedText>
//             {renderDropdown('Select Class', classOptions, selectedClassForTeacher, setSelectedClassForTeacher, 'Select class')}
//             <ThemedText style={styles.label}>Select Teacher</ThemedText>
//             {renderDropdown('Select Teacher', teacherOptions, selectedTeacherForClass, setSelectedTeacherForClass, 'Select teacher')}
//             <Pressable style={[styles.actionButton, { backgroundColor: '#2e7d32' }]} onPress={assignTeacher} disabled={saving}>
//               <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Assign Teacher'}</ThemedText>
//             </Pressable>
//           </ThemedView>

//           <ThemedView style={[styles.section, { borderColor, backgroundColor: cardBg }]}> 
//             <ThemedText type="subtitle">Add Subject in Class</ThemedText>
//             <ThemedText style={styles.inputLabel}>Subject Name</ThemedText>
//             <TextInput placeholder="Subject Name" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} value={subjectName} onChangeText={setSubjectName} />
//             <ThemedText style={styles.inputLabel}>Subject Code</ThemedText>
//             <TextInput placeholder="Subject Code" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} value={subjectCode} onChangeText={setSubjectCode} />
//             <ThemedText style={styles.inputLabel}>Maximum Marks</ThemedText>
//             <TextInput placeholder="Max Marks" placeholderTextColor={mutedColor} selectionColor={theme.tint} style={[styles.input, { color: textColor, backgroundColor: surfaceBg, borderColor }]} keyboardType="numeric" value={subjectMaxMarks} onChangeText={setSubjectMaxMarks} />
//             <ThemedText style={styles.label}>Select Class</ThemedText>
//             {renderDropdown('Select Class', classOptions, selectedClassForSubject, setSelectedClassForSubject, 'Select class')}
//             <ThemedText style={styles.label}>Select Teacher</ThemedText>
//             {renderDropdown('Select Teacher', teacherOptions, selectedTeacherForSubject, setSelectedTeacherForSubject, 'Select teacher')}
//             <Pressable style={[styles.actionButton, { backgroundColor: '#1565c0' }]} onPress={addSubjectInClass} disabled={saving}>
//               <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Add Subject'}</ThemedText>
//             </Pressable>
//           </ThemedView>

//           <ThemedView style={[styles.section, { borderColor, backgroundColor: cardBg }]}> 
//             <ThemedText type="subtitle">Assign Existing Subject to Class</ThemedText>
//             <ThemedText style={styles.label}>Select Subject</ThemedText>
//             {renderDropdown('Select Subject', subjectOptions, selectedExistingSubject, setSelectedExistingSubject, 'Select subject')}
//             <ThemedText style={styles.label}>Select Class</ThemedText>
//             {renderDropdown('Select Class', classOptions, selectedClassForExistingSubject, setSelectedClassForExistingSubject, 'Select class')}
//             <Pressable style={[styles.actionButton, { backgroundColor: '#6a1b9a' }]} onPress={assignExistingSubject} disabled={saving}>
//               <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Assign Subject'}</ThemedText>
//             </Pressable>
//           </ThemedView>
//         </>
//       ) : null}

//       <Modal visible={!!pickerState} transparent animationType="fade" onRequestClose={closePicker}>
//         <Pressable style={styles.modalOverlay} onPress={closePicker}>
//           <Pressable style={[styles.modalCard, { backgroundColor: cardBg }]} onPress={() => undefined}>
//             <ThemedText type="subtitle" style={{ color: textColor }}>{pickerState?.title}</ThemedText>
//             {pickerState?.options.length ? (
//               <FlatList
//                 data={pickerState.options}
//                 keyExtractor={(item) => item._id}
//                 renderItem={({ item }) => {
//                   const selected = item._id === pickerState.value;
//                   return (
//                     <Pressable
//                       style={[
//                         styles.modalItem,
//                         selected && { backgroundColor: theme.tint },
//                       ]}
//                       onPress={() => {
//                         pickerState.onPick(item._id);
//                         closePicker();
//                       }}>
//                       <ThemedText style={[styles.modalItemText, { color: textColor }, selected && styles.modalItemTextSelected]}>{item.name}</ThemedText>
//                       {item.subtitle ? (
//                         <ThemedText style={[styles.modalItemSubtitle, { color: mutedColor }, selected && styles.modalItemTextSelected]} numberOfLines={2}>
//                           {item.subtitle}
//                         </ThemedText>
//                       ) : null}
//                     </Pressable>
//                   );
//                 }}
//               />
//             ) : (
//               <ThemedText style={styles.mutedText}>No options found</ThemedText>
//             )}
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </ScrollView>
//   );
// }



// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },

//   content: {
//     padding: 16,
//     gap: 16,
//     paddingBottom: 50,
//   },

//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   section: {
//     borderRadius: 16,
//     padding: 16,
//     gap: 10,
//     elevation: 4,
//   },

//   input: {
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 14,
//   },

//   actionButton: {
//     borderRadius: 12,
//     alignItems: 'center',
//     paddingVertical: 14,
//     marginTop: 8,
//   },

//   actionText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//   },

//   label: {
//     fontSize: 12,
//     fontWeight: '700',
//     marginTop: 8,
//   },

//   inputLabel: {
//     fontSize: 12,
//     fontWeight: '700',
//     marginTop: 6,
//   },

//   chipsWrap: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   dropdownButton: {
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   dropdownText: {
//     flex: 1,
//   },
//   dropdownLabelWrap: {
//     flex: 1,
//     gap: 2,
//   },
//   dropdownSubtitle: {
//     fontSize: 11,
//     opacity: 0.7,
//   },
//   dropdownArrow: {
//     fontSize: 18,
//     marginLeft: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent: 'flex-end',
//   },
//   modalCard: {
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 16,
//     maxHeight: '70%',
//     gap: 10,
//   },
//   modalItem: {
//     borderRadius: 12,
//     paddingVertical: 14,
//     paddingHorizontal: 12,
//     marginTop: 8,
//     backgroundColor: '#F9FAFB',
//   },
//   modalItemText: {
//     fontWeight: '600',
//   },
//   modalItemSubtitle: {
//     marginTop: 4,
//     fontSize: 11,
//     opacity: 0.75,
//   },
//   modalItemTextSelected: {
//     color: '#fff',
//   },

//   classListContainer: {
//     paddingRight: 16,
//     gap: 10,
//   },

//   classCard: {
//     borderRadius: 18,
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//     width: 248,
//     minWidth: 248,
//     gap: 5,
//     borderWidth: 1,
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 5,
//   },

//   mutedText: {
//     fontSize: 12,
//     opacity: 0.7,
//   },

//   errorBox: {
//     borderRadius: 12,
//     padding: 12,
//     backgroundColor: 'rgba(239,68,68,0.1)',
//   },

//   errorText: {
//     color: '#EF4444',
//     fontWeight: '500',
//   },
// });


// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   content: {
// //     padding: 16,
// //     gap: 14,
// //     paddingBottom: 40,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   subtitle: {
// //     marginTop: 6,
// //     opacity: 0.75,
// //     marginBottom: 4,
// //   },
// //   section: {
// //     borderWidth: 1,
// //     borderRadius: 12,
// //     padding: 12,
// //     gap: 8,
// //   },
// //   input: {
// //     borderWidth: 1,
// //     borderColor: '#c9c9c9',
// //     borderRadius: 10,
// //     paddingHorizontal: 12,
// //     paddingVertical: 10,
// //     color: '#111',
// //     backgroundColor: '#fff',
// //     fontSize: 14,
// //   },
// //   actionButton: {
// //     borderRadius: 10,
// //     alignItems: 'center',
// //     paddingVertical: 10,
// //     marginTop: 4,
// //   },
// //   actionText: {
// //     color: '#fff',
// //     fontWeight: '700',
// //   },
// //   label: {
// //     fontSize: 12,
// //     fontWeight: '700',
// //     opacity: 0.8,
// //     marginTop: 6,
// //   },
// //   inputLabel: {
// //     fontSize: 12,
// //     fontWeight: '700',
// //     opacity: 0.8,
// //     marginTop: 4,
// //   },
// //   chipsWrap: {
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //     gap: 8,
// //   },
// //   chip: {
// //     borderWidth: 1,
// //     borderRadius: 999,
// //     paddingHorizontal: 10,
// //     paddingVertical: 6,
// //   },
// //   classListContainer: {
// //     paddingRight: 16,
// //     gap: 10,
// //   },
// //   classCard: {
// //     borderWidth: 1,
// //     borderRadius: 10,
// //     padding: 10,
// //     marginTop: 8,
// //     width: 280,
// //     minWidth: 280,
// //     gap: 4,
// //   },
// //   mutedText: {
// //     fontSize: 12,
// //     opacity: 0.75,
// //   },
// //   errorBox: {
// //     borderRadius: 10,
// //     padding: 10,
// //     backgroundColor: 'rgba(255, 107, 107, 0.12)',
// //   },
// //   errorText: {
// //     color: '#ff6b6b',
// //   },
// // });

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import { Subject } from '@/src/types';

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

type IdLabel = { _id: string; name: string; subtitle?: string };

interface ClassItem {
  _id: string;
  name: string;
  grade?: string;
  section?: string;
  room?: string;
  capacity?: number;
  students?: Array<{ _id: string }>;
  subjects?: Array<{ _id: string; name?: string }>;
  classTeacher?: {
    _id: string;
    user?: { _id: string; name?: string; email?: string };
  };
  studentCount?: number;
}

interface TeacherItem {
  _id: string;
  user?: { _id: string; name?: string; email?: string };
}

const getSubjectSubtitle = (subject: Subject) => {
  const className = typeof subject.class === 'object' ? subject.class?.name : subject.class;
  const teacherName =
    typeof subject.teacher === 'object'
      ? subject.teacher?.name || undefined
      : subject.teacher;

  const parts = [
    subject.code ? `Code: ${subject.code}` : '',
    className ? `Class: ${className}` : '',
    teacherName ? `Teacher: ${teacherName}` : '',
    typeof subject.maxMarks === 'number' ? `Max Marks: ${subject.maxMarks}` : '',
  ].filter(Boolean);

  return parts.join(' • ');
};

export default function ClassesTab() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const isAdmin = role === 'admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('40');
  const [newClassRoom, setNewClassRoom] = useState('R001');

  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<string | null>(null);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState<string | null>(null);

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectMaxMarks, setSubjectMaxMarks] = useState('100');
  const [selectedClassForSubject, setSelectedClassForSubject] = useState<string | null>(null);
  const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState<string | null>(null);

  const [selectedClassForExistingSubject, setSelectedClassForExistingSubject] = useState<string | null>(null);
  const [selectedExistingSubject, setSelectedExistingSubject] = useState<string | null>(null);
  
  const [pickerState, setPickerState] = useState<{
    title: string;
    options: IdLabel[];
    value: string | null;
    onPick: (id: string) => void;
  } | null>(null);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classResponse, teacherResponse , subjectResponse] = await Promise.all([
        apiService.getClasses(),
        apiService.getTeachers(),
        apiService.getAllSubjects()
      ]);

      if (!classResponse.success) {
        throw new Error(classResponse.msg || 'Failed to fetch classes');
      }
      if (!teacherResponse.success) {
        throw new Error(teacherResponse.msg || 'Failed to fetch teachers');
      }
      if (!subjectResponse.success) {
        throw new Error(subjectResponse.msg || 'Failed to fetch subjects');
      }
      setClasses((classResponse.data as ClassItem[]) || []);
      setTeachers((teacherResponse.data as TeacherItem[]) || []);
      setSubjects((subjectResponse.data as Subject[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [classResponse, teacherResponse, subjectResponse] = await Promise.all([
        apiService.getClasses(),
        apiService.getTeachers(),
        apiService.getAllSubjects()
      ]);

      if (!classResponse.success) {
        throw new Error(classResponse.msg || 'Failed to fetch classes');
      }
      if (!teacherResponse.success) {
        throw new Error(teacherResponse.msg || 'Failed to fetch teachers');
      }
      if (!subjectResponse.success) {
        throw new Error(subjectResponse.msg || 'Failed to fetch subjects');
      }
      setClasses((classResponse.data as ClassItem[]) || []);
      setTeachers((teacherResponse.data as TeacherItem[]) || []);
      setSubjects((subjectResponse.data as Subject[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setRefreshing(false);
    }
  };

  const teacherOptions: IdLabel[] = useMemo(
    () =>
      teachers
        .map((teacher) => ({ _id: teacher._id, name: teacher.user?.name || 'Unnamed teacher' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teachers]
  );

  const classOptions: IdLabel[] = useMemo(
    () =>
      classes
        .map((cls) => ({
          _id: cls._id,
          name: `${cls.name}${cls.section ? ` (${cls.section})` : ''}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [classes]
  );

  const subjectOptions: IdLabel[] = useMemo(() => {
    const map = new Map<string, string>();
    const subtitleMap = new Map<string, string>();

    subjects.forEach((subject) => {
        if (subject._id && subject.name) {
          map.set(subject._id, subject.name);
          subtitleMap.set(subject._id, getSubjectSubtitle(subject));
        }
      });
    return Array.from(map.entries()).map(([id, name]) => ({
      _id: id,
      name,
      subtitle: subtitleMap.get(id),
    }));
  }, [subjects]);

  const createClass = async () => {
    if (!newClassName.trim() || !newClassGrade.trim() || !newClassSection.trim()) {
      Alert.alert('Missing fields', 'Name, Grade and Section are required.');
      return; 
    }

    try {
      setSaving(true);
      const response = await apiService.createClass({
        name: newClassName.trim(),
        grade: newClassGrade.trim(),
        section: newClassSection.trim(),
        capacity: Number(newClassCapacity || '40'),
        room: newClassRoom.trim() || 'R001',
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to create class');
      }

      setNewClassName('');
      setNewClassGrade('');
      setNewClassSection('');
      setNewClassCapacity('40');
      setNewClassRoom('R001');
      await fetchData();
      Alert.alert('Success', 'Class created successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const assignTeacher = async () => {
    if (!selectedClassForTeacher || !selectedTeacherForClass) {
      Alert.alert('Missing selection', 'Please select class and teacher.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.assignClassTeacher(selectedClassForTeacher, selectedTeacherForClass);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to assign class teacher');
      }
      await fetchData();
      Alert.alert('Success', 'Teacher assigned to class.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign teacher');
    } finally {
      setSaving(false);
    }
  };

  const addSubjectInClass = async () => {
    if (!subjectName.trim() || !subjectCode.trim() || !selectedClassForSubject || !selectedTeacherForSubject) {
      Alert.alert('Missing fields', 'Subject name, code, class, and teacher are required.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.createSubject({
        name: subjectName.trim(),
        code: subjectCode.trim(),
        classId: selectedClassForSubject,
        teacherId: selectedTeacherForSubject,
        maxMarks: Number(subjectMaxMarks || '100'),
      });
      if (!response.success) {
        throw new Error(response.msg || 'Failed to create subject');
      }

      setSubjectName('');
      setSubjectCode('');
      setSubjectMaxMarks('100');
      await fetchData();
      Alert.alert('Success', 'Subject added in class.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  const assignExistingSubject = async () => {
    if (!selectedClassForExistingSubject || !selectedExistingSubject) {
      Alert.alert('Missing selection', 'Please select class and subject.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.assignSubjectToClass(
        selectedExistingSubject,
        selectedClassForExistingSubject
      );
      if (!response.success) {
        throw new Error(response.msg || 'Failed to assign subject to class');
      }
      await fetchData();
      Alert.alert('Success', 'Subject assigned to class.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign subject');
    } finally {
      setSaving(false);
    }
  };

  const openPicker = (title: string, options: IdLabel[], value: string | null, onPick: (id: string) => void) => {
    setPickerState({ title, options, value, onPick });
  };

  const closePicker = () => setPickerState(null);

  const renderDropdown = (
    title: string,
    options: IdLabel[],
    value: string | null,
    onPick: (id: string) => void,
    placeholder: string,
  ) => {
    const selectedLabel = options.find((item) => item._id === value)?.name || placeholder;

    return (
      <Pressable
        style={({ pressed }) => [styles.dropdownButton, pressed && styles.buttonPressed]}
        onPress={() => openPicker(title, options, value, onPick)}>
        <View style={styles.dropdownLabelWrap}>
          <Text style={[styles.dropdownText, !value && { color: PALETTE.textBody }]}>{selectedLabel}</Text>
          {options.find((item) => item._id === value)?.subtitle ? (
            <Text style={styles.dropdownSubtitle} numberOfLines={1}>
              {options.find((item) => item._id === value)?.subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={styles.dropdownArrow}>⌄</Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={PALETTE.accent}
        />
      }>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* --- ALL CLASSES SECTION --- */}
      <View style={styles.section}> 
        <Text style={styles.sectionTitle}>All Classes</Text>
        {classes.length === 0 ? (
          <Text style={styles.mutedText}>No classes found</Text>
        ) : (
          <FlatList
            data={classes}
            horizontal={true}
            keyExtractor={(cls) => cls._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classListContainer}
            renderItem={({ item: cls }) => (
              <Pressable
                onPress={() => router.push(`/class-details/${cls._id}`)}
                style={({ pressed }) => [styles.classCard, pressed && styles.buttonPressed]}>
                <Text style={styles.classCardTitle}>
                  {cls.name}{cls.section ? ` (${cls.section})` : ''}
                </Text>
                <Text style={styles.classCardMeta}>Grade: {cls.grade || 'N/A'} | Room: {cls.room || 'N/A'}</Text>
                <Text style={styles.classCardMeta}>Students: {cls.studentCount || 0}</Text>
                <Text style={styles.classCardMeta}>Teacher: {cls.classTeacher?.user?.name || 'Not assigned'}</Text>
                <Text style={styles.classCardMeta} numberOfLines={1}>
                  Subjects: {(cls.subjects || []).map((s) => s.name).filter(Boolean).join(', ') || 'None'}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* --- ADMIN ACTIONS --- */}
      {isAdmin ? (
        <>
          <View style={styles.section}> 
            <Text style={styles.sectionTitle}>Add New Class</Text>
            
            <Text style={styles.inputLabel}>Class Name</Text>
            <TextInput placeholder="e.g. 10th Standard" placeholderTextColor={PALETTE.textBody} style={styles.input} value={newClassName} onChangeText={setNewClassName} />
            
            <Text style={styles.inputLabel}>Grade</Text>
            <TextInput placeholder="e.g. 10" placeholderTextColor={PALETTE.textBody} style={styles.input} value={newClassGrade} onChangeText={setNewClassGrade} />
            
            <Text style={styles.inputLabel}>Section</Text>
            <TextInput placeholder="e.g. A" placeholderTextColor={PALETTE.textBody} style={styles.input} value={newClassSection} onChangeText={setNewClassSection} />
            
            <Text style={styles.inputLabel}>Capacity</Text>
            <TextInput placeholder="e.g. 40" placeholderTextColor={PALETTE.textBody} style={styles.input} keyboardType="numeric" value={newClassCapacity} onChangeText={setNewClassCapacity} />
            
            <Text style={styles.inputLabel}>Room</Text>
            <TextInput placeholder="e.g. R001" placeholderTextColor={PALETTE.textBody} style={styles.input} value={newClassRoom} onChangeText={setNewClassRoom} />
            
            <Pressable style={({ pressed }) => [styles.actionButton, { backgroundColor: PALETTE.cta }, pressed && styles.buttonPressed]} onPress={createClass} disabled={saving}>
              <Text style={styles.actionText}>{saving ? 'Saving...' : 'Create Class'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}> 
            <Text style={styles.sectionTitle}>Assign Class Teacher</Text>
            <Text style={styles.inputLabel}>Select Class</Text>
            {renderDropdown('Select Class', classOptions, selectedClassForTeacher, setSelectedClassForTeacher, 'Choose a class...')}
            <Text style={styles.inputLabel}>Select Teacher</Text>
            {renderDropdown('Select Teacher', teacherOptions, selectedTeacherForClass, setSelectedTeacherForClass, 'Choose a teacher...')}
            <Pressable style={({ pressed }) => [styles.actionButton, { backgroundColor: PALETTE.primary }, pressed && styles.buttonPressed]} onPress={assignTeacher} disabled={saving}>
              <Text style={styles.actionText}>{saving ? 'Saving...' : 'Assign Teacher'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}> 
            <Text style={styles.sectionTitle}>Add Subject in Class</Text>
            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput placeholder="e.g. Mathematics" placeholderTextColor={PALETTE.textBody} style={styles.input} value={subjectName} onChangeText={setSubjectName} />
            
            <Text style={styles.inputLabel}>Subject Code</Text>
            <TextInput placeholder="e.g. MATH101" placeholderTextColor={PALETTE.textBody} style={styles.input} value={subjectCode} onChangeText={setSubjectCode} />
            
            <Text style={styles.inputLabel}>Maximum Marks</Text>
            <TextInput placeholder="e.g. 100" placeholderTextColor={PALETTE.textBody} style={styles.input} keyboardType="numeric" value={subjectMaxMarks} onChangeText={setSubjectMaxMarks} />
            
            <Text style={styles.inputLabel}>Select Class</Text>
            {renderDropdown('Select Class', classOptions, selectedClassForSubject, setSelectedClassForSubject, 'Choose a class...')}
            
            <Text style={styles.inputLabel}>Select Teacher</Text>
            {renderDropdown('Select Teacher', teacherOptions, selectedTeacherForSubject, setSelectedTeacherForSubject, 'Choose a teacher...')}
            
            <Pressable style={({ pressed }) => [styles.actionButton, { backgroundColor: PALETTE.primary }, pressed && styles.buttonPressed]} onPress={addSubjectInClass} disabled={saving}>
              <Text style={styles.actionText}>{saving ? 'Saving...' : 'Add Subject'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}> 
            <Text style={styles.sectionTitle}>Assign Existing Subject to Class</Text>
            <Text style={styles.inputLabel}>Select Subject</Text>
            {renderDropdown('Select Subject', subjectOptions, selectedExistingSubject, setSelectedExistingSubject, 'Choose a subject...')}
            
            <Text style={styles.inputLabel}>Select Class</Text>
            {renderDropdown('Select Class', classOptions, selectedClassForExistingSubject, setSelectedClassForExistingSubject, 'Choose a class...')}
            
            <Pressable style={({ pressed }) => [styles.actionButton, { backgroundColor: PALETTE.primary }, pressed && styles.buttonPressed]} onPress={assignExistingSubject} disabled={saving}>
              <Text style={styles.actionText}>{saving ? 'Saving...' : 'Assign Subject'}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {/* --- MODAL PICKER --- */}
      <Modal visible={!!pickerState} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerState?.title}</Text>
            {pickerState?.options.length ? (
              <FlatList
                data={pickerState.options}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const selected = item._id === pickerState.value;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalItem,
                        selected && styles.modalItemSelected,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        pickerState.onPick(item._id);
                        closePicker();
                      }}>
                      <Text style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{item.name}</Text>
                      {item.subtitle ? (
                        <Text style={[styles.modalItemSubtitle, selected && styles.modalItemTextSelected]} numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            ) : (
              <Text style={styles.mutedText}>No options found</Text>
            )}
          </View>
        </View>
      </Modal>
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
  buttonPressed: {
    opacity: 0.85,
  },

  /* SECTIONS & CARDS */
  section: {
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 4,
  },
  mutedText: {
    fontSize: 13,
    color: PALETTE.textBody,
  },

  /* CLASS HORIZONTAL LIST */
  classListContainer: {
    paddingRight: 16,
    gap: 12,
  },
  classCard: {
    width: 260,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    padding: 14,
    gap: 4,
  },
  classCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 4,
  },
  classCardMeta: {
    fontSize: 13,
    color: PALETTE.textBody,
  },

  /* FORMS */
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textHeading,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    backgroundColor: PALETTE.surface,
    color: PALETTE.textHeading,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  actionText: {
    color: PALETTE.surface,
    fontWeight: '700',
    fontSize: 14,
  },

  /* DROPDOWNS */
  dropdownButton: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLabelWrap: {
    flex: 1,
    gap: 2,
  },
  dropdownText: {
    fontSize: 14,
    color: PALETTE.textHeading,
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: PALETTE.textBody,
  },
  dropdownArrow: {
    fontSize: 16,
    color: PALETTE.textBody,
    marginLeft: 8,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(48, 56, 65, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 20,
    maxHeight: '70%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 8,
  },
  modalItem: {
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: PALETTE.background,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(118, 171, 174, 0.1)',
    borderColor: PALETTE.accent,
  },
  modalItemText: {
    fontWeight: '600',
    fontSize: 14,
    color: PALETTE.textHeading,
  },
  modalItemSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: PALETTE.textBody,
  },
  modalItemTextSelected: {
    color: PALETTE.primary,
  },

  /* ERROR */
  errorBox: {
    borderRadius: 4,
    padding: 12,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderWidth: 1,
    borderColor: PALETTE.error,
  },
  errorText: {
    color: PALETTE.error,
    fontWeight: '600',
    fontSize: 14,
  },
});