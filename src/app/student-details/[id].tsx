// import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
// import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
// import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';

// const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

// type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not-marked';
// type AttendanceMode = 'list' | 'card';

// interface StudentProfile {
//   _id: string;
//   name: string;
//   email: string;
//   phone?: string;
//   image?: string;
//   studentId?: string;
//   rollNumber?: string | number;
//   dateOfBirth?: string;
//   gender?: string;
//   address?: string;
//   fatherName?: string;
//   motherName?: string;
//   fatherPhone?: string;
//   motherPhone?: string;
//   city?: string;
//   state?: string;
//   pinCode?: string;
//   parentContact?: string;
//   class?: { _id: string; name: string; grade?: string | number; section?: string };
//   createdAt?: string;
// }

// interface ClassRosterItem {
//   _id: string;
//   studentId?: string;
//   userId?: string;
//   name: string;
//   email?: string;
//   phone?: string;
//   image?: string | null;
//   rollNumber?: string | number;
//   studentIdCode?: string;
//   fatherName?: string;
//   motherName?: string;
//   status?: AttendanceStatus;
//   remarks?: string | null;
//   class?: string | { _id?: string; name?: string };
// }

// interface ClassAttendanceResponse {
//   classInfo: { _id: string; name: string; grade?: number | string; section?: string };
//   date: string;
//   attendance: ClassRosterItem[];
//   summary?: { total: number; present: number; absent: number; leave: number; notMarked?: number };
// }

// const getStudentKey = (student: ClassRosterItem) => student.userId || student._id || student.studentId || student.studentIdCode || student.name;

// const normalizeStatus = (value?: string | null): AttendanceStatus => {
//   if (value === 'present' || value === 'absent' || value === 'leave') return value;
//   return 'not-marked';
// };

// const createSummary = (rows: ClassRosterItem[]) => {
//   let present = 0;
//   let absent = 0;
//   let leave = 0;
//   let notMarked = 0;

//   rows.forEach((row) => {
//     const status = normalizeStatus(row.status);
//     if (status === 'present') present += 1;
//     else if (status === 'absent') absent += 1;
//     else if (status === 'leave') leave += 1;
//     else notMarked += 1;
//   });

//   return {
//     total: rows.length,
//     present,
//     absent,
//     leave,
//     notMarked,
//   };
// };

// export default function StudentDetailsScreen() {
//   const params = useLocalSearchParams<{ id?: string | string[] }>();
//   const id = Array.isArray(params.id) ? params.id[0] : params.id;
//   const [student, setStudent] = useState<StudentProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const navigation = useNavigation();
//   const router = useRouter();
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
//   const formatDate = (value?: string) => {
//     if (!value) return undefined;
//     const parsed = new Date(value);
//     if (Number.isNaN(parsed.getTime())) return value;
//     return parsed.toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   };

//   useEffect(() => {
//     if (!id) return;
//     void fetchStudentDetails();
//   }, [id]);

//   useEffect(() => {
//     if (student?.name) {
//       navigation.setOptions({ title: student.name });
//     }
//   }, [student, navigation]);

  

//   const fetchStudentDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await apiService.getStudentById(id as string);
//       if (!response.success || !response.data) {
//         throw new Error(response.msg || 'Failed to fetch student details');
//       }

//       const payload = response.data as StudentProfile;
//       setStudent(payload);

//       // student details only (attendance hub moved to class listing screen)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch student details');
//     } finally {
//       setLoading(false);
//     }
//   };

  

//   const InfoSection = ({ title, children }: { title: string; children: ReactNode }) => (
//     <ThemedView style={styles.section}>
//       <ThemedText type="subtitle" style={styles.sectionTitle}>
//         {title}
//       </ThemedText>
//       <ThemedView style={styles.sectionContent}>{children}</ThemedView>
//     </ThemedView>
//   );

//   const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
//     <View style={styles.infoRow}>
//       <ThemedText style={styles.label}>{label}</ThemedText>
//       <ThemedText style={styles.value}>{value || 'N/A'}</ThemedText>
//     </View>
//   );

  

