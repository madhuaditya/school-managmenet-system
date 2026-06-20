// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { router, useLocalSearchParams } from 'expo-router';
// import {
//   MaterialCommunityIcons,
//   Ionicons,
// } from '@expo/vector-icons';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';

// function getCurrentAcademicYear() {
//   const now = new Date();
//   const y = now.getFullYear();
//   const start = now.getMonth() + 1 >= 4 ? y : y - 1;
//   const date = `${start}-${String(start + 1).slice(-2)}`;
//   return date;
// }

// const assessmentTypeOptions = [
//   { label: 'Exam', value: 'exam' },
//   { label: 'Test', value: 'test' },
//   { label: 'Assignment', value: 'assignment' },
// ] as const;

// const fixedMaxMarksByType = {
//   test: 10,
//   assignment: 20,
// } as const;

// const StudentRow = React.memo(function StudentRow({ item }: { item: any }) {
//   return (
//     <View style={styles.rowItem}>
//       <ThemedText>{item.user?.name || item.name || 'Student'}</ThemedText>
//       <ThemedText style={{ opacity: 0.7 }}>{item.rollNumber ? `#${item.rollNumber}` : ''}</ThemedText>
//     </View>
//   );
// });

// export default function SubjectDetail() {
//   const params = useLocalSearchParams();
//   const subjectId = (params?.subjectId as string) || '';
//   const colorScheme = useColorScheme();
//   const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [loadingTemplate, setLoadingTemplate] = useState(false);

//   const [subject, setSubject] = useState<any | null>(null);
//   const [students, setStudents] = useState<any[]>([]);
//   const [exams, setExams] = useState<any[]>([]);
//   const [stats, setStats] = useState<any | null>(null);
//   const [progress, setProgress] = useState<any[]>([]);
//   const [ranking, setRanking] = useState<any[]>([]);
//   const [studentSearch, setStudentSearch] = useState('');

//   const [academicYear, setAcademicYear] = useState<string>(getCurrentAcademicYear());
//   const yearOptions = useMemo(() => {
//     const [start] = academicYear.split('-').map(Number);
//     return [String(start - 1) + '-' + String(start).slice(-2), academicYear, String(start + 1) + '-' + String(start + 2).slice(-2)];
//   }, [academicYear]);

//   const [editing, setEditing] = useState(false);
//   const [title, setTitle] = useState('');
//   const [type, setType] = useState<'exam' | 'test' | 'assignment'>('exam');
//   const [rows, setRows] = useState<any[]>([]);
//   const [selectedExam, setSelectedExam] = useState<any | null>(null);

//   const selectedExamValue = selectedExam?._id || '';

//   const selectedMaxMarks = useMemo(() => {
//     if (type === 'test') return fixedMaxMarksByType.test;
//     if (type === 'assignment') return fixedMaxMarksByType.assignment;
//     return Number(selectedExam?.totalMarks || subject?.maxMarks || 100);
//   }, [selectedExam?.totalMarks, subject?.maxMarks, type]);

//   const renderStudentItem = useCallback(({ item }: { item: any }) => <StudentRow item={item} />, []);

//   const studentKeyExtractor = useCallback(
//     (item: any) => String(item._id || item.user?._id || item.userId || item.studentId || item.rollNumber || item.name),
//     [],
//   );

//   const buildManualRows = useCallback(
//     (assessmentType: 'test' | 'assignment') => {
//       const totalMarks = assessmentType === 'test' ? fixedMaxMarksByType.test : fixedMaxMarksByType.assignment;
//       const matchedProgress = progress.filter((item: any) => item.type === assessmentType);
//       const progressByStudentId = new Map<string, any>();

//       matchedProgress.forEach((item: any) => {
//         const key = String(item.student?._id || item.studentId || item.student || '');
//         if (key && !progressByStudentId.has(key)) {
//           progressByStudentId.set(key, item);
//         }
//       });

//       const label = assessmentType === 'test' ? 'Test' : 'Assignment';
//       return students.map((student: any) => {
//         const studentId = student._id || student.user?._id || student.userId;
//         const item = progressByStudentId.get(String(studentId));
//         return {
//           studentId,
//           name: student.user?.name || student.name || 'Student',
//           marksObtained: item?.marksObtained ?? '',
//           totalMarks,
//           remarks: item?.remarks ?? '',
//           progressId: item?._id || null,
//           title: item?.title || label,
//         };
//       });
//     },
//     [progress, students],
//   );

//   const resetForManualAssessment = useCallback(
//     (assessmentType: 'test' | 'assignment') => {
//       setSelectedExam(null);
//       setType(assessmentType);
//       setTitle(assessmentType === 'test' ? 'Test' : 'Assignment');
//       setRows(buildManualRows(assessmentType));
//       setEditing(true);
//     },
//     [buildManualRows],
//   );

//   const handleAssessmentTypeChange = useCallback(
//     (nextType: 'exam' | 'test' | 'assignment') => {
//       setType(nextType);
//       if (nextType === 'exam') {
//         setSelectedExam(null);
//         setRows([]);
//         setTitle('');
//         setEditing(false);
//         return;
//       }

//       resetForManualAssessment(nextType);
//     },
//     [resetForManualAssessment],
//   );

//   useEffect(() => {
//     void loadDetails();
//   }, [subjectId, academicYear]);

