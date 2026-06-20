// import { useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
// import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import { useNavigation } from 'expo-router';
// import { Calendar } from 'react-native-calendars';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';
// import type { UserRole } from '@/src/types';

// type AttendanceStatus = 'present' | 'absent' | 'leave';

// interface AttendanceRow {
//   _id?: string;
//   date: string;
//   status: AttendanceStatus;
//   remarks?: string;
// }

// interface AttendanceSummary {
//   total: number;
//   present: number;
//   absent: number;
//   leave: number;
// }

// interface TargetProfile {
//   _id: string;
//   name?: string;
//   role?: UserRole | { role?: UserRole };
// }

// const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// const MONTH_NAMES = [
//   'January',
//   'February',
//   'March',
//   'April',
//   'May',
//   'June',
//   'July',
//   'August',
//   'September',
//   'October',
//   'November',
//   'December',
// ];

// const getRoleValue = (role?: TargetProfile['role']): UserRole | null => {
//   if (!role) return null;
//   if (typeof role === 'string') return role;
//   return role.role || null;
// };

// const normalizeId = (value: unknown): string => {
//   if (!value) return '';
//   if (typeof value === 'string') return value;
//   if (typeof value === 'object' && value !== null) {
//     const obj = value as { toString?: () => string; buffer?: { data?: number[] } };
//     if (obj.buffer?.data && Array.isArray(obj.buffer.data)) {
//       return obj.buffer.data.map((b) => Number(b).toString(16).padStart(2, '0')).join('');
//     }
//     if (typeof obj.toString === 'function') {
//       const text = obj.toString();
//       if (text && text !== '[object Object]') return text;
//     }
//   }
//   return String(value);
// };

// const asDateOnly = (iso: string) => {
//   const d = new Date(iso);
//   return new Date(d.getFullYear(), d.getMonth(), d.getDate());
// };

// export default function AttendanceDetailByMemberScreen() {
//   const id = useAuthStore((s) => s.user?._id) || '';
//   const user = useAuthStore((s) => s.user);
//   const navigation = useNavigation();
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
//   const currentUser = useAuthStore((s) => s.user);

//   const [loading, setLoading] = useState(true);
//   const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
//   const [records, setRecords] = useState<AttendanceRow[]>([]);
//   const [summary, setSummary] = useState<AttendanceSummary | null>(null);
//   const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
//   const [year, setYear] = useState<number>(new Date().getFullYear());
//   const [selectedDate, setSelectedDate] = useState<string>('');

//   const currentRole = useMemo<UserRole | null>(() => {
//     if (!currentUser?.role) return null;
//     if (typeof currentUser.role === 'string') return currentUser.role;
//     return currentUser.role.role;
//   }, [currentUser]);

//   const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
//   const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);
//   const today = new Date();
//   const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
//   const consideredDays = isCurrentMonth ? today.getDate() : daysInMonth;

//   const byDate = useMemo(() => {
//     const map = new Map<string, AttendanceStatus>();
//     for (const rec of records) {
//       const key = new Date(rec.date).toISOString().slice(0, 10);
//       map.set(key, rec.status);
//     }
//     return map;
//   }, [records]);

//   const computed = useMemo(() => {
//     let present = 0;
//     let absent = 0;
//     let leave = 0;
//     let marked = 0;

//     for (let day = 1; day <= consideredDays; day += 1) {
//       const key = new Date(year, month - 1, day).toISOString().slice(0, 10);
//       const status = byDate.get(key);
//       if (!status) continue;
//       marked += 1;
//       if (status === 'present') present += 1;
//       else if (status === 'absent') absent += 1;
//       else leave += 1;
//     }

//     const unmarked = Math.max(0, consideredDays - marked);
//     return { present, absent, leave, unmarked, marked };
//   }, [byDate, consideredDays, month, year]);

//   useEffect(() => {
//     if (!id) return;
//     void fetchTargetProfile();
//   }, [id]);

//   useEffect(() => {
//     if (!id || !targetProfile) return;
//     if (!isAuthorized(currentRole, currentUser?._id, targetProfile)) {
//       setLoading(false);
//       return;
//     }
//     void fetchAttendance();
//   }, [id, month, year, targetProfile, currentRole, currentUser?._id]);

//   const isAuthorized = (
//     role: UserRole | null,
//     currentUserId: string | undefined,
//     target: TargetProfile,
//   ) => {
//     const currentId = normalizeId(currentUserId);
//     const targetId = normalizeId(target._id);