//   if (loading) {
//     return (
//       <ThemedView style={styles.container}>
//         <ActivityIndicator size="large" color={theme.tint} />
//       </ThemedView>
//     );
//   }

//   if (error) {
//     return (
//       <ThemedView style={styles.container}>
//         <ThemedText style={styles.error}>Error: {error}</ThemedText>
//       </ThemedView>
//     );
//   }

//   if (!student) {
//     return (
//       <ThemedView style={styles.container}>
//         <ThemedText>Student not found</ThemedText>
//       </ThemedView>
//     );
//   }

  

//   return (
//     <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
//       <InfoSection title="📋 Personal Information">
//         <InfoRow label="Name" value={student.name} />
//         <InfoRow label="Email" value={student.email} />
//         <InfoRow label="Phone" value={student.phone} />
//         <InfoRow label="Gender" value={student.gender} />
//         <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
//       </InfoSection>

//       <InfoSection title="🎓 Academic Information">
//         <InfoRow label="Student Id" value={student.studentId} />
//         <InfoRow label="Roll Number" value={student.rollNumber != null ? String(student.rollNumber) : undefined} />
//         <InfoRow label="Class" value={student.class?.name} />
//       </InfoSection>

//       {student.address && (
//         <InfoSection title="📍 Address">
//           <InfoRow label="Address" value={student.address} />
//           {student.city && <InfoRow label="City" value={student.city} />}
//           {student.state && <InfoRow label="State" value={student.state} />}
//           {student.pinCode && <InfoRow label="Pin Code" value={student.pinCode} />}
//         </InfoSection>
//       )}

//       {(student.fatherName || student.motherName) && (
//         <InfoSection title="👨‍👩‍👧 Parent Information">
//           {student.fatherName && (
//             <>
//               <InfoRow label="Father Name" value={student.fatherName} />
//               <InfoRow label="Father Phone" value={student.fatherPhone || student.parentContact} />
//             </>
//           )}
//           {student.motherName && (
//             <>
//               <InfoRow label="Mother Name" value={student.motherName} />
//               <InfoRow label="Mother Phone" value={student.motherPhone || student.parentContact} />
//             </>
//           )}
//         </InfoSection>
//       )}

//       <InfoSection title="🔐 Account Information">
//         <InfoRow
//           label="Member Since"
//           value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
//         />
//       </InfoSection>

//       <ThemedView style={styles.actionWrap}>
//         <Pressable
//           style={[styles.actionButton, { backgroundColor: theme.tint }]}
//           onPress={() => {
//             if (id) {
//               router.push({
//                 pathname: '/attdence-detail/[id]',
//                 params: { id: String(id) },
//               });
//             }
//           }}
//         >
//           <ThemedText style={styles.actionButtonText}>View Monthly Attendance</ThemedText>
//         </Pressable>

