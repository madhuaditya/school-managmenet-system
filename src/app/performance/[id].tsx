// import { useCallback, useEffect, useMemo, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Linking,
//   Modal,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   View,
// } from 'react-native';
// import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
// import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';
// import type { UserRole } from '@/src/types';

// interface PerformanceItem {
//   _id: string;
//   title: string;
//   type: 'exam' | 'test' | 'assignment';
//   marksObtained: number;
//   totalMarks: number;
//   percentage?: number;
//   academicYear: string;
//   remarks?: string;
//   date?: string;
//   subject?: { _id: string; name: string; code?: string };
// }

// interface StudentBasic {
//   _id: string;
//   name?: string;
//   studentId?: string;
//   rollNumber?: string | number;
//   gender?: string;
// }

// const currentAcademicYear = () => {
//   const now = new Date();
//   const y = now.getFullYear();
//   const month = now.getMonth() + 1;
//   const start = month >= 4 ? y : y - 1;
//   return `${start}-${String(start + 1).slice(-2)}`;
// };

// const roleValue = (role: unknown): UserRole | null => {
//   if (!role) return null;
//   if (typeof role === 'string') return role as UserRole;
//   const typed = role as { role?: UserRole };
//   return typed.role || null;
// };

// const prettyType = (type: PerformanceItem['type']) => {
//   if (type === 'assignment') return 'Assignment';
//   if (type === 'test') return 'Test';
//   return 'Exam';
// };

// export default function StudentPerformanceScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router = useRouter();
//   const navigation = useNavigation();
//   const user = useAuthStore((s) => s.user);
//   const role = roleValue(user?.role);

//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [year, setYear] = useState(currentAcademicYear());
//   const [student, setStudent] = useState<StudentBasic | null>(null);
//   const [items, setItems] = useState<PerformanceItem[]>([]);
//   const [yearPickerVisible, setYearPickerVisible] = useState(false);

//   const years = useMemo(() => {
//     const now = new Date().getFullYear();
//     return Array.from({ length: 6 }).map((_, idx) => {
//       const start = now - idx;
//       return `${start}-${String(start + 1).slice(-2)}`;
//     });
//   }, []);

//   const loadData = useCallback(async () => {
//     if (!id) return;
//     try {
//       const [studentRes, perfRes] = await Promise.all([
//         apiService.getStudentById(id),
//         apiService.getStudentPerformance(id),
//       ]);

//       if (!studentRes.success || !studentRes.data) {
//         throw new Error(studentRes.msg || 'Unable to load student profile');
//       }

//       setStudent({
//         _id: (studentRes.data as unknown as { _id: string })._id,
//         name: (studentRes.data as unknown as { name?: string }).name,
//         studentId: (studentRes.data as unknown as { studentId?: string }).studentId,
//         rollNumber: (studentRes.data as unknown as { rollNumber?: string | number }).rollNumber,
//         gender: (studentRes.data as unknown as { gender?: string }).gender,
//       });

//       const perfData = (perfRes.data as unknown as PerformanceItem[]) || [];
//       setItems(Array.isArray(perfData) ? perfData : []);

//       navigation.setOptions({ title: `${(studentRes.data as { name?: string }).name || 'Student'} Performance` });
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load performance data');
//     }
//   }, [id, navigation]);

//   useEffect(() => {
//     const run = async () => {
//       try {
//         setLoading(true);
//         await loadData();
//       } finally {
//         setLoading(false);
//       }
//     };
//     void run();
//   }, [loadData]);

//   const onRefresh = useCallback(async () => {
//     try {
//       setRefreshing(true);
//       await loadData();
//     } finally {
//       setRefreshing(false);
//     }
//   }, [loadData]);

//   const onDelete = (item: PerformanceItem) => {
//     Alert.alert('Delete Performance', `Delete ${item.title}?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             const res = await apiService.deleteProgress(item._id);
//             if (!res.success) throw new Error(res.msg || 'Failed to delete');
//             setItems((prev) => prev.filter((p) => p._id !== item._id));
//           } catch (error) {
//             Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete performance');
//           }
//         },
//       },
//     ]);
//   };

//   const openReport = async (format: 'basic' | 'advanced' | 'styled' | 'cbse') => {
//     if (!id) return;
//     try {
//       const url = await apiService.getProgressReportDownloadUrl(format, id);
//       await Linking.openURL(url);
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Unable to open report URL');
//     }
//   };

//   const filteredItems = useMemo(
//     () => items.filter((p) => !year || p.academicYear === year),
//     [items, year],
//   );

//   const totals = useMemo(() => {
//     if (filteredItems.length === 0) return { count: 0, avg: 0 };
//     const sum = filteredItems.reduce((acc, item) => {
//       const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
//       return acc + pct;
//     }, 0);
//     return {
//       count: filteredItems.length,
//       avg: Number((sum / filteredItems.length).toFixed(2)),
//     };
//   }, [filteredItems]);

//   if (loading) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ActivityIndicator size="large" color={theme.tint} />
//       </ThemedView>
//     );
//   }