//     // console.log('Authorization check:', role, currentId, targetId, getRoleValue(target.role));
//     if (!role || !currentId || !targetId) return false;
//     if (role === 'admin') return true;
//     if (role === 'student') return targetId === currentId;
//     if (role === 'teacher') {
//       if (targetId === currentId) return true;
//       return getRoleValue(target.role) === 'student';
//     }
//     return targetId === currentId;
//   };

//   const fetchTargetProfile = async () => {
//     try {
//       setLoading(true);
//       setTargetProfile(user as TargetProfile);
//       navigation.setOptions({ title: "Attendance Details" });
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load profile');
//       setTargetProfile(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAttendance = async () => {
//     try {
//       setLoading(true);
//       const res = await apiService.getAttendance({ userId: id, month, year });

//       const payload = (res.data as {
//         attendance?: AttendanceRow[];
//         summary?: AttendanceSummary;
//       }) || { attendance: [] };

//       const attRows = Array.isArray(payload.attendance) ? payload.attendance : [];
//       setRecords(attRows);
//       setSummary(payload.summary || null);
//     } catch (err) {
//       // 404 means no records for this month; keep calendar visible with all unmarked.
//       const msg = err instanceof Error ? err.message : 'Failed to load attendance';
//       if (msg.toLowerCase().includes('no attendance records found')) {
//         setRecords([]);
//         setSummary({ total: 0, present: 0, absent: 0, leave: 0 });
//       } else {
//         Alert.alert('Error', msg);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const changeMonth = (direction: 'prev' | 'next') => {
//     if (direction === 'prev') {
//       if (month === 1) {
//         setMonth(12);
//         setYear((prev) => prev - 1);
//       } else {
//         setMonth((prev) => prev - 1);
//       }
//       return;
//     }
//     if (month === 12) {
//       setMonth(1);
//       setYear((prev) => prev + 1);
//     } else {
//       setMonth((prev) => prev + 1);
//     }
//   };

//   const statusColor = (status?: AttendanceStatus) => {
//     if (status === 'present') return '#16a34a';
//     if (status === 'absent') return '#dc2626';
//     if (status === 'leave') return '#d97706';
//     return '#9ca3af';
//   };

//   const totalForChart = Math.max(1, consideredDays);
//   const customCalendarHidden = true;
//   const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`;

//   const markedDates = useMemo(() => {
//     const marks: Record<string, any> = {};

//     for (let day = 1; day <= daysInMonth; day += 1) {
//       const dateKey = `${currentMonthKey}-${String(day).padStart(2, '0')}`;
//       const status = byDate.get(dateKey);
//       const disabled = isCurrentMonth && day > consideredDays;

//       if (disabled) {
//         marks[dateKey] = { disabled: true, disableTouchEvent: true };
//         continue;
//       }

//       if (status) {
//         marks[dateKey] = {
//           customStyles: {
//             container: {
//               borderWidth: 2,
//               borderColor: statusColor(status),
//               borderRadius: 999,
//             },
//             text: {
//               color: theme.text,
//               fontWeight: '700',
//             },
//           },
//         };
//       }
//     }

//     if (selectedDate) {
//       const selectedStatus = byDate.get(selectedDate);
//       marks[selectedDate] = {
//         ...(marks[selectedDate] || {}),
//         customStyles: {
//           container: {
//             borderWidth: 2,
//             borderColor: selectedStatus ? statusColor(selectedStatus) : '#2563eb',
//             borderRadius: 999,
//             backgroundColor: selectedStatus ? `${statusColor(selectedStatus)}22` : 'rgba(37,99,235,0.12)',
//           },
//           text: {
//             color: theme.text,
//             fontWeight: '800',
//           },
//         },
//       };
//     }

//     return marks;
//   }, [byDate, consideredDays, currentMonthKey, daysInMonth, isCurrentMonth, selectedDate, theme.text]);

//   if (loading && !targetProfile) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ActivityIndicator size="large" color={theme.tint} />
//       </ThemedView>
//     );
//   }

//   if (!targetProfile) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ThemedText>Member not found.</ThemedText>
//       </ThemedView>
//     );
//   }