//         <Pressable
//           style={[styles.actionButton, styles.performanceButton]}
//           onPress={() => {
//             if (id) {
//               router.push({
//                 pathname: '/performance/[id]',
//                 params: { id: String(id) },
//               });
//             }
//           }}
//         >
//           <ThemedText style={styles.actionButtonText}>Show Performance</ThemedText>
//         </Pressable>
//       </ThemedView>

      
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   scrollContainer: {
//     flex: 1,
//   },
//   container: {
//     paddingHorizontal: 16,
//     paddingTop: 10,
//     paddingBottom: 28,
//   },
//   section: {
//     marginTop: 10,
//     borderRadius: 14,
//     padding: 16,
//     backgroundColor: 'rgba(127, 127, 127, 0.05)',
//     borderWidth: 1,
//     borderColor: 'rgba(127, 127, 127, 0.18)',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     marginBottom: 10,
//   },
//   sectionContent: {
//     gap: 0,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     paddingVertical: 11,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(127, 127, 127, 0.1)',
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     opacity: 0.7,
//     flex: 1,
//     paddingRight: 10,
//   },
//   value: {
//     fontSize: 14,
//     fontWeight: '600',
//     flex: 1,
//     textAlign: 'right',
//     lineHeight: 20,
//   },
//   error: {
//     fontSize: 16,
//     color: '#ff6b6b',
//     textAlign: 'center',
//     marginTop: 20,
//   },
//   actionWrap: {
//     marginTop: 12,
//     marginBottom: 6,
//   },
//   actionButton: {
//     minHeight: 48,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//     paddingHorizontal: 12,
//   },
//   performanceButton: {
//     backgroundColor: '#0f766e',
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '700',
//   },
//   attendanceWrap: {
//     marginTop: 16,
//     borderRadius: 18,
//     padding: 16,
//     backgroundColor: 'rgba(37, 99, 235, 0.04)',
//     borderWidth: 1,
//     borderColor: 'rgba(37, 99, 235, 0.12)',
//   },
//   attendanceHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     marginBottom: 14,
//   },
//   attendanceTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//   },
//   attendanceSubtitle: {
//     fontSize: 13,
//     opacity: 0.72,
//     marginTop: 2,
//   },
//   attendanceDate: {
//     fontSize: 12,
//     opacity: 0.6,
//     marginTop: 4,
//   },
//   modeSwitcher: {
//     flexDirection: 'row',
//     gap: 8,
//     alignItems: 'center',
//   },
//   modeButton: {
//     minWidth: 64,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 999,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   modeButtonActive: {
//     backgroundColor: '#2563eb',
//   },
//   modeButtonIdle: {
//     backgroundColor: 'rgba(255,255,255,0.75)',
//     borderWidth: 1,
//     borderColor: 'rgba(37, 99, 235, 0.15)',
//   },
//   modeButtonTextActive: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 13,
//   },
//   modeButtonTextIdle: {
//     color: '#1d4ed8',
//     fontWeight: '700',
//     fontSize: 13,
//   },
//   summaryGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//     marginBottom: 14,
//   },
//   summaryCard: {
//     flexGrow: 1,
//     minWidth: '47%',
//     borderRadius: 16,
//     paddingVertical: 14,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//   },
//   summaryValue: {
//     fontSize: 22,
//     fontWeight: '800',
//   },
//   summaryLabel: {
//     marginTop: 4,
//     fontSize: 12,
//     fontWeight: '600',
//     opacity: 0.82,
//   },
//   summaryPresent: {
//     backgroundColor: 'rgba(34,197,94,0.08)',
//     borderColor: 'rgba(34,197,94,0.16)',
//   },
//   summaryAbsent: {
//     backgroundColor: 'rgba(239,68,68,0.08)',
//     borderColor: 'rgba(239,68,68,0.16)',
//   },
//   summaryLeave: {
//     backgroundColor: 'rgba(245,158,11,0.08)',
//     borderColor: 'rgba(245,158,11,0.16)',
//   },
//   summaryNeutral: {
//     backgroundColor: 'rgba(107,114,128,0.08)',
//     borderColor: 'rgba(107,114,128,0.16)',
//   },
//   submitBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 12,
//   },
//   pendingText: {
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   pendingHint: {
//     fontSize: 12,
//     opacity: 0.7,
//     marginTop: 2,
//   },
//   submitButton: {
//     minWidth: 148,
//     minHeight: 48,
//     paddingHorizontal: 16,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#2563eb',
//   },
//   submitButtonDisabled: {
//     opacity: 0.45,
//   },
//   submitButtonPressed: {
//     transform: [{ scale: 0.99 }],
//   },
//   submitButtonText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '800',
//     textAlign: 'center',
//   },
//   successMessage: {
//     marginBottom: 10,
//     color: '#166534',
//     fontWeight: '700',
//   },
//   rosterRow: {
//     borderRadius: 18,
//     padding: 14,
//     borderWidth: 1,
//     backgroundColor: 'rgba(255,255,255,0.94)',
//   },
//   rosterRowSelected: {
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 2,
//     backgroundColor: 'rgba(37,99,235,0.06)',
//     borderColor: 'rgba(37,99,235,0.12)',
//     borderWidth: 0,
//   },
//   rowPresent: {
//     borderColor: 'rgba(34,197,94,0.24)',
//     backgroundColor: 'rgba(34,197,94,0.08)',
//   },
//   rowAbsent: {
//     borderColor: 'rgba(239,68,68,0.24)',
//     backgroundColor: 'rgba(239,68,68,0.08)',
//   },
//   rowLeave: {
//     borderColor: 'rgba(245,158,11,0.24)',
//     backgroundColor: 'rgba(245,158,11,0.08)',
//   },
//   rowNeutral: {
//     borderColor: 'rgba(107,114,128,0.18)',
//     backgroundColor: 'rgba(255,255,255,0.98)',
//   },
//   rowHeader: {
//     flexDirection: 'row',
//     gap: 12,
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 54,
//     height: 54,
//     borderRadius: 27,
//     backgroundColor: '#e5e7eb',
//   },
//   rowMeta: {
//     flex: 1,
//     minWidth: 0,
//   },
//   studentName: {
//     fontSize: 15,
//   },
//   studentMeta: {
//     fontSize: 12,
//     opacity: 0.72,
//     marginTop: 2,
//   },
//   statusPill: {
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderRadius: 999,
//   },
//   statusPillText: {
//     fontSize: 11,
//     fontWeight: '800',
//   },
//   badgePresent: {
//     backgroundColor: 'rgba(34,197,94,0.14)',
//   },
//   badgeAbsent: {
//     backgroundColor: 'rgba(239,68,68,0.14)',
//   },
//   badgeLeave: {
//     backgroundColor: 'rgba(245,158,11,0.14)',
//   },
//   badgeNeutral: {
//     backgroundColor: 'rgba(107,114,128,0.14)',
//   },
//   rowParentInfo: {
//     marginTop: 10,
//     gap: 2,
//   },
//   parentText: {
//     fontSize: 12,
//     opacity: 0.78,
//   },
//   rowActions: {
//     marginTop: 12,
//     flexDirection: 'row',
//     gap: 8,
//   },
//   actionChip: {
//     flex: 1,
//     borderRadius: 12,
//     minHeight: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   presentChip: {
//     backgroundColor: '#16a34a',
//   },
//   absentChip: {
//     backgroundColor: '#dc2626',
//   },
//   leaveChip: {
//     backgroundColor: '#d97706',
//   },
//   actionChipText: {
//     color: '#fff',
//     fontWeight: '800',
//     fontSize: 12,
//   },
//   chipPressed: {
//     opacity: 0.82,
//     transform: [{ scale: 0.99 }],
//   },
//   rowSeparator: {
//     height: 10,
//   },
//   emptyText: {
//     textAlign: 'center',
//     opacity: 0.72,
//     paddingVertical: 8,
//   },
//   attendanceLoadingBox: {
//     minHeight: 140,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 10,
//   },
//   loadingText: {
//     fontSize: 13,
//     opacity: 0.72,
//   },
//   cardWrap: {
//     marginTop: 4,
//   },
//   cardNavRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   cardNavButton: {
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 999,
//     backgroundColor: 'rgba(255,255,255,0.92)',
//     borderWidth: 1,
//     borderColor: 'rgba(37,99,235,0.14)',
//   },
//   cardNavText: {
//     color: '#1d4ed8',
//     fontWeight: '800',
//     fontSize: 12,
//   },
//   cardCounter: {
//     fontSize: 12,
//     opacity: 0.72,
//     fontWeight: '700',
//   },
//   studentCard: {
//     alignItems: 'center',
//     padding: 18,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255,255,255,0.96)',
//     borderWidth: 1,
//     borderColor: 'rgba(37,99,235,0.12)',
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//     elevation: 3,
//   },
//   cardAvatar: {
//     width: 92,
//     height: 92,
//     borderRadius: 46,
//     backgroundColor: '#e5e7eb',
//     marginBottom: 12,
//   },
//   cardName: {
//     fontSize: 20,
//     textAlign: 'center',
//   },
//   cardMeta: {
//     fontSize: 13,
//     opacity: 0.74,
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   statusPillLarge: {
//     marginTop: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 999,
//   },
//   statusPillLargeText: {
//     fontSize: 13,
//     fontWeight: '800',
//   },
//   gestureHint: {
//     marginTop: 12,
//     fontSize: 12,
//     opacity: 0.68,
//     textAlign: 'center',
//     lineHeight: 17,
//   },
//   cardActionRow: {
//     marginTop: 16,
//     flexDirection: 'row',
//     gap: 8,
//     width: '100%',
//   },
//   cardActionButton: {
//     flex: 1,
//     minHeight: 44,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cardActionText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '800',
//   },
//   presentButton: {
//     backgroundColor: '#16a34a',
//   },
//   absentButton: {
//     backgroundColor: '#dc2626',
//   },
//   leaveButton: {
//     backgroundColor: '#d97706',
//   },
// });

import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { apiService } from '@/api/client';

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

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not-marked';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  studentId?: string;
  rollNumber?: string | number;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  parentContact?: string;
  class?: { _id: string; name: string; grade?: string | number; section?: string };
  createdAt?: string;
}

export default function StudentDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();
  const router = useRouter();

  const formatDate = (value?: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    if (!id) return;
    void fetchStudentDetails();
  }, [id]);

  useEffect(() => {
    if (student?.name) {
      navigation.setOptions({ title: student.name });
    }
  }, [student, navigation]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStudentById(id as string);
      if (!response.success || !response.data) {
        throw new Error(response.msg || 'Failed to fetch student details');
      }

      const payload = response.data as StudentProfile;
      setStudent(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  };

  const InfoSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: PALETTE.textBody }}>Student not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <InfoSection title="Personal Information">
        <InfoRow label="Name" value={student.name} />
        <InfoRow label="Email" value={student.email} />
        <InfoRow label="Phone" value={student.phone} />
        <InfoRow label="Gender" value={student.gender} />
        <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
      </InfoSection>

      <InfoSection title="Academic Information">
        <InfoRow label="Student ID" value={student.studentId} />
        <InfoRow label="Roll Number" value={student.rollNumber != null ? String(student.rollNumber) : undefined} />
        <InfoRow label="Class" value={student.class?.name} />
      </InfoSection>

      {student.address && (
        <InfoSection title="Address">
          <InfoRow label="Address" value={student.address} />
          {student.city && <InfoRow label="City" value={student.city} />}
          {student.state && <InfoRow label="State" value={student.state} />}
          {student.pinCode && <InfoRow label="Pin Code" value={student.pinCode} />}
        </InfoSection>
      )}

      {(student.fatherName || student.motherName) && (
        <InfoSection title="Parent Information">
          {student.fatherName && (
            <>
              <InfoRow label="Father Name" value={student.fatherName} />
              <InfoRow label="Father Phone" value={student.fatherPhone || student.parentContact} />
            </>
          )}
          {student.motherName && (
            <>
              <InfoRow label="Mother Name" value={student.motherName} />
              <InfoRow label="Mother Phone" value={student.motherPhone || student.parentContact} />
            </>
          )}
        </InfoSection>
      )}

      <InfoSection title="Account Information">
        <InfoRow
          label="Member Since"
          value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
        />
      </InfoSection>

      <View style={styles.actionWrap}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.attendanceButton, pressed && styles.pressedOpacity]}
          onPress={() => {
            if (id) {
              router.push({
                pathname: '/attdence-detail/[id]',
                params: { id: String(id) },
              });
            }
          }}
        >
          <Text style={styles.actionButtonText}>View Monthly Attendance</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.performanceButton, pressed && styles.pressedOpacity]}
          onPress={() => {
            if (id) {
              router.push({
                pathname: '/performance/[id]',
                params: { id: String(id) },
              });
            }
          }}
        >
          <Text style={styles.actionButtonText}>Show Performance</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.background,
    padding: 24,
  },
  pressedOpacity: {
    opacity: 0.8,
  },
  errorText: {
    fontSize: 16,
    color: PALETTE.error,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* INFO SECTIONS */
  section: {
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textBody,
    flex: 1,
    paddingRight: 10,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textHeading,
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },

  /* ACTIONS */
  actionWrap: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  attendanceButton: {
    backgroundColor: PALETTE.primary,
  },
  performanceButton: {
    backgroundColor: PALETTE.cta,
  },
  actionButtonText: {
    color: PALETTE.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});