//   if (role !== 'admin' && role !== 'teacher') {
//     return (
//       <ThemedView style={styles.centered}>
//         <ThemedText type="subtitle">Access Denied</ThemedText>
//         <ThemedText>Only admin and teacher can manage student performance.</ThemedText>
//       </ThemedView>
//     );
//   }

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.content}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
//       <ThemedView style={[styles.heroCard, { borderColor: theme.icon }]}> 
//         <ThemedText type="subtitle" style={styles.heroTitle}>Performance Console</ThemedText>
//         <ThemedText style={styles.heroName}>{student?.name || 'Student'}</ThemedText>
//         <ThemedText style={styles.heroMeta}>
//           Student ID: {student?.studentId || 'N/A'} | Roll: {student?.rollNumber ?? 'N/A'}
//         </ThemedText>
//         <ThemedText style={styles.heroMeta}>Gender: {student?.gender || 'N/A'}</ThemedText>

//         <View style={styles.quickStatsRow}>
//           <View style={[styles.statBox, { backgroundColor: 'rgba(22,163,74,0.10)' }]}>
//             <ThemedText style={styles.statValue}>{totals.count}</ThemedText>
//             <ThemedText style={styles.statLabel}>Records</ThemedText>
//           </View>
//           <View style={[styles.statBox, { backgroundColor: 'rgba(2,132,199,0.10)' }]}>
//             <ThemedText style={styles.statValue}>{totals.avg}%</ThemedText>
//             <ThemedText style={styles.statLabel}>Avg %</ThemedText>
//           </View>
//         </View>

//         <Pressable
//           style={[styles.addButton, { backgroundColor: theme.tint }]}
//           onPress={() => router.push({ pathname: '/performance/add/[id]', params: { id: String(id) } })}>
//           <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
//           <ThemedText style={styles.addButtonText}>Add Performance</ThemedText>
//         </Pressable>
//       </ThemedView>

//       <ThemedView style={[styles.yearCard, { borderColor: theme.icon }]}> 
//         <ThemedText type="defaultSemiBold">Academic Year</ThemedText>
//         <Pressable
//           onPress={() => setYearPickerVisible(true)}
//           style={[styles.dropdownButton, { borderColor: theme.icon, backgroundColor: theme.background }]}
//         >
//           <ThemedText style={styles.dropdownText}>{year}</ThemedText>
//           <ThemedText style={styles.dropdownArrow}>⌄</ThemedText>
//         </Pressable>
//       </ThemedView>

//       <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
//         <Pressable style={styles.modalOverlay} onPress={() => setYearPickerVisible(false)}>
//           <Pressable style={[styles.modalCard, { backgroundColor: theme.background }]} onPress={() => undefined}>
//             <ThemedText type="subtitle">Select Academic Year</ThemedText>
//             <ScrollView>
//               {years.map((itemYear) => {
//                 const selected = itemYear === year;
//                 return (
//                   <Pressable
//                     key={itemYear}
//                     onPress={() => {
//                       setYear(itemYear);
//                       setYearPickerVisible(false);
//                     }}
//                     style={[styles.modalItem, selected && { backgroundColor: theme.tint }]}
//                   >
//                     <ThemedText style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{itemYear}</ThemedText>
//                   </Pressable>
//                 );
//               })}
//             </ScrollView>
//           </Pressable>
//         </Pressable>
//       </Modal>

//       <ThemedView style={[styles.reportCard, { borderColor: theme.icon }]}> 
//         <ThemedText type="defaultSemiBold">Download PDF (Different Formats)</ThemedText>
//         <View style={styles.reportButtonsRow}>
//           <Pressable style={[styles.reportBtn, { backgroundColor: '#1d4ed8' }]} onPress={() => void openReport('basic')}>
//             <ThemedText style={styles.reportBtnText}>Basic</ThemedText>
//           </Pressable>
//           <Pressable style={[styles.reportBtn, { backgroundColor: '#0f766e' }]} onPress={() => void openReport('advanced')}>
//             <ThemedText style={styles.reportBtnText}>Advanced</ThemedText>
//           </Pressable>
//           <Pressable style={[styles.reportBtn, { backgroundColor: '#7c3aed' }]} onPress={() => void openReport('styled')}>
//             <ThemedText style={styles.reportBtnText}>Styled</ThemedText>
//           </Pressable>
//           <Pressable style={[styles.reportBtn, { backgroundColor: '#b45309' }]} onPress={() => void openReport('cbse')}>
//             <ThemedText style={styles.reportBtnText}>CBSE</ThemedText>
//           </Pressable>
//         </View>
//       </ThemedView>

//       {filteredItems.length === 0 ? (
//         <ThemedView style={[styles.emptyCard, { borderColor: theme.icon }]}> 
//           <ThemedText>No performance records for {year}.</ThemedText>
//         </ThemedView>
//       ) : (
//         filteredItems.map((item) => {
//           const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
//           const pctColor = pct >= 85 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626';
//           return (
//             <ThemedView key={item._id} style={[styles.itemCard, { borderColor: theme.icon }]}> 
//               <View style={styles.itemTopRow}>
//                 <View style={{ flex: 1 }}>
//                   <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
//                   <ThemedText style={styles.itemSub}>
//                     {item.subject?.name || 'Subject'} • {prettyType(item.type)} • {item.academicYear}
//                   </ThemedText>
//                 </View>
//                 <View style={[styles.pill, { backgroundColor: `${pctColor}22` }]}>
//                   <ThemedText style={[styles.pillText, { color: pctColor }]}>{pct.toFixed(1)}%</ThemedText>
//                 </View>
//               </View>