//   if (!isAuthorized(currentRole, currentUser?._id, targetProfile)) {
//     return (
//       <ThemedView style={styles.centered}>
//         <MaterialCommunityIcons name="shield-alert-outline" size={28} color="#ef4444" />
//         <ThemedText style={styles.deniedTitle}>Access denied</ThemedText>
//         <ThemedText style={styles.deniedText}>
//           Students can view only their own attendance. Teachers can view their own and student
//           attendance. Admin can view anyone.
//         </ThemedText>
//         <ThemedText style={{ marginTop: 12, opacity: 0.75 }}>Your role: {currentRole || 'unknown'}</ThemedText>
//       </ThemedView>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <ThemedView style={[styles.memberCard, { borderColor: theme.icon }]}> 
//         <ThemedText style={styles.memberName}>{targetProfile.name || 'Unknown Member'}</ThemedText>
//       </ThemedView>

//       <ThemedView style={[styles.monthHeader, { borderColor: theme.icon }]}> 
//         <Pressable onPress={() => changeMonth('prev')} style={styles.monthNavBtn}>
//           <MaterialCommunityIcons name="chevron-left" size={20} color={theme.tint} />
//         </Pressable>
//         <ThemedText type="defaultSemiBold" style={styles.monthTitle}>
//           {MONTH_NAMES[month - 1]} {year}
//         </ThemedText>
//         <Pressable onPress={() => changeMonth('next')} style={styles.monthNavBtn}>
//           <MaterialCommunityIcons name="chevron-right" size={20} color={theme.tint} />
//         </Pressable>
//       </ThemedView>

//       <ThemedView style={[styles.chartCard, { borderColor: theme.icon }]}> 
//         <ThemedText type="subtitle">Monthly Chart</ThemedText>

//         {[ 
//           { key: 'present', label: 'Present', value: computed.present, color: '#16a34a' },
//           { key: 'absent', label: 'Absent', value: computed.absent, color: '#dc2626' },
//           { key: 'leave', label: 'Leave', value: computed.leave, color: '#d97706' },
//           { key: 'unmarked', label: 'Unmarked', value: computed.unmarked, color: '#6b7280' },
//         ].map((item) => (
//           <View key={item.key} style={styles.chartRow}>
//             <View style={styles.chartLabelWrap}>
//               <View style={[styles.chartDot, { backgroundColor: item.color }]} />
//               <ThemedText style={styles.chartLabel}>{item.label}</ThemedText>
//             </View>
//             <View style={styles.chartBarTrack}>
//               <View
//                 style={[
//                   styles.chartBarFill,
//                   {
//                     backgroundColor: item.color,
//                     width: `${Math.min(100, (item.value / totalForChart) * 100)}%`,
//                   },
//                 ]}
//               />
//             </View>
//             <ThemedText style={styles.chartValue}>{item.value}</ThemedText>
//           </View>
//         ))}

//         <ThemedText style={styles.chartHint}>
//           Showing {consideredDays} day(s) for {MONTH_NAMES[month - 1]} {year}
//         </ThemedText>
//       </ThemedView>

//       <ThemedView style={[styles.calendarCard, { borderColor: theme.icon }]}> 
//         <ThemedText type="subtitle">Calendar</ThemedText>
//         {customCalendarHidden ? (
//           <View style={styles.calendarWrapper}>
//             <Calendar
//               current={`${currentMonthKey}-01`}
//               enableSwipeMonths
//               markingType="custom"
//               onMonthChange={(m) => {
//                 setMonth(m.month);
//                 setYear(m.year);
//               }}
//               onDayPress={(day) => {
//                 setSelectedDate(day.dateString);
//               }}
//               markedDates={markedDates}
//               theme={{
//                 todayTextColor: '#2563eb',
//                 monthTextColor: theme.text,
//                 textDayHeaderFontWeight: '700',
//               }}
//             />

//             <ThemedText style={styles.calendarSelectedText}>
//               {selectedDate ? `Selected: ${selectedDate}` : 'Tap a date to select'}
//             </ThemedText>
//           </View>
//         ) : (
//           <View style={styles.calendarLegacyWrap}>
//             <View style={styles.weekHeaderRow}>
//               {WEEK_DAYS.map((w) => (
//                 <ThemedText key={w} style={styles.weekCell}>
//                   {w}
//                 </ThemedText>
//               ))}
//             </View>

//             <View style={styles.calendarGrid}>
//               {Array.from({ length: firstWeekday }).map((_, i) => (
//                 <View key={`pad-${String(i)}`} style={styles.dayCell} />
//               ))}

