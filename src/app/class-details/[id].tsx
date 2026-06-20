// import { useEffect, useState } from 'react';
// import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View, TextInput } from 'react-native';
// import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';

// interface Student {
//   _id: string;
//   name: string;
//   email?: string;
//   rollNumber?: string;
//   phone?: string;
//   photo?: string;
//   admissionNumber?: string;
// }

// interface Class {
//   _id: string;
//   name: string;
//   section: string;
//   students: Student[];
//   classTeacher?: { name: string; _id: string };
// }

// export default function ClassDetailsScreen() {
//   const { id } = useLocalSearchParams();
//   const [classData, setClassData] = useState<Class | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [query, setQuery] = useState('');
//   const router = useRouter();
//   const navigation = useNavigation();
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   useEffect(() => {
//     if (id) {
//       fetchClassDetails();
//     }
//   }, [id]);

//   useEffect(() => {
//     if (classData) {
//       navigation.setOptions({
//         title: `${classData.name}${classData.section ? ` (${classData.section})` : ''} - Students`,
//       });
//     }
//   }, [classData, navigation]);

//   const filteredStudents = (classData?.students || []).filter((s) => {
//     if (!query) return true;
//     const q = query.trim().toLowerCase();
//     return (
//       (s.name || '').toLowerCase().includes(q) ||
//       (s.email || '').toLowerCase().includes(q) ||
//       (s.phone || '').toLowerCase().includes(q) ||
//       (s.rollNumber || '').toLowerCase().includes(q)
//     );
//   });

//   const fetchClassDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await apiService.getClassById(id as string);
//       if (response.success && response.data) {
//         setClassData(response.data as Class);
//       } else {
//         setClassData(null);
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch class details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderStudentItem = ({ item }: { item: Student }) => (
//     <TouchableOpacity
//       onPress={() => router.push(`/student-details/${item._id}`)}
//       style={[
//         styles.studentCard,
//         {
//           backgroundColor: theme.background,
//           borderColor: theme.icon,
//         },
//       ]}>
//       <ThemedView style={styles.studentContent}>
//         <View style={styles.studentHeader}>
//           <ThemedText type="subtitle" style={styles.studentName}>
//             {item.name}
//           </ThemedText>
//           {item.rollNumber && (
//             <ThemedText style={styles.rollNumber}>#{item.rollNumber}</ThemedText>
//           )}
//         </View>

//         {item.admissionNumber && (
//           <ThemedText style={styles.detail}>
//             📝 Admission: {item.admissionNumber}
//           </ThemedText>
//         )}
//         {item.email && (
//           <ThemedText style={styles.detail} numberOfLines={1}>
//             ✉️ {item.email}
//           </ThemedText>
//         )}
//         {item.phone && (
//           <ThemedText style={styles.detail}>
//             📱 {item.phone}
//           </ThemedText>
//         )}

//         <ThemedText style={styles.tapHint}>Tap to view full details →</ThemedText>
//       </ThemedView>
//     </TouchableOpacity>
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

//   if (!classData) {
//     return (
//       <ThemedView style={styles.container}>
//         <ThemedText>Class not found</ThemedText>
//       </ThemedView>
//     );
//   }

//   return (
//     <ThemedView style={styles.container}>
//       {/* Class Info Header */}
//       <ThemedView style={styles.header}>
//         {/* <ThemedText type="title">
//           {classData.name}
//           {classData.section ? ` (${classData.section})` : ''}
//         </ThemedText> */}
//         {classData.classTeacher && (
//           <ThemedText style={styles.teacher}>
//             👨‍🏫 Class Teacher: {classData.classTeacher.name}
//           </ThemedText>
//         )}
//         <ThemedText style={styles.enrolledCount}>
//           📊 {classData.students?.length || 0} Students Enrolled
//         </ThemedText>
//       </ThemedView>

//       {/* Search */}
//       <ThemedView style={styles.searchWrap}>
//         <TextInput
//           placeholder="Search students by name, email, phone or roll"
//           placeholderTextColor="#8c8c8c"
//           value={query}
//           onChangeText={setQuery}
//           style={styles.searchInput}
//         />
//       </ThemedView>

//       {/* Students List */}
//       {filteredStudents && filteredStudents.length === 0 ? (
//         <ThemedView style={styles.emptyContainer}>
//           <ThemedText>No students match your search</ThemedText>
//         </ThemedView>
//       ) : (
//         <FlatList
//           data={filteredStudents}
//           renderItem={renderStudentItem}
//           keyExtractor={(item) => item._id}
//           contentContainerStyle={styles.listContent}
//         />
//       )}
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   section: {
//     marginTop: 8,
//     fontSize: 14,
//     opacity: 0.7,
//   },
//   teacher: {
//     marginTop: 8,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   enrolledCount: {
//     marginTop: 12,
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   studentCard: {
//     marginHorizontal: 20,
//     marginVertical: 10,
//     borderRadius: 12,
//     borderWidth: 1,
//     overflow: 'hidden',
//   },
//   searchWrap: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//   },
//   searchInput: {
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: '#fff',
//   },
//   studentContent: {
//     padding: 16,
//   },
//   studentHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   studentName: {
//     fontSize: 16,
//     fontWeight: '600',
//     flex: 1,
//   },
//   rollNumber: {
//     fontSize: 12,
//     fontWeight: '500',
//     opacity: 0.6,
//     marginLeft: 8,
//   },
//   detail: {
//     fontSize: 13,
//     marginBottom: 6,
//     opacity: 0.8,
//   },
//   tapHint: {
//     marginTop: 12,
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#007AFF',
//   },
//   listContent: {
//     paddingBottom: 20,
//     paddingTop: 10,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   error: {
//     fontSize: 16,
//     color: '#ff6b6b',
//     textAlign: 'center',
//     marginTop: 20,
//   },
// });

import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View, TextInput, Text } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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

interface Student {
  _id: string;
  name: string;
  email?: string;
  rollNumber?: string;
  phone?: string;
  photo?: string;
  admissionNumber?: string;
}

interface Class {
  _id: string;
  name: string;
  section: string;
  students: Student[];
  classTeacher?: { name: string; _id: string };
}

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    if (id) {
      fetchClassDetails();
    }
  }, [id]);

  useEffect(() => {
    if (classData) {
      navigation.setOptions({
        title: `${classData.name}${classData.section ? ` (${classData.section})` : ''} - Students`,
      });
    }
  }, [classData, navigation]);

  const filteredStudents = (classData?.students || []).filter((s) => {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.rollNumber || '').toLowerCase().includes(q)
    );
  });

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getClassById(id as string);
      if (response.success && response.data) {
        setClassData(response.data as Class);
      } else {
        setClassData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch class details');
    } finally {
      setLoading(false);
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <TouchableOpacity
      onPress={() => router.push(`/student-details/${item._id}`)}
      style={styles.studentCard}
      activeOpacity={0.7}
    >
      <View style={styles.studentContent}>
        <View style={styles.studentHeader}>
          <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
          {item.rollNumber && (
            <View style={styles.rollBadge}>
              <Text style={styles.rollNumber}>#{item.rollNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {item.admissionNumber && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={16} color={PALETTE.textBody} />
              <Text style={styles.detailText}>Admission: {item.admissionNumber}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color={PALETTE.textBody} />
              <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={PALETTE.textBody} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionHintRow}>
          <Text style={styles.tapHint}>View Full Details</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={PALETTE.primary} />
        </View>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Class not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Class Info Header */}
      <View style={styles.header}>
        {classData.classTeacher && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="human-male-board" size={20} color={PALETTE.primary} />
            <Text style={styles.teacherName}>
              Class Teacher: {classData.classTeacher.name}
            </Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-group" size={20} color={PALETTE.textBody} />
          <Text style={styles.enrolledCount}>
            {classData.students?.length || 0} Students Enrolled
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={PALETTE.textBody} style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name, email, phone or roll..."
            placeholderTextColor={PALETTE.textBody}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Students List */}
      {filteredStudents && filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.background,
    padding: 24,
  },
  
  /* HEADER */
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: PALETTE.surface,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  enrolledCount: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textBody,
  },

  /* SEARCH BAR */
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: PALETTE.textHeading,
  },

  /* STUDENT LIST */
  listContent: {
    paddingBottom: 24,
  },
  studentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  studentContent: {
    padding: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
    flex: 1,
    paddingRight: 12,
  },
  rollBadge: {
    backgroundColor: 'rgba(48, 56, 65, 0.05)',
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rollNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  detailsContainer: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: PALETTE.textBody,
  },
  actionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingTop: 12,
    gap: 2,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  /* EMPTY & ERROR STATES */
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: PALETTE.textBody,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.error,
    textAlign: 'center',
  },
});