//   async function loadDetails() {
//     setLoading(true);
//     try {
//       if (!subjectId) return;
//       const res = await apiService.getSubjectDetails(subjectId, academicYear as any);
//       if (res && res.success && res.data) {
//         setSubject(res.data.subject || null);
//         setStats(res.data.stats || null);
//         setStudents(res.data.students || []);
//         setExams(res.data.exams || []);
//         setProgress(res.data.progress || []);
//         setRanking(res.data.ranking || []);
//         setSelectedExam(null);
//         setEditing(false);
//         setRows([]);
//         setType('exam');
//         setTitle('');
//       }
//     } catch (err) {
//       // silent
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadExamTemplate(exam: any) {
//     if (!exam || !exam._id) return;
//     setLoadingTemplate(true);
//     try {
//       const res = await apiService.getExamProgressTemplate(exam._id, academicYear as any);
//       if (res && res.success && res.data) {
//         const templateRows = Array.isArray(res.data.rows) ? res.data.rows : [];
//         const mapped = templateRows.map((row: any) => ({
//           studentId: row.student?._id || row.studentId || row.student,
//           name: row.student?.user?.name || row.student?.name || row.studentName || 'Student',
//           marksObtained: row.marksObtained ?? 0,
//           totalMarks: row.totalMarks ?? Number(res.data.exam?.totalMarks || exam.totalMarks || subject?.maxMarks || 100),
//           remarks: row.remarks ?? '',
//           progressId: row.progressId || row._id || null,
//         }));
//         if (!mapped.length) {
//           Alert.alert('Template', 'No student rows returned for this exam');
//           setRows([]);
//           setEditing(false);
//           setSelectedExam(null);
//           return;
//         }
//         setRows(mapped);
//         setEditing(true);
//         setSelectedExam(res.data.exam || exam);
//         setTitle((res.data.exam?.name || exam.name || exam.title || '').toString());
//         setType('exam');
//       } else {
//         Alert.alert('Template', 'No template found for selected exam');
//         setRows([]);
//         setEditing(false);
//         setSelectedExam(null);
//       }
//     } catch (err) {
//       Alert.alert('Error', 'Failed to load template');
//     } finally {
//       setLoadingTemplate(false);
//     }
//   }

//   const medals = [
//   'trophy',
//   'medal',
//   'star-circle',
// ];

//   async function saveBulk() {
//     if (!rows.length) {
//       Alert.alert('Validation', 'Please load or create rows before saving marks.');
//       return;
//     }

//     if (type === 'exam' && !selectedExam) {
//       Alert.alert('Validation', 'Please select a valid exam template before saving marks.');
//       return;
//     }

//     setSaving(true);
//     try {
//       const payload: any = {
//         subjectId,
//         academicYear,
//         type,
//         title: type === 'exam' ? (title || selectedExam?.name || selectedExam?.title) : title,
//         examId: type === 'exam' ? selectedExam?._id : undefined,
//         classId: subject?.class?._id,
//         rows: rows.map((r) => ({
//           studentId: r.studentId,
//           progressId: r.progressId || undefined,
//           marksObtained: r.marksObtained === '' ? undefined : Number(r.marksObtained),
//           totalMarks: r.totalMarks === '' ? undefined : Number(r.totalMarks),
//           remarks: r.remarks,
//         })),
//       };

//       const res = await apiService.bulkCreateProgress(payload as any);
//       if (!res || !res.success) throw new Error(res?.msg || 'Failed to save marks');
//       Alert.alert('Success', res.msg || 'Saved successfully');
//       setEditing(false);
//       void loadDetails();
//     } catch (err: any) {
//       Alert.alert('Save Failed', err?.message || 'Failed to save');
//     } finally {
//       setSaving(false);
//     }
//   }

//   if (loading) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ActivityIndicator size="large" color={themeColors.tint} />
//       </ThemedView>
//     );
//   }

//  const header = (
//   <View>
//   <View>

//     {/* HERO */}
//     <View style={styles.heroCard}>
//       <View style={styles.heroTop}>
//         <MaterialCommunityIcons
//           name="book-education-outline"
//           size={32}
//           color="#76ABAE"
//         />

//         <View style={{ flex: 1, marginLeft: 12 }}>
//           <ThemedText type="title">
//             {subject?.name || 'Subject'}
//           </ThemedText>

//           <ThemedText style={styles.subjectCode}>
//             {subject?.code || 'No Code'}
//           </ThemedText>
//         </View>
//       </View>

//       <View style={styles.heroMetaRow}>
//         <View style={styles.statChip}>
//           <MaterialCommunityIcons
//             name="google-classroom"
//             size={16}
//             color="#76ABAE"
//           />
//           <ThemedText>
//             {subject?.class
//               ? `${subject.class.name}${subject.class.section ? `-${subject.class.section}` : ''}`
//               : 'N/A'}
//           </ThemedText>
//         </View>

//         <View style={styles.statChip}>
//           <MaterialCommunityIcons
//             name="account-tie-outline"
//             size={16}
//             color="#76ABAE"
//           />
//           <ThemedText>
//             {subject?.teacher?.user?.name || 'N/A'}
//           </ThemedText>
//         </View>
//       </View>
//     </View>

//     {/* STATS */}
//     {stats && (
//       <View style={styles.metricGrid}>
//         <View style={styles.metricCard}>
//           <Ionicons
//             name="people-outline"
//             size={22}
//             color="#76ABAE"
//           />

//           <ThemedText style={styles.metricValue}>
//             {stats.totalStudents}
//           </ThemedText>

//           <ThemedText style={styles.metricLabel}>
//             Students
//           </ThemedText>
//         </View>

//         <View style={styles.metricCard}>
//           <Ionicons
//             name="document-text-outline"
//             size={22}
//             color="#76ABAE"
//           />

//           <ThemedText style={styles.metricValue}>
//             {stats.totalExams}
//           </ThemedText>

//           <ThemedText style={styles.metricLabel}>
//             Exams
//           </ThemedText>
//         </View>

//         <View style={styles.metricCard}>
//           <Ionicons
//             name="clipboard-outline"
//             size={22}
//             color="#76ABAE"
//           />

//           <ThemedText style={styles.metricValue}>
//             {stats.totalProgress}
//           </ThemedText>

//           <ThemedText style={styles.metricLabel}>
//             Records
//           </ThemedText>
//         </View>

//         <View style={styles.metricCard}>
//           <Ionicons
//             name="analytics-outline"
//             size={22}
//             color="#FF5722"
//           />

//           <ThemedText style={styles.metricValue}>
//             {stats.averagePercentage ?? 0}%
//           </ThemedText>

//           <ThemedText style={styles.metricLabel}>
//             Average
//           </ThemedText>
//         </View>
//       </View>
//     )}

//     {/* ACADEMIC YEAR */}
//     <View style={styles.sectionCard}>
//       <View style={styles.sectionHeader}>
//         <Ionicons
//           name="calendar-outline"
//           size={18}
//           color="#76ABAE"
//         />

//         <ThemedText type="subtitle">
//           Academic Year
//         </ThemedText>
//       </View>

//       <View style={styles.dropdownWrap}>
//         <Picker
//           selectedValue={academicYear}
//           onValueChange={(value) =>
//             setAcademicYear(String(value))
//           }>
//           {yearOptions.map((y) => (
//             <Picker.Item
//               key={y}
//               label={y}
//               value={y}
//             />
//           ))}
//         </Picker>
//       </View>
//     </View>

//     {/* ASSESSMENT TYPE */}
//     <View style={styles.sectionCard}>
//       <View style={styles.sectionHeader}>
//         <Ionicons
//           name="clipboard-text-outline"
//           size={18}
//           color="#76ABAE"
//         />

//         <ThemedText type="subtitle">
//           Assessment Type
//         </ThemedText>
//       </View>

//       <View style={styles.dropdownWrap}>
//         <Picker
//           selectedValue={type}
//           onValueChange={(value) =>
//             handleAssessmentTypeChange(
//               value as 'exam' | 'test' | 'assignment'
//             )
//           }>
//           {assessmentTypeOptions.map((option) => (
//             <Picker.Item
//               key={option.value}
//               label={option.label}
//               value={option.value}
//             />
//           ))}
//         </Picker>
//       </View>
//     </View>

//     {/* EXAMS */}
//     {type === 'exam' && (
//       <View style={styles.sectionCard}>
//         <View style={styles.sectionHeader}>
//           <Ionicons
//             name="document-text-outline"
//             size={18}
//             color="#76ABAE"
//           />

//           <ThemedText type="subtitle">
//             Exams
//           </ThemedText>
//         </View>

//         <View style={styles.dropdownWrap}>
//           <Picker
//             selectedValue={selectedExamValue}
//             onValueChange={(value) => {
//               const nextExam = exams.find(
//                 (exam: any) =>
//                   String(exam._id) === String(value)
//               );

//               if (!nextExam) {
//                 setSelectedExam(null);
//                 setRows([]);
//                 setEditing(false);
//                 setTitle('');
//                 return;
//               }

//               void loadExamTemplate(nextExam);
//             }}>
//             <Picker.Item
//               label="Select exam template"
//               value=""
//             />

//             {exams.map((ex: any) => (
//               <Picker.Item
//                 key={ex._id}
//                 label={
//                   ex.code
//                     ? `${ex.name || ex.title || 'Exam'} · ${ex.code}`
//                     : ex.name || ex.title || 'Exam'
//                 }
//                 value={ex._id}
//               />
//             ))}
//           </Picker>
//         </View>
//       </View>
//     )}

//     {/* RECENT PROGRESS */}
//     {progress.length > 0 && (
//       <View style={{ marginTop: 18 }}>
//         <ThemedText type="subtitle">
//           Recent Progress
//         </ThemedText>

//         <FlatList
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           data={progress.slice(0, 5)}
//           keyExtractor={(item: any) => item._id}
//           contentContainerStyle={{
//             paddingTop: 12,
//             gap: 12,
//           }}
//           renderItem={({ item }) => (
//             <View style={styles.progressCard}>
//               <MaterialCommunityIcons
//                 name="chart-line"
//                 size={22}
//                 color="#76ABAE"
//               />

//               <ThemedText
//                 type="defaultSemiBold"
//                 style={{ marginTop: 8 }}>
//                 {item.title ||
//                   item.type ||
//                   'Progress'}
//               </ThemedText>

//               <View style={styles.progressBadge}>
//                 <ThemedText
//                   style={styles.progressBadgeText}>
//                   {item.percentage
//                     ? `${Number(item.percentage).toFixed(0)}%`
//                     : 'N/A'}
//                 </ThemedText>
//               </View>
//             </View>
//           )}
//         />
//       </View>
//     )}

//     {/* RANKING */}
//     {ranking.length > 0 && (
//       <View style={{ marginTop: 18 }}>
//         <ThemedText type="subtitle">
//           Ranking
//         </ThemedText>

//         {ranking.slice(0, 3).map(
//           (item: any, index: number) => (
//             <View
//               key={String(
//                 item._id ||
//                   item.student?._id ||
//                   item.studentId
//               )}
//               style={styles.rankingCard}>
//               <MaterialCommunityIcons
//                 name={
//                   index === 0
//                     ? 'trophy'
//                     : index === 1
//                     ? 'medal'
//                     : 'star-circle'
//                 }
//                 size={24}
//                 color="#FF5722"
//               />

//               <View style={{ flex: 1 }}>
//                 <ThemedText>
//                   {item.student?.user?.name ||
//                     item.student?.name ||
//                     item.name ||
//                     'Student'}
//                 </ThemedText>
//               </View>

//               <ThemedText>
//                 {item.percentage
//                   ? `${Number(item.percentage).toFixed(1)}%`
//                   : ''}
//               </ThemedText>
//             </View>
//           )
//         )}
//       </View>
//     )}
//   </View>

//      {editing ? (
//   <View style={styles.bulkEditorCard}>
//     <View style={styles.sectionHeader}>
//       <MaterialCommunityIcons
//         name="clipboard-edit-outline"
//         size={20}
//         color="#76ABAE"
//       />

//       <ThemedText type="subtitle">
//         Bulk Marks Entry
//       </ThemedText>
//     </View>

//     <TextInput
//       value={title}
//       onChangeText={setTitle}
//       placeholder={
//         type === 'exam'
//           ? 'Exam Title'
//           : type === 'test'
//           ? 'Test Title'
//           : 'Assignment Title'
//       }
//       editable={type !== 'exam'}
//       placeholderTextColor="rgba(120,120,120,0.8)"
//       style={[
//         styles.titleInput,
//         type === 'exam' && {
//           opacity: 0.7,
//         },
//       ]}
//     />

//     {loadingTemplate && (
//       <ActivityIndicator
//         style={{ marginTop: 12 }}
//         color="#76ABAE"
//       />
//     )}

//     {type === 'exam' && selectedExam ? (
//       <View style={styles.selectedExamCard}>
//         <MaterialCommunityIcons
//           name="file-document-outline"
//           size={18}
//           color="#76ABAE"
//         />

//         <ThemedText style={{ flex: 1 }}>
//           {selectedExam.title ||
//             selectedExam.name}
//         </ThemedText>

//         <Pressable
//           onPress={() => {
//             setSelectedExam(null);
//             setRows([]);
//             setTitle('');
//             setType('exam');
//             setEditing(false);
//           }}>
//           <MaterialCommunityIcons
//             name="close-circle-outline"
//             size={24}
//             color="#FF5722"
//           />
//         </Pressable>
//       </View>
//     ) : null}

//     {type !== 'exam' && (
//       <View style={styles.fixedMarksCard}>
//         <MaterialCommunityIcons
//           name="calculator-variant-outline"
//           size={18}
//           color="#76ABAE"
//         />

//         <ThemedText>
//           Max Marks: {selectedMaxMarks}
//         </ThemedText>
//       </View>
//     )}

//     {/* Student Search */}

//     <View style={styles.searchBox}>
//       <Ionicons
//         name="search"
//         size={18}
//         color="#76ABAE"
//       />

//       <TextInput
//         placeholder="Search student..."
//         placeholderTextColor="rgba(120,120,120,0.8)"
//         value={studentSearch}
//         onChangeText={setStudentSearch}
//         style={{ flex: 1 }}
//       />
//     </View>

//     {/* Student Cards */}

//     {rows
//       .filter((r) =>
//         r.name
//           ?.toLowerCase()
//           .includes(
//             studentSearch.toLowerCase()
//           )
//       )
//       .map((r, idx) => (
//         <View
//           key={r.studentId || idx}
//           style={styles.studentEditorCard}>
//           <View style={styles.studentHeader}>
//             <MaterialCommunityIcons
//               name="account-school-outline"
//               size={20}
//               color="#76ABAE"
//             />

//             <ThemedText
//               style={styles.studentName}>
//               {r.name}
//             </ThemedText>
//           </View>

//           <View style={styles.inputRow}>
//             <View style={{ flex: 1 }}>
//               <ThemedText
//                 style={styles.inputLabel}>
//                 Marks
//               </ThemedText>

//               <TextInput
//                 value={String(
//                   r.marksObtained
//                 )}
//                 keyboardType="numeric"
//                 placeholder="0"
//                 onChangeText={(text) =>
//                   setRows((prev) => {
//                     const copy = [...prev];

//                     copy[idx] = {
//                       ...copy[idx],
//                       marksObtained:
//                         text.replace(
//                           /[^0-9.]/g,
//                           ''
//                         ),
//                     };

//                     return copy;
//                   })
//                 }
//                 style={styles.studentInput}
//               />
//             </View>

//             <View style={{ flex: 1 }}>
//               <ThemedText
//                 style={styles.inputLabel}>
//                 Max Marks
//               </ThemedText>

//               <TextInput
//                 editable={false}
//                 value={String(
//                   r.totalMarks
//                 )}
//                 style={[
//                   styles.studentInput,
//                   styles.disabledInput,
//                 ]}
//               />
//             </View>
//           </View>
//         </View>
//       ))}

//     {/* Sticky Actions */}

//     <View style={styles.stickyActions}>
//       <Pressable
//         onPress={() => setEditing(false)}
//         style={styles.secondaryButton}>
//         <ThemedText>
//           Cancel
//         </ThemedText>
//       </Pressable>

//       <Pressable
//         onPress={() => {
//           for (const r of rows) {
//             if (!r.studentId) continue;

//             const total = Number(
//               r.totalMarks
//             );

//             if (
//               Number.isNaN(total) ||
//               total < 1
//             ) {
//               Alert.alert(
//                 'Validation',
//                 'Total marks must be greater than 0'
//               );
//               return;
//             }

//             if (
//               r.marksObtained !== ''
//             ) {
//               const marks = Number(
//                 r.marksObtained
//               );

//               if (
//                 Number.isNaN(marks) ||
//                 marks < 0 ||
//                 marks > total
//               ) {
//                 Alert.alert(
//                   'Validation',
//                   'Marks must be between 0 and max marks'
//                 );
//                 return;
//               }
//             }
//           }

//           void saveBulk();
//         }}
//         style={styles.primaryButton}>
//         {saving ? (
//           <ActivityIndicator
//             color="#fff"
//           />
//         ) : (
//           <>
//             <MaterialCommunityIcons
//               name="content-save-outline"
//               size={18}
//               color="#fff"
//             />

//             <ThemedText
//               style={{
//                 color: '#fff',
//                 fontWeight: '700',
//               }}>
//               Save Marks
//             </ThemedText>
//           </>
//         )}
//       </Pressable>
//     </View>
//   </View>
// ) : null}
//     </View>
//   );


//   return (
//     <ThemedView style={styles.container}>
//       <FlatList
//         data={editing ? [] : students}
//         keyExtractor={studentKeyExtractor}
//         ListHeaderComponent={header}
//         ListEmptyComponent={editing ? null : <View />}
//         renderItem={renderStudentItem}
//         contentContainerStyle={{ paddingBottom: 120 }}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={7}
//         updateCellsBatchingPeriod={50}
//         removeClippedSubviews
//       />
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   sectionHeader: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 8,
//   marginBottom: 12,
//   paddingBottom: 10,
//   borderBottomWidth: 1,
//   borderBottomColor: '#E6E6E6',
// },
//   bulkEditorCard: {
//   marginTop: 18,
// },

// titleInput: {
//   marginTop: 12,
//   borderWidth: 1,
//   borderColor: '#E6E6E6',
//   borderRadius: 14,
//   padding: 12,
// },

// selectedExamCard: {
//   marginTop: 12,
//   padding: 12,
//   borderRadius: 14,
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 10,
//   backgroundColor: 'rgba(118,171,174,0.08)',
// },

// fixedMarksCard: {
//   marginTop: 12,
//   padding: 12,
//   borderRadius: 14,
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 10,
//   backgroundColor: 'rgba(118,171,174,0.08)',
// },

// searchBox: {
//   marginTop: 14,
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 10,
//   borderWidth: 1,
//   borderColor: '#E6E6E6',
//   borderRadius: 14,
//   paddingHorizontal: 12,
//   paddingVertical: 10,
// },

// studentEditorCard: {
//   marginTop: 12,
//   padding: 14,
//   borderRadius: 18,
//   borderWidth: 1,
//   borderColor: '#E6E6E6',
//   backgroundColor: 'rgba(118,171,174,0.04)',
// },

// studentHeader: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 10,
//   marginBottom: 12,
// },

// studentName: {
//   fontWeight: '600',
// },

// inputRow: {
//   flexDirection: 'row',
//   gap: 12,
// },

// inputLabel: {
//   marginBottom: 6,
//   opacity: 0.7,
// },

// studentInput: {
//   borderWidth: 1,
//   borderColor: '#E6E6E6',
//   borderRadius: 12,
//   padding: 10,
// },

// disabledInput: {
//   backgroundColor: 'rgba(0,0,0,0.04)',
// },

// stickyActions: {
//   marginTop: 18,
//   flexDirection: 'row',
//   gap: 10,
// },
//   progressBadge: {
//   marginTop: 10,
//   alignSelf: 'flex-start',
//   paddingHorizontal: 10,
//   paddingVertical: 4,
//   borderRadius: 999,
//   backgroundColor: '#76ABAE',
// },

// progressBadgeText: {
//   color: '#fff',
//   fontWeight: '700',
//   fontSize: 12,
// },
//   progressCard: {
//   width: 140,
//   padding: 14,
//   borderRadius: 16,
//   backgroundColor: 'rgba(118,171,174,0.12)',
//   borderWidth: 1,
//   borderColor: 'rgba(118,171,174,0.18)',
// },
//   container: { flex: 1 },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   rowItem: { paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.04)', flexDirection: 'row', justifyContent: 'space-between' },
//   statChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.08)' },
//   primaryButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
//   secondaryButton: { backgroundColor: 'transparent', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
//   bulkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
//   smallInput: { width: 80, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
//   dropdownWrap: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden', marginTop: 8 },
// });


// import React, { useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { router, useLocalSearchParams } from 'expo-router';
// import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';

// // --- ERP BRANDING PALETTE ---
// const PALETTE = {
//   primary: '#303841',
//   accent: '#76ABAE',
//   cta: '#FF5722',
//   background: '#F5F5F5',
//   border: '#E6E6E6',
//   surface: '#FFFFFF',
//   textBody: '#5D646B',
//   textHeading: '#303841',
//   success: '#2E7D32',
//   error: '#D32F2F',
//   warning: '#F9A825',
// };

// function getCurrentAcademicYear() {
//   const now = new Date();
//   const y = now.getFullYear();
//   const start = now.getMonth() + 1 >= 4 ? y : y - 1;
//   return `${start}-${String(start + 1).slice(-2)}`;
// }

// const StudentRow = React.memo(function StudentRow({ item }: { item: any }) {
//   return (
//     <View style={styles.rowItem}>
//       <ThemedText style={styles.rowTextMain}>{item.user?.name || item.name || 'Student'}</ThemedText>
//       <ThemedText style={styles.rowTextSub}>{item.rollNumber ? `#${item.rollNumber}` : ''}</ThemedText>
//     </View>
//   );
// });

// export default function SubjectDetail() {
//   const params = useLocalSearchParams();
//   const subjectId = (params?.subjectId as string) || '';

//   const [loading, setLoading] = useState(true);
//   const [subject, setSubject] = useState<any | null>(null);
//   const [students, setStudents] = useState<any[]>([]);
//   const [stats, setStats] = useState<any | null>(null);
//   const [progress, setProgress] = useState<any[]>([]);
//   const [ranking, setRanking] = useState<any[]>([]);

//   const [academicYear, setAcademicYear] = useState<string>(getCurrentAcademicYear());
//   const yearOptions = useMemo(() => {
//     const [start] = academicYear.split('-').map(Number);
//     return [
//       `${start - 1}-${String(start).slice(-2)}`,
//       academicYear,
//       `${start + 1}-${String(start + 2).slice(-2)}`,
//     ];
//   }, [academicYear]);

//   useEffect(() => {
//     void loadDetails();
//   }, [subjectId, academicYear]);

//   async function loadDetails() {
//     setLoading(true);
//     try {
//       if (!subjectId) return;
//       const res = await apiService.getSubjectDetails(subjectId, academicYear as any);
//       if (res && res.success && res.data) {
//         console.log( JSON.stringify(res.data));
//         setSubject(res.data.subject || null);
//         setStats(res.data.stats || null);
//         setStudents(res.data.students || []);
//         setProgress(res.data.progress || []);
//         setRanking(res.data.ranking || []);
//       }
//     } catch (err) {
//       // silent
//     } finally {
//       setLoading(false);
//     }
//   }

//   const navigateToUpdateMarks = () => {
//     router.push({
//       pathname: 'subjects/updateMarks', // Adjust this path according to your actual folder structure
//       params: { subjectId, academicYear },
//     });
//   };

//   if (loading) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <ActivityIndicator size="large" color={PALETTE.accent} />
//       </View>
//     );
//   }

//   const header = (
//     <View style={styles.headerContainer}>
//       {/* UPDATE MARKS BUTTON */}
//       <Pressable onPress={navigateToUpdateMarks} style={styles.updateMarksBtn}>
//         <MaterialCommunityIcons name="clipboard-edit-outline" size={20} color={PALETTE.surface} />
//         <ThemedText style={styles.updateMarksText}>Update Marks</ThemedText>
//       </Pressable>

//       {/* HERO */}
//       <View style={styles.card}>
//         <View style={styles.heroTop}>
//           <MaterialCommunityIcons name="book-education-outline" size={32} color={PALETTE.accent} />
//           <View style={styles.heroTextWrap}>
//             <ThemedText style={styles.heroTitle}>{subject?.name || 'Subject'}</ThemedText>
//             <ThemedText style={styles.heroSubtitle}>{subject?.code || 'No Code'}</ThemedText>
//           </View>
//         </View>

//         <View style={styles.heroMetaRow}>
//           <View style={styles.statChip}>
//             <MaterialCommunityIcons name="google-classroom" size={16} color={PALETTE.accent} />
//             <ThemedText style={styles.chipText}>
//               {subject?.class ? `${subject.class.name}${subject.class.section ? `-${subject.class.section}` : ''}` : 'N/A'}
//             </ThemedText>
//           </View>

//           <View style={styles.statChip}>
//             <MaterialCommunityIcons name="account-tie-outline" size={16} color={PALETTE.accent} />
//             <ThemedText style={styles.chipText}>{subject?.teacher?.user?.name || 'N/A'}</ThemedText>
//           </View>
//         </View>
//       </View>

//       {/* STATS */}
//       {stats && (
//         <View style={styles.metricGrid}>
//           <View style={styles.metricCard}>
//             <Ionicons name="people-outline" size={22} color={PALETTE.accent} />
//             <ThemedText style={styles.metricValue}>{stats.totalStudents}</ThemedText>
//             <ThemedText style={styles.metricLabel}>Students</ThemedText>
//           </View>

//           <View style={styles.metricCard}>
//             <Ionicons name="document-text-outline" size={22} color={PALETTE.accent} />
//             <ThemedText style={styles.metricValue}>{stats.totalExams}</ThemedText>
//             <ThemedText style={styles.metricLabel}>Exams</ThemedText>
//           </View>

//           <View style={styles.metricCard}>
//             <Ionicons name="clipboard-outline" size={22} color={PALETTE.accent} />
//             <ThemedText style={styles.metricValue}>{stats.totalProgress}</ThemedText>
//             <ThemedText style={styles.metricLabel}>Records</ThemedText>
//           </View>

//           <View style={styles.metricCard}>
//             <Ionicons name="analytics-outline" size={22} color={PALETTE.cta} />
//             <ThemedText style={styles.metricValue}>{stats.averagePercentage ?? 0}%</ThemedText>
//             <ThemedText style={styles.metricLabel}>Average</ThemedText>
//           </View>
//         </View>
//       )}

//       {/* ACADEMIC YEAR */}
//       <View style={styles.card}>
//         <View style={styles.sectionHeader}>
//           <Ionicons name="calendar-outline" size={18} color={PALETTE.accent} />
//           <ThemedText style={styles.sectionTitle}>Academic Year</ThemedText>
//         </View>

//         <View style={styles.dropdownWrap}>
//           <Picker
//             selectedValue={academicYear}
//             onValueChange={(value) => setAcademicYear(String(value))}
//             style={styles.picker}
//           >
//             {yearOptions.map((y) => (
//               <Picker.Item key={y} label={y} value={y} />
//             ))}
//           </Picker>
//         </View>
//       </View>

//       {/* RECENT PROGRESS */}
//       {progress.length > 0 && (
//         <View style={styles.sectionWrap}>
//           <ThemedText style={styles.sectionTitleMain}>Recent Progress</ThemedText>
//           <FlatList
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             data={progress.slice(0, 5)}
//             keyExtractor={(item: any) => item._id}
//             contentContainerStyle={styles.horizontalList}
//             renderItem={({ item }) => (
//               <View style={styles.progressCard}>
//                 <MaterialCommunityIcons name="chart-line" size={22} color={PALETTE.accent} />
//                 <ThemedText style={styles.progressTitle} numberOfLines={1}>
//                   {item.title || item.type || 'Progress'}
//                 </ThemedText>
//                 <View style={styles.progressBadge}>
//                   <ThemedText style={styles.progressBadgeText}>
//                     {item.percentage ? `${Number(item.percentage).toFixed(0)}%` : 'N/A'}
//                   </ThemedText>
//                 </View>
//               </View>
//             )}
//           />
//         </View>
//       )}

//       {/* RANKING */}
//       {ranking.length > 0 && (
//         <View style={styles.sectionWrap}>
//           <ThemedText style={styles.sectionTitleMain}>Ranking</ThemedText>
//           {ranking.slice(0, 3).map((item: any, index: number) => (
//             <View key={String(item._id || item.student?._id || item.studentId)} style={styles.rankingCard}>
//               <MaterialCommunityIcons
//                 name={index === 0 ? 'trophy' : index === 1 ? 'medal' : 'star-circle'}
//                 size={24}
//                 color={PALETTE.cta}
//               />
//               <View style={styles.rankingNameWrap}>
//                 <ThemedText style={styles.rankingName}>
//                   {item.student?.user?.name || item.student?.name || item.name || 'Student'}
//                 </ThemedText>
//               </View>
//               <ThemedText style={styles.rankingScore}>
//                 {item.percentage ? `${Number(item.percentage).toFixed(1)}%` : ''}
//               </ThemedText>
//             </View>
//           ))}
//         </View>
//       )}

//       <ThemedText style={[styles.sectionTitleMain, { marginTop: 16 }]}>Students List</ThemedText>
//     </View>
//   );

//   return (
//     <ThemedView style={styles.container}>
//       <FlatList
//         data={students}
//         keyExtractor={(item: any) => String(item._id || item.user?._id || item.rollNumber || item.name)}
//         ListHeaderComponent={header}
//         renderItem={({ item }) => <StudentRow item={item} />}
//         contentContainerStyle={styles.listContent}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={7}
//       />
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: PALETTE.background },
//   centered: { justifyContent: 'center', alignItems: 'center' },
//   listContent: { padding: 16, paddingBottom: 120 },
//   headerContainer: { gap: 12 },
  