//               {Array.from({ length: daysInMonth }).map((_, i) => {
//                 const day = i + 1;
//                 const key = new Date(year, month - 1, day).toISOString().slice(0, 10);
//                 const status = byDate.get(key);
//                 const disabled = isCurrentMonth && day > consideredDays;

//                 return (
//                   <View
//                     key={key}
//                     style={[
//                       styles.dayCell,
//                       styles.dayBox,
//                       { borderColor: statusColor(status), opacity: disabled ? 0.45 : 1 },
//                     ]}>
//                     <ThemedText style={styles.dayNumber}>{day}</ThemedText>
//                     {!disabled && <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />}
//                     {!disabled && (
//                       <ThemedText style={styles.dayStatusText}>
//                         {status ? status.slice(0, 1).toUpperCase() : 'U'}
//                       </ThemedText>
//                     )}
//                   </View>
//                 );
//               })}
//             </View>
//           </View>
//         )}

//         <View style={styles.legendRow}>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
//             <ThemedText style={styles.legendText}>Present</ThemedText>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
//             <ThemedText style={styles.legendText}>Absent</ThemedText>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendDot, { backgroundColor: '#d97706' }]} />
//             <ThemedText style={styles.legendText}>Leave</ThemedText>
//           </View>
//           <View style={styles.legendItem}>
//             <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
//             <ThemedText style={styles.legendText}>Unmarked</ThemedText>
//           </View>
//         </View>
//       </ThemedView>

//       <ThemedView style={[styles.summaryCard, { borderColor: theme.icon }]}> 
//         <ThemedText type="subtitle">Summary</ThemedText>
//         <ThemedText style={styles.summaryText}>Total Marked: {summary?.total ?? computed.marked}</ThemedText>
//         <ThemedText style={styles.summaryText}>Present: {summary?.present ?? computed.present}</ThemedText>
//         <ThemedText style={styles.summaryText}>Absent: {summary?.absent ?? computed.absent}</ThemedText>
//         <ThemedText style={styles.summaryText}>Leave: {summary?.leave ?? computed.leave}</ThemedText>
//       </ThemedView>
//     </ScrollView>
//   );
// }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   content: {
// //     padding: 16,
// //     gap: 12,
// //     paddingBottom: 36,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     padding: 20,
// //     gap: 8,
// //   },
// //   deniedTitle: {
// //     marginTop: 8,
// //     fontSize: 18,
// //     fontWeight: '700',
// //   },
// //   deniedText: {
// //     textAlign: 'center',
// //     opacity: 0.75,
// //     lineHeight: 20,
// //   },
// //   memberCard: {
// //     borderWidth: 1,
// //     borderRadius: 14,
// //     padding: 14,
// //   },
// //   memberName: {
// //     marginTop: 4,
// //     fontSize: 18,
// //     fontWeight: '700',
// //   },
// //   memberMeta: {
// //     marginTop: 2,
// //     opacity: 0.75,
// //   },
// //   monthHeader: {
// //     borderWidth: 1,
// //     borderRadius: 14,
// //     paddingVertical: 10,
// //     paddingHorizontal: 8,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //   },
// //   monthNavBtn: {
// //     width: 34,
// //     height: 34,
// //     borderRadius: 17,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     backgroundColor: 'rgba(127,127,127,0.12)',
// //   },
// //   monthTitle: {
// //     fontSize: 16,
// //     fontWeight: '700',
// //   },
// //   chartCard: {
// //     borderWidth: 1,
// //     borderRadius: 14,
// //     padding: 14,
// //     gap: 10,
// //   },
// //   chartRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //   },
// //   chartLabelWrap: {
// //     width: 90,
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 6,
// //   },
// //   chartDot: {
// //     width: 10,
// //     height: 10,
// //     borderRadius: 5,
// //   },
// //   chartLabel: {
// //     fontSize: 13,
// //   },
// //   chartBarTrack: {
// //     flex: 1,
// //     height: 10,
// //     borderRadius: 999,
// //     backgroundColor: 'rgba(127,127,127,0.2)',
// //     overflow: 'hidden',
// //   },
// //   chartBarFill: {
// //     height: '100%',
// //     borderRadius: 999,
// //   },
// //   chartValue: {
// //     width: 26,
// //     textAlign: 'right',
// //     fontWeight: '700',
// //   },
// //   chartHint: {
// //     opacity: 0.65,
// //     fontSize: 12,
// //   },
// //   calendarCard: {
// //     borderWidth: 1,
// //     borderRadius: 14,
// //     padding: 14,
// //     gap: 10,
// //   },
// //   weekHeaderRow: {
// //     flexDirection: 'row',
// //   },
// //   weekCell: {
// //     width: `${100 / 7}%`,
// //     textAlign: 'center',
// //     fontSize: 12,
// //     opacity: 0.75,
// //     fontWeight: '600',
// //   },
// //   calendarGrid: {
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //   },
// //   dayCell: {
// //     width: `${100 / 7}%`,
// //     padding: 3,
// //   },
// //   dayBox: {
// //     borderWidth: 1,
// //     borderRadius: 10,
// //     minHeight: 54,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     gap: 2,
// //     backgroundColor: 'rgba(127,127,127,0.06)',
// //   },
// //   dayNumber: {
// //     fontWeight: '700',
// //     fontSize: 12,
// //   },
// //   statusDot: {
// //     width: 9,
// //     height: 9,
// //     borderRadius: 5,
// //   },
// //   dayStatusText: {
// //     fontSize: 10,
// //     opacity: 0.8,
// //     fontWeight: '700',
// //   },
// //   legendRow: {
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //     gap: 10,
// //     marginTop: 4,
// //   },
// //   legendItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 6,
// //   },
// //   legendDot: {
// //     width: 10,
// //     height: 10,
// //     borderRadius: 5,
// //   },
// //   legendText: {
// //     fontSize: 12,
// //   },
// //   summaryCard: {
// //     borderWidth: 1,
// //     borderRadius: 14,
// //     padding: 14,
// //     gap: 4,
// //   },
// //   summaryText: {
// //     fontSize: 13,
// //     opacity: 0.9,
// //   },
// // });


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
//     gap: 10,
//   },