//               <ThemedText style={styles.scoreLine}>Score: {item.marksObtained} / {item.totalMarks}</ThemedText>
//               {!!item.remarks && <ThemedText style={styles.remarks}>Remarks: {item.remarks}</ThemedText>}

//               <View style={styles.itemActionsRow}>
//                 <Pressable
//                   style={[styles.itemActionBtn, { backgroundColor: '#1d4ed8' }]}
//                   onPress={() =>
//                     router.push({
//                       pathname: '/performance/edit/[progressId]',
//                       params: { progressId: item._id, studentId: String(id) },
//                     })
//                   }>
//                   <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
//                   <ThemedText style={styles.itemActionText}>Update</ThemedText>
//                 </Pressable>

//                 <Pressable
//                   style={[styles.itemActionBtn, { backgroundColor: '#dc2626' }]}
//                   onPress={() => onDelete(item)}>
//                   <MaterialCommunityIcons name="delete" size={16} color="#fff" />
//                   <ThemedText style={styles.itemActionText}>Delete</ThemedText>
//                 </Pressable>
//               </View>
//             </ThemedView>
//           );
//         })
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   centered: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     padding: 16,
//   },
//   content: {
//     padding: 16,
//     gap: 12,
//     paddingBottom: 32,
//   },
//   heroCard: {
//     borderWidth: 1,
//     borderRadius: 16,
//     padding: 16,
//     gap: 10,
//     backgroundColor: 'rgba(30,64,175,0.05)',
//   },
//   heroTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   heroName: {
//     fontSize: 22,
//     fontWeight: '800',
//   },
//   heroMeta: {
//     fontSize: 12,
//     opacity: 0.75,
//   },
//   quickStatsRow: {
//     flexDirection: 'row',
//     gap: 10,
//   },
//   statBox: {
//     flex: 1,
//     borderRadius: 12,
//     paddingVertical: 10,
//     alignItems: 'center',
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: '800',
//   },
//   statLabel: {
//     fontSize: 12,
//     opacity: 0.7,
//   },
//   addButton: {
//     marginTop: 4,
//     minHeight: 44,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 8,
//   },
//   addButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   yearCard: {
//     borderWidth: 1,
//     borderRadius: 14,
//     padding: 14,
//     gap: 10,
//   },
//   chipsRow: {
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
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   dropdownText: {
//     fontWeight: '700',
//   },
//   dropdownArrow: {
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   reportCard: {
//     borderWidth: 1,
//     borderRadius: 14,
//     padding: 14,
//     gap: 10,
//   },
//   reportButtonsRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   reportBtn: {
//     borderRadius: 10,
//     minHeight: 36,
//     minWidth: 84,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 12,
//   },
//   reportBtnText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '800',
//   },
//   emptyCard: {
//     borderWidth: 1,
//     borderRadius: 14,
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   itemCard: {
//     borderWidth: 1,
//     borderRadius: 14,
//     padding: 14,
//     gap: 8,
//   },
//   itemTopRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   itemSub: {
//     marginTop: 2,
//     fontSize: 12,
//     opacity: 0.75,
//   },
//   scoreLine: {
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   remarks: {
//     fontSize: 12,
//     opacity: 0.8,
//   },
//   pill: {
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//   },
//   pillText: {
//     fontSize: 12,
//     fontWeight: '800',
//   },
//   itemActionsRow: {
//     marginTop: 2,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   itemActionBtn: {
//     flex: 1,
//     minHeight: 36,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 6,
//   },
//   itemActionText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '700',
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
//     maxHeight: '60%',
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
//   modalItemTextSelected: {
//     color: '#fff',
//   },
// });

// import { useCallback, useEffect, useMemo, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Linking,
//   Modal,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   View,
//   Text,
// } from 'react-native';
// import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
// import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// import { apiService } from '@/api/client';
// import { useAuthStore } from '@/src/store/auth.store';
// import type { UserRole } from '@/src/types';

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

// interface PerformanceItem {
//   _id: string;
//   title: string;
//   type: 'exam' | 'test' | 'assignment';
//   marksObtained: number;
//   totalMarks: number;
//   percentage?: number;
//   academicYear: string;
//   remarks?: string;
//   date?: string;
//   subject?: { _id: string; name: string; code?: string };
// }

// interface StudentBasic {
//   _id: string;
//   name?: string;
//   studentId?: string;
//   rollNumber?: string | number;
//   gender?: string;
// }

// const currentAcademicYear = () => {
//   const now = new Date();
//   const y = now.getFullYear();
//   const month = now.getMonth() + 1;
//   const start = month >= 4 ? y : y - 1;
//   return `${start}-${String(start + 1).slice(-2)}`;
// };

// const roleValue = (role: unknown): UserRole | null => {
//   if (!role) return null;
//   if (typeof role === 'string') return role as UserRole;
//   const typed = role as { role?: UserRole };
//   return typed.role || null;
// };

// const prettyType = (type: PerformanceItem['type']) => {
//   if (type === 'assignment') return 'Assignment';
//   if (type === 'test') return 'Test';
//   return 'Exam';
// };

// export default function StudentPerformanceScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router = useRouter();
//   const navigation = useNavigation();
//   const user = useAuthStore((s) => s.user);
//   const role = roleValue(user?.role);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [year, setYear] = useState(currentAcademicYear());
//   const [student, setStudent] = useState<StudentBasic | null>(null);
//   const [items, setItems] = useState<PerformanceItem[]>([]);
//   const [yearPickerVisible, setYearPickerVisible] = useState(false);

//   const years = useMemo(() => {
//     const now = new Date().getFullYear();
//     return Array.from({ length: 6 }).map((_, idx) => {
//       const start = now - idx;
//       return `${start}-${String(start + 1).slice(-2)}`;
//     });
//   }, []);

//   const loadData = useCallback(async () => {
//     // console.log('Loading performance data for student ID:', id);
//     if (!id) return;
//     try {
//       const [studentRes, perfRes] = await Promise.all([
//         apiService.getStudentById(id),
//         apiService.getStudentPerformance(id),
//       ]);
//       // console.log('Student Response:', studentRes);
//       // console.log('Performance Response:', perfRes);

//       if (!studentRes.success || !studentRes.data) {
//         throw new Error(studentRes.msg || 'Unable to load student profile');
//       }

//       setStudent({
//         _id: (studentRes.data as unknown as { _id: string })._id,
//         name: (studentRes.data as unknown as { name?: string }).name,
//         studentId: (studentRes.data as unknown as { studentId?: string }).studentId,
//         rollNumber: (studentRes.data as unknown as { rollNumber?: string | number }).rollNumber,
//         gender: (studentRes.data as unknown as { gender?: string }).gender,
//       });

//       const perfData = (perfRes.data as unknown as PerformanceItem[]) || [];
//       setItems(Array.isArray(perfData) ? perfData : []);

//       navigation.setOptions({ title: `${(studentRes.data as { name?: string }).name || 'Student'} Performance` });
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load performance data');
//     }
//   }, [id, navigation]);

//   useEffect(() => {
//     const run = async () => {
//       try {
//         setLoading(true);
//         await loadData();
//       } finally {
//         setLoading(false);
//       }
//     };
//     void run();
//   }, [loadData]);

//   const onRefresh = useCallback(async () => {
//     try {
//       setRefreshing(true);
//       await loadData();
//     } finally {
//       setRefreshing(false);
//     }
//   }, [loadData]);

//   const onDelete = (item: PerformanceItem) => {
//     Alert.alert('Delete Performance', `Delete ${item.title}?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             const res = await apiService.deleteProgress(item._id);
//             if (!res.success) throw new Error(res.msg || 'Failed to delete');
//             setItems((prev) => prev.filter((p) => p._id !== item._id));
//           } catch (error) {
//             Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete performance');
//           }
//         },
//       },
//     ]);
//   };

//   const openReport = async (format: 'basic' | 'advanced' | 'styled' | 'cbse') => {
//     if (!id) return;
//     try {
//       const url = await apiService.getProgressReportDownloadUrl(format, id);
//       await Linking.openURL(url);
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Unable to open report URL');
//     }
//   };

//   const filteredItems = useMemo(
//     () => items.filter((p) => !year || p.academicYear === year),
//     [items, year],
//   );

//   const totals = useMemo(() => {
//     if (filteredItems.length === 0) return { count: 0, avg: 0 };
//     const sum = filteredItems.reduce((acc, item) => {
//       const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
//       return acc + pct;
//     }, 0);
//     return {
//       count: filteredItems.length,
//       avg: Number((sum / filteredItems.length).toFixed(2)),
//     };
//   }, [filteredItems]);

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={PALETTE.accent} />
//       </View>
//     );
//   }

//   if (role !== 'admin' && role !== 'teacher') {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.sectionTitle}>Access Denied</Text>
//         <Text style={styles.mutedText}>Only admin and teacher can manage student performance.</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.content}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.accent} />}>
      
//       <View style={styles.heroCard}> 
//         <Text style={styles.heroTitle}>Performance Console</Text>
//         <Text style={styles.heroName}>{student?.name || 'Student'}</Text>
//         <Text style={styles.heroMeta}>
//           Student ID: {student?.studentId || 'N/A'} | Roll: {student?.rollNumber ?? 'N/A'}
//         </Text>
//         <Text style={styles.heroMeta}>Gender: {student?.gender || 'N/A'}</Text>

//         <View style={styles.quickStatsRow}>
//           <View style={styles.statBox}>
//             <Text style={[styles.statValue, { color: PALETTE.primary }]}>{totals.count}</Text>
//             <Text style={styles.statLabel}>Records</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={[styles.statValue, { color: PALETTE.success }]}>{totals.avg}%</Text>
//             <Text style={styles.statLabel}>Avg %</Text>
//           </View>
//         </View>

//         <Pressable
//           style={({ pressed }) => [styles.addButton, pressed && styles.pressedOpacity]}
//           onPress={() => router.push({ pathname: '/performance/add/[id]', params: { id: String(id) } })}>
//           <MaterialCommunityIcons name="plus" size={18} color="#fff" />
//           <Text style={styles.addButtonText}>Add Performance</Text>
//         </Pressable>
//       </View>

//       <View style={styles.card}> 
//         <Text style={styles.sectionTitle}>Academic Year</Text>
//         <Pressable
//           onPress={() => setYearPickerVisible(true)}
//           style={({ pressed }) => [styles.dropdownButton, pressed && styles.pressedOpacity]}
//         >
//           <Text style={styles.dropdownText}>{year}</Text>
//           <Text style={styles.dropdownArrow}>⌄</Text>
//         </Pressable>
//       </View>

//       <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
//         <Pressable style={styles.modalOverlay} onPress={() => setYearPickerVisible(false)}>
//           <Pressable style={styles.modalCard} onPress={() => undefined}>
//             <Text style={styles.sectionTitle}>Select Academic Year</Text>
//             <ScrollView showsVerticalScrollIndicator={false}>
//               {years.map((itemYear) => {
//                 const selected = itemYear === year;
//                 return (
//                   <Pressable
//                     key={itemYear}
//                     onPress={() => {
//                       setYear(itemYear);
//                       setYearPickerVisible(false);
//                     }}
//                     style={({ pressed }) => [
//                       styles.modalItem, 
//                       selected && styles.modalItemSelected,
//                       pressed && styles.pressedOpacity
//                     ]}
//                   >
//                     <Text style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{itemYear}</Text>
//                   </Pressable>
//                 );
//               })}
//             </ScrollView>
//           </Pressable>
//         </Pressable>
//       </Modal>

//       <View style={styles.card}> 
//         <Text style={styles.sectionTitle}>Download PDF Reports</Text>
//         <View style={styles.reportButtonsRow}>
//           <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('basic')}>
//             <Text style={styles.reportBtnText}>Basic</Text>
//           </Pressable>
//           <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('advanced')}>
//             <Text style={styles.reportBtnText}>Advanced</Text>
//           </Pressable>
//           <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('styled')}>
//             <Text style={styles.reportBtnText}>Styled</Text>
//           </Pressable>
//           <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('cbse')}>
//             <Text style={styles.reportBtnText}>CBSE</Text>
//           </Pressable>
//         </View>
//       </View>

//       {filteredItems.length === 0 ? (
//         <View style={styles.emptyCard}> 
//           <Text style={styles.mutedText}>No performance records for {year}.</Text>
//         </View>
//       ) : (
//         filteredItems.map((item) => {
//           const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
//           const pctColor = pct >= 85 ? PALETTE.success : pct >= 60 ? PALETTE.warning : PALETTE.error;
          
//           return (
//             <View key={item._id} style={styles.itemCard}> 
//               <View style={styles.itemTopRow}>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.itemTitle}>{item.title}</Text>
//                   <Text style={styles.itemSub}>
//                     {item.subject?.name || 'Subject'} • {prettyType(item.type)} • {item.academicYear}
//                   </Text>
//                 </View>
//                 <View style={[styles.pill, { backgroundColor: `${pctColor}15`, borderColor: `${pctColor}40` }]}>
//                   <Text style={[styles.pillText, { color: pctColor }]}>{pct.toFixed(1)}%</Text>
//                 </View>
//               </View>

//               <Text style={styles.scoreLine}>Score: {item.marksObtained} / {item.totalMarks}</Text>
//               {!!item.remarks && <Text style={styles.remarks}>Remarks: {item.remarks}</Text>}

//               <View style={styles.itemActionsRow}>
//                 <Pressable
//                   style={({ pressed }) => [styles.itemActionBtn, styles.editBtn, pressed && styles.pressedOpacity]}
//                   onPress={() =>
//                     router.push({
//                       pathname: '/performance/edit/[progressId]',
//                       params: { progressId: item._id, studentId: String(id) },
//                     })
//                   }>
//                   <MaterialCommunityIcons name="pencil" size={14} color={PALETTE.surface} />
//                   <Text style={styles.itemActionText}>Update</Text>
//                 </Pressable>

//                 <Pressable
//                   style={({ pressed }) => [styles.itemActionBtn, styles.deleteBtn, pressed && styles.pressedOpacity]}
//                   onPress={() => onDelete(item)}>
//                   <MaterialCommunityIcons name="delete" size={14} color={PALETTE.error} />
//                   <Text style={styles.itemActionTextDanger}>Delete</Text>
//                 </Pressable>
//               </View>
//             </View>
//           );
//         })
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: PALETTE.background,
//   },
//   content: {
//     padding: 16,
//     gap: 16,
//     paddingBottom: 50,
//   },
//   centered: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     padding: 24,
//     backgroundColor: PALETTE.background,
//   },
//   pressedOpacity: {
//     opacity: 0.8,
//   },

//   /* TEXT STYLES */
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: PALETTE.textHeading,
//   },
//   mutedText: {
//     fontSize: 13,
//     color: PALETTE.textBody,
//   },

//   /* HERO CARD */
//   heroCard: {
//     borderWidth: 1,
//     borderRadius: 4,
//     padding: 16,
//     gap: 8,
//     backgroundColor: PALETTE.surface,
//     borderColor: PALETTE.border,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.02,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   heroTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: PALETTE.textBody,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   heroName: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: PALETTE.textHeading,
//   },
//   heroMeta: {
//     fontSize: 13,
//     color: PALETTE.textBody,
//   },
//   quickStatsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginTop: 8,
//   },
//   statBox: {
//     flex: 1,
//     borderRadius: 4,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//     backgroundColor: PALETTE.background,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: '800',
//   },
//   statLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: PALETTE.textBody,
//     marginTop: 2,
//   },
//   addButton: {
//     marginTop: 8,
//     minHeight: 44,
//     borderRadius: 4,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 8,
//     backgroundColor: PALETTE.cta,
//   },
//   addButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '700',
//   },

//   /* STANDARD CARDS */
//   card: {
//     borderWidth: 1,
//     borderRadius: 4,
//     padding: 16,
//     gap: 12,
//     backgroundColor: PALETTE.surface,
//     borderColor: PALETTE.border,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.02,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   emptyCard: {
//     borderWidth: 1,
//     borderRadius: 4,
//     padding: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: PALETTE.surface,
//     borderColor: PALETTE.border,
//   },
  
//   /* FORM ELEMENTS */
//   dropdownButton: {
//     borderWidth: 1,
//     borderRadius: 4,
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderColor: PALETTE.border,
//     backgroundColor: PALETTE.background,
//   },
//   dropdownText: {
//     fontWeight: '600',
//     fontSize: 14,
//     color: PALETTE.textHeading,
//   },
//   dropdownArrow: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: PALETTE.textBody,
//   },

//   /* REPORT BUTTONS */
//   reportButtonsRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   reportBtn: {
//     borderRadius: 4,
//     minHeight: 36,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//     backgroundColor: PALETTE.background,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 16,
//   },
//   reportBtnText: {
//     color: PALETTE.textHeading,
//     fontSize: 13,
//     fontWeight: '600',
//   },

//   /* PERFORMANCE ITEMS */
//   itemCard: {
//     borderWidth: 1,
//     borderRadius: 4,
//     padding: 16,
//     gap: 10,
//     backgroundColor: PALETTE.surface,
//     borderColor: PALETTE.border,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.02,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   itemTopRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   itemTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: PALETTE.textHeading,
//   },
//   itemSub: {
//     marginTop: 2,
//     fontSize: 12,
//     color: PALETTE.textBody,
//   },
//   scoreLine: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: PALETTE.textHeading,
//   },
//   remarks: {
//     fontSize: 13,
//     color: PALETTE.textBody,
//   },
//   pill: {
//     borderRadius: 4,
//     borderWidth: 1,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//   },
//   pillText: {
//     fontSize: 13,
//     fontWeight: '800',
//   },
//   itemActionsRow: {
//     marginTop: 8,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   itemActionBtn: {
//     flex: 1,
//     minHeight: 40,
//     borderRadius: 4,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 6,
//     borderWidth: 1,
//   },
//   editBtn: {
//     backgroundColor: PALETTE.primary,
//     borderColor: PALETTE.primary,
//   },
//   deleteBtn: {
//     backgroundColor: 'rgba(211, 47, 47, 0.05)',
//     borderColor: 'rgba(211, 47, 47, 0.3)',
//   },
//   itemActionText: {
//     color: PALETTE.surface,
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   itemActionTextDanger: {
//     color: PALETTE.error,
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   /* MODAL */
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(48, 56, 65, 0.6)',
//     justifyContent: 'flex-end',
//   },
//   modalCard: {
//     borderTopLeftRadius: 8,
//     borderTopRightRadius: 8,
//     padding: 20,
//     maxHeight: '60%',
//     gap: 12,
//     backgroundColor: PALETTE.surface,
//   },
//   modalItem: {
//     borderRadius: 4,
//     paddingVertical: 14,
//     paddingHorizontal: 12,
//     marginTop: 8,
//     backgroundColor: PALETTE.background,
//     borderWidth: 1,
//     borderColor: PALETTE.border,
//   },
//   modalItemSelected: {
//     backgroundColor: 'rgba(118, 171, 174, 0.1)',
//     borderColor: PALETTE.accent,
//   },
//   modalItemText: {
//     fontWeight: '600',
//     color: PALETTE.textHeading,
//     fontSize: 14,
//   },
//   modalItemTextSelected: {
//     color: PALETTE.primary,
//   },
// });

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import type { UserRole } from '@/src/types';

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

interface PerformanceItem {
  _id: string;
  title: string;
  type: 'exam' | 'test' | 'assignment';
  marksObtained: number;
  totalMarks: number;
  percentage?: number;
  academicYear: string;
  remarks?: string;
  date?: string;
  grade?: string;
  subject?: { _id: string; name: string; code?: string };
}

interface StudentBasic {
  _id: string;
  name?: string;
  studentId?: string;
  rollNumber?: string | number;
  gender?: string;
}

interface SummaryData {
  totalMarks: number;
  obtainedMarks: number;
  avgPercentage: string | number;
  recordCount: number;
  grade: string;
}

const currentAcademicYear = () => {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 4 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const roleValue = (role: unknown): UserRole | null => {
  if (!role) return null;
  if (typeof role === 'string') return role as UserRole;
  const typed = role as { role?: UserRole };
  return typed.role || null;
};

const prettyType = (type: PerformanceItem['type']) => {
  if (type === 'assignment') return 'Assignment';
  if (type === 'test') return 'Test';
  return 'Exam';
};

const getGradeColor = (grade?: string, percentage?: number) => {
  if (grade) {
    const g = grade.toUpperCase();
    if (g.includes('A')) return PALETTE.success;
    if (g.includes('B') || g.includes('C')) return PALETTE.warning;
    if (g.includes('D') || g.includes('E') || g.includes('F') || g.includes('FAIL')) return PALETTE.error;
  }
  if (percentage != null) {
    if (percentage >= 80) return PALETTE.success;
    if (percentage >= 50) return PALETTE.warning;
    return PALETTE.error;
  }
  return PALETTE.accent;
};

export default function StudentPerformanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const role = roleValue(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [year, setYear] = useState(currentAcademicYear());
  const [student, setStudent] = useState<StudentBasic | null>(null);
  const [items, setItems] = useState<PerformanceItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }).map((_, idx) => {
      const start = now - idx;
      return `${start}-${String(start + 1).slice(-2)}`;
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [studentRes, perfRes] = await Promise.all([
        apiService.getStudentById(id),
        apiService.getStudentPerformance(id),
      ]);

      if (!studentRes.success || !studentRes.data) {
        throw new Error(studentRes.msg || 'Unable to load student profile');
      }

      // Safe mapping for student data
      const sData: any = studentRes.data;
      setStudent({
        _id: sData._id,
        name: sData.name || sData.user?.name,
        studentId: sData.studentId,
        rollNumber: sData.rollNumber,
        gender: sData.gender || sData.user?.gender,
      });

      navigation.setOptions({ title: `${sData.name || sData.user?.name || 'Student'} Analytics` });

      // Safe mapping for performance records and summary based on the provided JSON
      const perfDataObj: any = perfRes.data || {};
      const records = Array.isArray(perfDataObj.records) ? perfDataObj.records : [];
      setItems(records);
      setSummary(perfDataObj.summary || null);

    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load performance data');
    }
  }, [id, navigation]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await loadData();
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const openReport = async (format: 'basic' | 'advanced' | 'styled' | 'cbse') => {
    if (!id) return;
    try {
      const url = await apiService.getProgressReportDownloadUrl(format, id);
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to open report URL');
    }
  };

  const filteredItems = useMemo(
    () => items.filter((p) => !year || p.academicYear === year),
    [items, year],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  if (role !== 'admin' && role !== 'teacher') {
    return (
      <View style={styles.centered}>
        <Text style={styles.sectionTitle}>Access Denied</Text>
        <Text style={styles.mutedText}>Only admin and teacher can view detailed performance.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.accent} />}>
      
      {/* STUDENT HERO CARD */}
      <View style={styles.heroCard}> 
        <View style={styles.heroTop}>
          <MaterialCommunityIcons name="account-school" size={40} color={PALETTE.accent} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Performance Console</Text>
            <Text style={styles.heroName}>{student?.name || 'Student'}</Text>
            <Text style={styles.heroMeta}>ID: {student?.studentId || 'N/A'} • Roll: {student?.rollNumber ?? 'N/A'}</Text>
          </View>
        </View>

        {summary && (
          <View style={styles.quickStatsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: PALETTE.primary }]}>{summary.recordCount || 0}</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: PALETTE.cta }]}>
                {summary.avgPercentage ? `${Number(summary.avgPercentage).toFixed(1)}%` : '0%'}
              </Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: getGradeColor(summary.grade) }]}>{summary.grade || '-'}</Text>
              <Text style={styles.statLabel}>Grade</Text>
            </View>
          </View>
        )}
      </View>

      {/* FILTER ACADEMIC YEAR */}
      <View style={styles.card}> 
        <Text style={styles.sectionTitle}>Academic Year</Text>
        <Pressable
          onPress={() => setYearPickerVisible(true)}
          style={({ pressed }) => [styles.dropdownButton, pressed && styles.pressedOpacity]}
        >
          <Text style={styles.dropdownText}>{year}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={PALETTE.textBody} />
        </Pressable>
      </View>

      <Modal visible={yearPickerVisible} transparent animationType="fade" onRequestClose={() => setYearPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setYearPickerVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.sectionTitle}>Select Academic Year</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {years.map((itemYear) => {
                const selected = itemYear === year;
                return (
                  <Pressable
                    key={itemYear}
                    onPress={() => {
                      setYear(itemYear);
                      setYearPickerVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalItem, 
                      selected && styles.modalItemSelected,
                      pressed && styles.pressedOpacity
                    ]}
                  >
                    <Text style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{itemYear}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* RECENT PERFORMANCE CHART */}
      {filteredItems.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Performance Trend</Text>
          <Text style={styles.mutedText}>Most recent assessments for {year}</Text>
          
          <View style={styles.chartContainer}>
            {filteredItems.slice(0, 6).reverse().map((item, index) => {
              const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
              const barColor = getGradeColor(item.grade, pct);
              
              return (
                <View key={item._id || index} style={styles.chartRow}>
                  <Text style={styles.chartLabel} numberOfLines={1}>
                    {item.subject?.name || 'Sub'}
                  </Text>
                  <View style={styles.chartBarWrapper}>
                    <View style={[styles.chartBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.chartValue}>{pct.toFixed(0)}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* DOWNLOAD REPORTS */}
      {/* <View style={styles.card}> 
        <Text style={styles.sectionTitle}>Download Report Cards</Text>
        <View style={styles.reportButtonsRow}>
          <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('basic')}>
            <Ionicons name="document-text-outline" size={16} color={PALETTE.textHeading} />
            <Text style={styles.reportBtnText}>Basic</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('cbse')}>
            <Ionicons name="school-outline" size={16} color={PALETTE.textHeading} />
            <Text style={styles.reportBtnText}>CBSE</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.reportBtn, pressed && styles.pressedOpacity]} onPress={() => void openReport('styled')}>
            <Ionicons name="color-palette-outline" size={16} color={PALETTE.textHeading} />
            <Text style={styles.reportBtnText}>Styled</Text>
          </Pressable>
        </View>
      </View> */}

      {/* RECORD LIST */}
      <Text style={styles.listTitle}>Detailed Records</Text>
      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}> 
          <Text style={styles.mutedText}>No performance records for {year}.</Text>
        </View>
      ) : (
        filteredItems.map((item) => {
          const pct = typeof item.percentage === 'number' ? item.percentage : (item.marksObtained / item.totalMarks) * 100;
          const pctColor = getGradeColor(item.grade, pct);
          
          return (
            <View key={item._id} style={styles.itemCard}> 
              <View style={styles.itemTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>
                    {item.subject?.name || 'Subject'} • {prettyType(item.type)} • {item.academicYear}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: `${pctColor}15`, borderColor: `${pctColor}40` }]}>
                  <Text style={[styles.pillText, { color: pctColor }]}>{pct.toFixed(1)}%</Text>
                </View>
              </View>

              <View style={styles.scoreRow}>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreLabel}>Obtained</Text>
                  <Text style={styles.scoreValueMain}>{item.marksObtained}</Text>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreLabel}>Maximum</Text>
                  <Text style={styles.scoreValueSub}>{item.totalMarks}</Text>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={styles.scoreLabel}>Grade</Text>
                  <Text style={[styles.scoreValueMain, { color: pctColor }]}>{item.grade || '-'}</Text>
                </View>
              </View>
              
              {!!item.remarks && (
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksText}><Text style={{fontWeight: '700'}}>Remarks:</Text> {item.remarks}</Text>
                </View>
              )}
            </View>
          );
        })
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: PALETTE.background,
  },
  pressedOpacity: {
    opacity: 0.8,
  },

  /* TEXT STYLES */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textHeading,
    marginTop: 8,
    marginBottom: -8,
  },
  mutedText: {
    fontSize: 13,
    color: PALETTE.textBody,
    marginTop: 2,
  },

  /* HERO CARD */
  heroCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textBody,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textHeading,
    marginTop: 2,
  },
  heroMeta: {
    fontSize: 13,
    color: PALETTE.textBody,
    marginTop: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
  },
  statBox: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.background,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textBody,
    marginTop: 2,
  },

  /* CHARTS */
  chartContainer: {
    marginTop: 16,
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartLabel: {
    width: 65,
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  chartBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: PALETTE.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartValue: {
    width: 35,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },

  /* STANDARD CARDS */
  card: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
  },
  
  /* FORM ELEMENTS */
  dropdownButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.background,
  },
  dropdownText: {
    fontWeight: '600',
    fontSize: 14,
    color: PALETTE.textHeading,
  },

  /* REPORT BUTTONS */
  reportButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  reportBtn: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 4,
    minHeight: 36,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  reportBtnText: {
    color: PALETTE.textHeading,
    fontSize: 13,
    fontWeight: '600',
  },

  /* PERFORMANCE ITEMS */
  itemCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  itemSub: {
    marginTop: 2,
    fontSize: 12,
    color: PALETTE.textBody,
  },
  scoreRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    justifyContent: 'space-between',
  },
  scoreBlock: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 11,
    color: PALETTE.textBody,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreValueMain: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textHeading,
    marginTop: 4,
  },
  scoreValueSub: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textBody,
    marginTop: 4,
  },
  remarksBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: PALETTE.background,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  remarksText: {
    fontSize: 13,
    color: PALETTE.textBody,
    lineHeight: 18,
  },
  pill: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(48, 56, 65, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 20,
    maxHeight: '60%',
    gap: 12,
    backgroundColor: PALETTE.surface,
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
    color: PALETTE.textHeading,
    fontSize: 14,
  },
  modalItemTextSelected: {
    color: PALETTE.primary,
  },
});