//   updateMarksBtn: {
//     backgroundColor: PALETTE.primary,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     paddingVertical: 14,
//     borderRadius: 4,
//     marginBottom: 4,
//   },
//   updateMarksText: { color: PALETTE.surface, fontWeight: '700', fontSize: 16 },

//   card: {
//     backgroundColor: PALETTE.surface,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//     borderRadius: 4,
//     padding: 16,
//   },
  
//   heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
//   heroTextWrap: { flex: 1, marginLeft: 12 },
//   heroTitle: { fontSize: 20, fontWeight: '800', color: PALETTE.textHeading },
//   heroSubtitle: { fontSize: 14, color: PALETTE.textBody, marginTop: 2 },
//   heroMetaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
//   statChip: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     gap: 6, 
//     paddingVertical: 6, 
//     paddingHorizontal: 12, 
//     borderRadius: 4, 
//     backgroundColor: 'rgba(118,171,174,0.1)' 
//   },
//   chipText: { fontSize: 13, color: PALETTE.textHeading, fontWeight: '600' },

//   metricGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
//   metricCard: {
//     flex: 1,
//     minWidth: '45%',
//     backgroundColor: PALETTE.surface,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//     borderRadius: 4,
//     padding: 16,
//     alignItems: 'center',
//   },
//   metricValue: { fontSize: 22, fontWeight: '800', color: PALETTE.textHeading, marginTop: 8 },
//   metricLabel: { fontSize: 12, color: PALETTE.textBody, marginTop: 4 },