//   deniedTitle: {
//     marginTop: 10,
//     fontSize: 20,
//     fontWeight: '700',
//   },

//   deniedText: {
//     textAlign: 'center',
//     opacity: 0.75,
//     lineHeight: 20,
//   },

//   /* MEMBER CARD */
//   memberCard: {
//     borderRadius: 18,
//     padding: 16,
//     elevation: 4,
//   },

//   memberName: {
//     fontSize: 20,
//     fontWeight: '700',
//   },

//   /* MONTH HEADER */
//   monthHeader: {
//     borderRadius: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     elevation: 3,
//   },

//   monthNavBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(0,0,0,0.05)',
//   },

//   monthTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//   },

//   /* CHART */
//   chartCard: {
//     borderRadius: 18,
//     padding: 16,
//     gap: 12,
//     elevation: 4,
//   },

//   chartRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },

//   chartLabelWrap: {
//     width: 100,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },

//   chartDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },

//   chartLabel: {
//     fontSize: 13,
//     fontWeight: '600',
//   },

//   chartBarTrack: {
//     flex: 1,
//     height: 12,
//     borderRadius: 999,
//     backgroundColor: 'rgba(0,0,0,0.08)',
//     overflow: 'hidden',
//   },

//   chartBarFill: {
//     height: '100%',
//     borderRadius: 999,
//   },

//   chartValue: {
//     width: 28,
//     textAlign: 'right',
//     fontWeight: '700',
//   },

//   chartHint: {
//     fontSize: 12,
//     opacity: 0.7,
//   },

//   /* CALENDAR */
//   calendarCard: {
//     borderRadius: 18,
//     padding: 16,
//     gap: 12,
//     elevation: 4,
//   },

//   calendarWrapper: {
//     borderRadius: 14,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: 'rgba(37, 99, 235, 0.18)',
//     backgroundColor: 'rgba(255,255,255,0.96)',
//   },

//   calendarSelectedText: {
//     textAlign: 'center',
//     fontSize: 12,
//     fontWeight: '700',
//     opacity: 0.72,
//     paddingVertical: 10,
//   },

//   calendarLegacyWrap: {
//     display: 'none',
//   },

//   weekHeaderRow: {
//     flexDirection: 'row',
//     marginBottom: 6,
//   },

//   weekCell: {
//     width: `${100 / 7}%`,
//     textAlign: 'center',
//     fontSize: 12,
//     fontWeight: '700',
//     opacity: 0.7,
//   },