//   sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
//   sectionTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.textHeading },
//   sectionTitleMain: { fontSize: 18, fontWeight: '800', color: PALETTE.textHeading, marginBottom: 10 },
//   sectionWrap: { marginTop: 16 },

//   dropdownWrap: { 
//     borderWidth: 1, 
//     borderColor: PALETTE.border, 
//     borderRadius: 4, 
//     backgroundColor: PALETTE.background,
//     overflow: 'hidden' 
//   },
//   picker: { height: 50, color: PALETTE.textHeading },

//   horizontalList: { gap: 12, paddingBottom: 8 },
//   progressCard: {
//     width: 140,
//     padding: 16,
//     borderRadius: 4,
//     backgroundColor: PALETTE.surface,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//   },
//   progressTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.textHeading, marginTop: 8 },
//   progressBadge: { 
//     marginTop: 10, 
//     alignSelf: 'flex-start', 
//     paddingHorizontal: 10, 
//     paddingVertical: 4, 
//     borderRadius: 4, 
//     backgroundColor: PALETTE.accent 
//   },
//   progressBadgeText: { color: PALETTE.surface, fontWeight: '700', fontSize: 12 },

//   rankingCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: PALETTE.surface,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//     padding: 16,
//     borderRadius: 4,
//     marginBottom: 8,
//     gap: 12,
//   },
//   rankingNameWrap: { flex: 1 },
//   rankingName: { fontSize: 15, fontWeight: '700', color: PALETTE.textHeading },
//   rankingScore: { fontSize: 15, fontWeight: '800', color: PALETTE.textHeading },