//   calendarGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },

//   dayCell: {
//     width: `${100 / 7}%`,
//     padding: 4,
//   },

//   dayBox: {
//     borderWidth: 1,
//     borderRadius: 12,
//     minHeight: 58,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 3,
//   },

//   dayNumber: {
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 5,
//   },

//   dayStatusText: {
//     fontSize: 10,
//     fontWeight: '700',
//     opacity: 0.8,
//   },

//   /* LEGEND */
//   legendRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginTop: 6,
//   },

//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },

//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },

//   legendText: {
//     fontSize: 12,
//     fontWeight: '500',
//   },

//   /* SUMMARY */
//   summaryCard: {
//     borderRadius: 18,
//     padding: 16,
//     gap: 6,
//     elevation: 4,
//   },

//   summaryText: {
//     fontSize: 13,
//     opacity: 0.9,
//   },
// });


import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from 'expo-router';
import { Calendar } from 'react-native-calendars';

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

type AttendanceStatus = 'present' | 'absent' | 'leave';

interface AttendanceRow {
  _id?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  leave: number;
}

interface TargetProfile {
  _id: string;
  name?: string;
  role?: UserRole | { role?: UserRole };
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getRoleValue = (role?: TargetProfile['role']): UserRole | null => {
  if (!role) return null;
  if (typeof role === 'string') return role;
  return role.role || null;
};

const normalizeId = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as { toString?: () => string; buffer?: { data?: number[] } };
    if (obj.buffer?.data && Array.isArray(obj.buffer.data)) {
      return obj.buffer.data.map((b) => Number(b).toString(16).padStart(2, '0')).join('');
    }
    if (typeof obj.toString === 'function') {
      const text = obj.toString();
      if (text && text !== '[object Object]') return text;
    }
  }
  return String(value);
};

export default function AttendanceDetailByMemberScreen() {
  const id = useAuthStore((s) => s.user?._id) || '';
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation();
  const currentUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>('');

  const currentRole = useMemo<UserRole | null>(() => {
    if (!currentUser?.role) return null;
    if (typeof currentUser.role === 'string') return currentUser.role;
    return currentUser.role.role;
  }, [currentUser]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const consideredDays = isCurrentMonth ? today.getDate() : daysInMonth;

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const rec of records) {
      const key = new Date(rec.date).toISOString().slice(0, 10);
      map.set(key, rec.status);
    }
    return map;
  }, [records]);

  const computed = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let marked = 0;

    for (let day = 1; day <= consideredDays; day += 1) {
      const key = new Date(year, month - 1, day).toISOString().slice(0, 10);
      const status = byDate.get(key);
      if (!status) continue;
      marked += 1;
      if (status === 'present') present += 1;
      else if (status === 'absent') absent += 1;
      else leave += 1;
    }

    const unmarked = Math.max(0, consideredDays - marked);
    return { present, absent, leave, unmarked, marked };
  }, [byDate, consideredDays, month, year]);

  useEffect(() => {
    if (!id) return;
    void fetchTargetProfile();
  }, [id]);

  useEffect(() => {
    if (!id || !targetProfile) return;
    if (!isAuthorized(currentRole, currentUser?._id, targetProfile)) {
      setLoading(false);
      return;
    }
    void fetchAttendance();
  }, [id, month, year, targetProfile, currentRole, currentUser?._id]);

  const isAuthorized = (
    role: UserRole | null,
    currentUserId: string | undefined,
    target: TargetProfile,
  ) => {
    const currentId = normalizeId(currentUserId);
    const targetId = normalizeId(target._id);

    if (!role || !currentId || !targetId) return false;
    if (role === 'admin') return true;
    if (role === 'student') return targetId === currentId;
    if (role === 'teacher') {
      if (targetId === currentId) return true;
      return getRoleValue(target.role) === 'student';
    }
    return targetId === currentId;
  };

  const fetchTargetProfile = async () => {
    try {
      setLoading(true);
      setTargetProfile(user as TargetProfile);
      navigation.setOptions({ title: "Attendance Details" });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load profile');
      setTargetProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAttendance({ userId: id, month, year });

      const payload = (res.data as {
        attendance?: AttendanceRow[];
        summary?: AttendanceSummary;
      }) || { attendance: [] };

      const attRows = Array.isArray(payload.attendance) ? payload.attendance : [];
      setRecords(attRows);
      setSummary(payload.summary || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load attendance';
      if (msg.toLowerCase().includes('no attendance records found')) {
        setRecords([]);
        setSummary({ total: 0, present: 0, absent: 0, leave: 0 });
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (month === 1) {
        setMonth(12);
        setYear((prev) => prev - 1);
      } else {
        setMonth((prev) => prev - 1);
      }
      return;
    }
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const getStatusColor = (status?: AttendanceStatus) => {
    if (status === 'present') return PALETTE.success;
    if (status === 'absent') return PALETTE.error;
    if (status === 'leave') return PALETTE.warning;
    return '#9ca3af'; // Unmarked
  };

  const totalForChart = Math.max(1, consideredDays);
  const customCalendarHidden = true; // Set to false if you want the legacy view
  const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`;

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${currentMonthKey}-${String(day).padStart(2, '0')}`;
      const status = byDate.get(dateKey);
      const disabled = isCurrentMonth && day > consideredDays;

      if (disabled) {
        marks[dateKey] = { disabled: true, disableTouchEvent: true };
        continue;
      }

      if (status) {
        marks[dateKey] = {
          customStyles: {
            container: {
              borderWidth: 1,
              borderColor: getStatusColor(status),
              backgroundColor: `${getStatusColor(status)}15`,
              borderRadius: 4, // B2B Flat aesthetic instead of 999
            },
            text: {
              color: PALETTE.textHeading,
              fontWeight: '700',
            },
          },
        };
      }
    }

    if (selectedDate) {
      const selectedStatus = byDate.get(selectedDate);
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        customStyles: {
          container: {
            borderWidth: 2,
            borderColor: selectedStatus ? getStatusColor(selectedStatus) : PALETTE.primary,
            borderRadius: 4,
            backgroundColor: selectedStatus ? `${getStatusColor(selectedStatus)}22` : 'rgba(48, 56, 65, 0.1)',
          },
          text: {
            color: PALETTE.textHeading,
            fontWeight: '800',
          },
        },
      };
    }

    return marks;
  }, [byDate, consideredDays, currentMonthKey, daysInMonth, isCurrentMonth, selectedDate]);

  if (loading && !targetProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  if (!targetProfile) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: PALETTE.textBody }}>Member not found.</Text>
      </View>
    );
  }

  if (!isAuthorized(currentRole, currentUser?._id, targetProfile)) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="shield-alert-outline" size={28} color={PALETTE.error} />
        <Text style={styles.deniedTitle}>Access denied</Text>
        <Text style={styles.deniedText}>
          Students can view only their own attendance. Teachers can view their own and student
          attendance. Admin can view anyone.
        </Text>
        <Text style={styles.deniedRole}>Your role: {currentRole || 'unknown'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.memberCard}> 
        <Text style={styles.memberName}>{targetProfile.name || 'Unknown Member'}</Text>
      </View>

      <View style={styles.monthHeader}> 
        <Pressable onPress={() => changeMonth('prev')} style={({ pressed }) => [styles.monthNavBtn, pressed && styles.pressedOpacity]}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={PALETTE.primary} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <Pressable onPress={() => changeMonth('next')} style={({ pressed }) => [styles.monthNavBtn, pressed && styles.pressedOpacity]}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={PALETTE.primary} />
        </Pressable>
      </View>

      <View style={styles.chartCard}> 
        <Text style={styles.sectionTitle}>Monthly Chart</Text>

        {[ 
          { key: 'present', label: 'Present', value: computed.present, color: PALETTE.success },
          { key: 'absent', label: 'Absent', value: computed.absent, color: PALETTE.error },
          { key: 'leave', label: 'Leave', value: computed.leave, color: PALETTE.warning },
          { key: 'unmarked', label: 'Unmarked', value: computed.unmarked, color: '#9ca3af' },
        ].map((item) => (
          <View key={item.key} style={styles.chartRow}>
            <View style={styles.chartLabelWrap}>
              <View style={[styles.chartDot, { backgroundColor: item.color }]} />
              <Text style={styles.chartLabel}>{item.label}</Text>
            </View>
            <View style={styles.chartBarTrack}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    backgroundColor: item.color,
                    width: `${Math.min(100, (item.value / totalForChart) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.chartValue}>{item.value}</Text>
          </View>
        ))}

        <Text style={styles.chartHint}>
          Showing {consideredDays} day(s) for {MONTH_NAMES[month - 1]} {year}
        </Text>
      </View>

      <View style={styles.calendarCard}> 
        <Text style={styles.sectionTitle}>Calendar</Text>
        {customCalendarHidden ? (
          <View style={styles.calendarWrapper}>
            <Calendar
              current={`${currentMonthKey}-01`}
              enableSwipeMonths
              markingType="custom"
              onMonthChange={(m: any) => {
                setMonth(m.month);
                setYear(m.year);
              }}
              onDayPress={(day: any) => {
                setSelectedDate(day.dateString);
              }}
              markedDates={markedDates}
              theme={{
                backgroundColor: PALETTE.surface,
                calendarBackground: PALETTE.surface,
                textSectionTitleColor: PALETTE.textBody,
                selectedDayBackgroundColor: PALETTE.primary,
                selectedDayTextColor: PALETTE.surface,
                todayTextColor: PALETTE.primary,
                dayTextColor: PALETTE.textHeading,
                textDisabledColor: PALETTE.border,
                monthTextColor: PALETTE.textHeading,
                textDayHeaderFontWeight: '700',
                arrowColor: PALETTE.primary,
              }}
            />
            <Text style={styles.calendarSelectedText}>
              {selectedDate ? `Selected: ${selectedDate}` : 'Tap a date to select'}
            </Text>
          </View>
        ) : (
          <View style={styles.calendarLegacyWrap}>
            <View style={styles.weekHeaderRow}>
              {WEEK_DAYS.map((w) => (
                <Text key={w} style={styles.weekCell}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <View key={`pad-${String(i)}`} style={styles.dayCell} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = new Date(year, month - 1, day).toISOString().slice(0, 10);
                const status = byDate.get(key);
                const disabled = isCurrentMonth && day > consideredDays;

                return (
                  <View
                    key={key}
                    style={[
                      styles.dayCell,
                      styles.dayBox,
                      { borderColor: getStatusColor(status), opacity: disabled ? 0.45 : 1 },
                    ]}>
                    <Text style={styles.dayNumber}>{day}</Text>
                    {!disabled && <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />}
                    {!disabled && (
                      <Text style={styles.dayStatusText}>
                        {status ? status.slice(0, 1).toUpperCase() : 'U'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PALETTE.success }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PALETTE.error }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PALETTE.warning }]} />
            <Text style={styles.legendText}>Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9ca3af' }]} />
            <Text style={styles.legendText}>Unmarked</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryCard}> 
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summaryText}>Total Marked: {summary?.total ?? computed.marked}</Text>
        <Text style={styles.summaryText}>Present: {summary?.present ?? computed.present}</Text>
        <Text style={styles.summaryText}>Absent: {summary?.absent ?? computed.absent}</Text>
        <Text style={styles.summaryText}>Leave: {summary?.leave ?? computed.leave}</Text>
      </View>
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
    gap: 10,
    backgroundColor: PALETTE.background,
    padding: 24,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  deniedTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  deniedText: {
    textAlign: 'center',
    color: PALETTE.textBody,
    lineHeight: 20,
    marginTop: 4,
  },
  deniedRole: {
    marginTop: 12,
    color: PALETTE.textBody,
    fontSize: 13,
  },

  /* COMMON CARD STYLES */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 4,
  },

  /* MEMBER CARD */
  memberCard: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },

  /* MONTH HEADER */
  monthHeader: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.background,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },

  /* CHART */
  chartCard: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartLabelWrap: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 2, // Squarish dots to match flat look
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  chartBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartValue: {
    width: 28,
    textAlign: 'right',
    fontWeight: '700',
    color: PALETTE.textHeading,
    fontSize: 13,
  },
  chartHint: {
    fontSize: 12,
    color: PALETTE.textBody,
    marginTop: 4,
  },

  /* CALENDAR */
  calendarCard: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  calendarWrapper: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
  },
  calendarSelectedText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textBody,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  calendarLegacyWrap: {
    display: 'none',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textBody,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    padding: 4,
  },
  dayBox: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 2, // Squarish to match
  },
  dayStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },

  /* LEGEND */
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2, // Flat aesthetic
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textBody,
  },

  /* SUMMARY */
  summaryCard: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    padding: 16,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryText: {
    fontSize: 14,
    color: PALETTE.textBody,
    fontWeight: '500',
  },
});