//   rowItem: { 
//     paddingVertical: 14, 
//     paddingHorizontal: 16, 
//     backgroundColor: PALETTE.surface,
//     borderWidth: 1, 
//     borderColor: PALETTE.border, 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//     borderRadius: 4,
//     marginBottom: 8,
//   },
//   rowTextMain: { fontSize: 14, fontWeight: '600', color: PALETTE.textHeading },
//   rowTextSub: { fontSize: 14, color: PALETTE.textBody },
// });

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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

function getCurrentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() + 1 >= 4 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

// Dynamic color for grades
const getGradeColor = (grade: string) => {
  if (!grade) return PALETTE.textBody;
  const g = grade.toUpperCase();
  if (g.includes('A')) return PALETTE.success;
  if (g.includes('B') || g.includes('C')) return PALETTE.warning;
  if (g.includes('D') || g.includes('E') || g.includes('F') || g.includes('FAIL')) return PALETTE.error;
  return PALETTE.accent;
};

const StudentRow = React.memo(function StudentRow({ item }: { item: any }) {
  const gradeColor = getGradeColor(item.grade);
  
  return (
    <View style={styles.rowItem}>
      <View style={styles.rowLeft}>
        <ThemedText style={styles.rowTextMain}>{item.user?.name || item.name || 'Student'}</ThemedText>
        <ThemedText style={styles.rowTextSub}>
          {item.rollNumber ? `Roll: ${item.rollNumber}` : 'No Roll'} • {item.progressCount || 0} Records
        </ThemedText>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.rowMarksWrap}>
          <ThemedText style={styles.rowPercentage}>
            {item.averagePercentage != null ? `${Number(item.averagePercentage).toFixed(1)}%` : '--'}
          </ThemedText>
          <ThemedText style={styles.rowMarks}>
            {item.obtainedMarks ?? 0} / {item.totalMarks ?? 0}
          </ThemedText>
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: `${gradeColor}15`, borderColor: `${gradeColor}30` }]}>
          <ThemedText style={[styles.gradeText, { color: gradeColor }]}>{item.grade || '-'}</ThemedText>
        </View>
      </View>
    </View>
  );
});

export default function SubjectDetail() {
  const params = useLocalSearchParams();
  const subjectId = (params?.subjectId as string) || '';

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  const [academicYear, setAcademicYear] = useState<string>(getCurrentAcademicYear());
  const yearOptions = useMemo(() => {
    const [start] = academicYear.split('-').map(Number);
    return [
      `${start - 1}-${String(start).slice(-2)}`,
      academicYear,
      `${start + 1}-${String(start + 2).slice(-2)}`,
    ];
  }, [academicYear]);

  useEffect(() => {
    void loadDetails();
  }, [subjectId, academicYear]);

  async function loadDetails() {
    setLoading(true);
    try {
      if (!subjectId) return;
      const res = await apiService.getSubjectDetails(subjectId, academicYear as any);
      if (res && res.success && res.data) {
        setSubject(res.data.subject || null);
        setStats(res.data.stats || null);
        setStudents(res.data.students || []);
        setProgress(res.data.progress || []);
        setRanking(res.data.ranking || []);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const navigateToUpdateMarks = () => {
    router.push({
      pathname: 'subjects/updateMarks',
      params: { subjectId, academicYear },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  const header = (
    <View style={styles.headerContainer}>
      {/* UPDATE MARKS BUTTON */}
      <Pressable onPress={navigateToUpdateMarks} style={styles.updateMarksBtn}>
        <MaterialCommunityIcons name="clipboard-edit-outline" size={20} color={PALETTE.surface} />
        <ThemedText style={styles.updateMarksText}>Update Marks</ThemedText>
      </Pressable>

      {/* HERO */}
      <View style={styles.card}>
        <View style={styles.heroTop}>
          <MaterialCommunityIcons name="book-education-outline" size={32} color={PALETTE.accent} />
          <View style={styles.heroTextWrap}>
            <ThemedText style={styles.heroTitle}>{subject?.name || 'Subject'}</ThemedText>
            <ThemedText style={styles.heroSubtitle}>Code: {subject?.code || 'N/A'} • Max Marks: {subject?.maxMarks || 100}</ThemedText>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.statChip}>
            <MaterialCommunityIcons name="google-classroom" size={16} color={PALETTE.accent} />
            <ThemedText style={styles.chipText}>
              {subject?.class ? `${subject.class.name}${subject.class.section ? `-${subject.class.section}` : ''}` : 'N/A'}
            </ThemedText>
          </View>

          <View style={styles.statChip}>
            <MaterialCommunityIcons name="account-tie-outline" size={16} color={PALETTE.accent} />
            <ThemedText style={styles.chipText}>{subject?.teacher?.user?.name || 'N/A'}</ThemedText>
          </View>
        </View>
      </View>

      {/* STATS */}
      {stats && (
        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="people-outline" size={22} color={PALETTE.accent} />
            <ThemedText style={styles.metricValue}>{stats.totalStudents}</ThemedText>
            <ThemedText style={styles.metricLabel}>Students</ThemedText>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="clipboard-outline" size={22} color={PALETTE.accent} />
            <ThemedText style={styles.metricValue}>{stats.totalProgress}</ThemedText>
            <ThemedText style={styles.metricLabel}>Records</ThemedText>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="analytics-outline" size={22} color={PALETTE.cta} />
            <ThemedText style={styles.metricValue}>{stats.averagePercentage ?? 0}%</ThemedText>
            <ThemedText style={styles.metricLabel}>Avg Score</ThemedText>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="school-outline" size={22} color={getGradeColor(stats.grade)} />
            <ThemedText style={[styles.metricValue, { color: getGradeColor(stats.grade) }]}>{stats.grade || '-'}</ThemedText>
            <ThemedText style={styles.metricLabel}>Class Grade</ThemedText>
          </View>
        </View>
      )}

      {/* ACADEMIC YEAR */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={18} color={PALETTE.accent} />
          <ThemedText style={styles.sectionTitle}>Academic Year</ThemedText>
        </View>

        <View style={styles.dropdownWrap}>
          <Picker
            selectedValue={academicYear}
            onValueChange={(value) => setAcademicYear(String(value))}
            style={styles.picker}
          >
            {yearOptions.map((y) => (
              <Picker.Item key={y} label={y} value={y} />
            ))}
          </Picker>
        </View>
      </View>

      {/* RECENT PROGRESS */}
      {progress.length > 0 && (
        <View style={styles.sectionWrap}>
          <ThemedText style={styles.sectionTitleMain}>Recent Assessments</ThemedText>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={progress.slice(0, 5)}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <View style={styles.progressCard}>
                <MaterialCommunityIcons name="chart-box-outline" size={22} color={PALETTE.accent} />
                <ThemedText style={styles.progressTitle} numberOfLines={1}>
                  {item.title || item.type || 'Progress'}
                </ThemedText>
                <ThemedText style={styles.progressSubText}>
                  {item.marksObtained} / {item.totalMarks}
                </ThemedText>
                <View style={[styles.progressBadge, { backgroundColor: getGradeColor(item.grade) }]}>
                  <ThemedText style={styles.progressBadgeText}>
                    {item.percentage ? `${Number(item.percentage).toFixed(0)}% (${item.grade})` : 'N/A'}
                  </ThemedText>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* RANKING */}
      {ranking.length > 0 && (
        <View style={styles.sectionWrap}>
          <ThemedText style={styles.sectionTitleMain}>Top Performers</ThemedText>
          {ranking.slice(0, 5).map((rankItem: any, index: number) => {
            // Map the ranking _id to the student array to get the name
            const student = students.find((s) => s._id === rankItem._id);
            const studentName = student?.user?.name || student?.name || 'Unknown Student';
            const isTop3 = index < 3;

            return (
              <View key={rankItem._id} style={styles.rankingCard}>
                <View style={[styles.rankNumberBadge, isTop3 && { backgroundColor: PALETTE.cta, borderColor: PALETTE.cta }]}>
                  <ThemedText style={[styles.rankNumberText, isTop3 && { color: PALETTE.surface }]}>
                    #{rankItem.rank || index + 1}
                  </ThemedText>
                </View>
                
                <View style={styles.rankingNameWrap}>
                  <ThemedText style={styles.rankingName}>{studentName}</ThemedText>
                  <ThemedText style={styles.rankingSub}>
                    {rankItem.obtainedMarks} / {rankItem.totalMarks} marks
                  </ThemedText>
                </View>
                
                <View style={styles.rankingScoreWrap}>
                  <ThemedText style={styles.rankingScore}>
                    {rankItem.percentage ? `${Number(rankItem.percentage).toFixed(1)}%` : ''}
                  </ThemedText>
                  <ThemedText style={[styles.rankingGrade, { color: getGradeColor(rankItem.grade) }]}>
                    {rankItem.grade}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <ThemedText style={[styles.sectionTitleMain, { marginTop: 16 }]}>Class Roster & Grades</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={(item: any) => String(item._id || item.user?._id || item.rollNumber || item.name)}
        ListHeaderComponent={header}
        renderItem={({ item }) => <StudentRow item={item} />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 120 },
  headerContainer: { gap: 12 },
  
  updateMarksBtn: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  updateMarksText: { color: PALETTE.surface, fontWeight: '700', fontSize: 16 },

  card: {
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    padding: 16,
  },
  
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroTextWrap: { flex: 1, marginLeft: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: PALETTE.textHeading },
  heroSubtitle: { fontSize: 13, color: PALETTE.textBody, marginTop: 4, fontWeight: '600' },
  heroMetaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 4, 
    backgroundColor: 'rgba(118,171,174,0.1)' 
  },
  chipText: { fontSize: 13, color: PALETTE.textHeading, fontWeight: '600' },

  metricGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: { fontSize: 22, fontWeight: '800', color: PALETTE.textHeading, marginTop: 8 },
  metricLabel: { fontSize: 12, color: PALETTE.textBody, marginTop: 4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.textHeading },
  sectionTitleMain: { fontSize: 18, fontWeight: '800', color: PALETTE.textHeading, marginBottom: 10 },
  sectionWrap: { marginTop: 16 },

  dropdownWrap: { 
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    borderRadius: 4, 
    backgroundColor: PALETTE.background,
    overflow: 'hidden' 
  },
  picker: { height: 50, color: PALETTE.textHeading },

  horizontalList: { gap: 12, paddingBottom: 8 },
  progressCard: {
    width: 150,
    padding: 16,
    borderRadius: 4,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  progressTitle: { fontSize: 14, fontWeight: '700', color: PALETTE.textHeading, marginTop: 8 },
  progressSubText: { fontSize: 12, color: PALETTE.textBody, marginTop: 4 },
  progressBadge: { 
    marginTop: 10, 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4,
  },
  progressBadgeText: { color: PALETTE.surface, fontWeight: '700', fontSize: 11 },

  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    borderRadius: 4,
    marginBottom: 8,
    gap: 12,
  },
  rankNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: { fontSize: 13, fontWeight: '800', color: PALETTE.textHeading },
  rankingNameWrap: { flex: 1 },
  rankingName: { fontSize: 15, fontWeight: '700', color: PALETTE.textHeading },
  rankingSub: { fontSize: 12, color: PALETTE.textBody, marginTop: 2 },
  rankingScoreWrap: { alignItems: 'flex-end' },
  rankingScore: { fontSize: 16, fontWeight: '800', color: PALETTE.textHeading },
  rankingGrade: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  rowItem: { 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    backgroundColor: PALETTE.surface,
    borderWidth: 1, 
    borderColor: PALETTE.border, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 8,
  },
  rowLeft: { flex: 1 },
  rowTextMain: { fontSize: 15, fontWeight: '700', color: PALETTE.textHeading, marginBottom: 4 },
  rowTextSub: { fontSize: 12, color: PALETTE.textBody },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowMarksWrap: { alignItems: 'flex-end' },
  rowPercentage: { fontSize: 14, fontWeight: '800', color: PALETTE.textHeading },
  rowMarks: { fontSize: 11, color: PALETTE.textBody, marginTop: 2 },
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: { fontSize: 14, fontWeight: '800' },
});