// import { useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View, TextInput } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { apiService } from '@/api/client';

// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';

// interface SubjectItem {
//   _id: string;
//   name: string;
//   code?: string;
//   maxMarks?: number;
//   class?: { _id?: string; name?: string; grade?: string; section?: string };
//   teacher?: { _id?: string; user?: { name?: string } };
// }

// export default function SubjectsScreen() {
//   const [loading, setLoading] = useState(true);
//   const [subjects, setSubjects] = useState<SubjectItem[]>([]);
//   const [search, setSearch] = useState('');
//   const router = useRouter();

//   const colorScheme = useColorScheme();

// const theme =
//   colorScheme === 'dark'
//     ? {
//         background: '#303841',
//         card: '#3A434D',
//         surface: '#34404A',
//         border: 'rgba(255,255,255,0.08)',
//         text: '#FFFFFF',
//         textSecondary: 'rgba(255,255,255,0.72)',
//         accent: '#76ABAE',
//         cta: '#FF5722',
//       }
//     : {
//         background: '#F5F5F5',
//         card: '#FFFFFF',
//         surface: '#FFFFFF',
//         border: '#E6E6E6',
//         text: '#303841',
//         textSecondary: '#5D646B',
//         accent: '#76ABAE',
//         cta: '#FF5722',
//       };

//   const currentAcademicYear = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = now.getMonth() + 1;
//     const start = month >= 4 ? year : year - 1;
//     return `${start}-${String(start + 1).slice(-2)}`;
//   };

//   const filteredSubjects = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     if (!term) return subjects;
//     return subjects.filter((subject) => {
//       const name = String(subject?.name || '').toLowerCase();
//       const code = String(subject?.code || '').toLowerCase();
//       const teacher = String(subject?.teacher?.user?.name || '').toLowerCase();
//       const className = String(subject?.class?.name || '').toLowerCase();
//       return name.includes(term) || code.includes(term) || teacher.includes(term) || className.includes(term);
//     });
//   }, [search, subjects]);

//   useEffect(() => {
//     const loadSubjects = async () => {
//       try {
//         setLoading(true);
//         const response = await apiService.getAllSubjects();
//         if (!response.success) throw new Error(response.msg || 'Failed to load subjects');
//         setSubjects((Array.isArray(response.data) ? response.data : []) as SubjectItem[]);
//       } catch (error) {
//         Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load subjects');
//       } finally {
//         setLoading(false);
//       }
//     };

//     void loadSubjects();
//   }, []);

//   if (loading) {
//   return (
//     <ThemedView style={styles.centered}>
//       <ActivityIndicator
//         size="large"
//         color="#76ABAE"
//       />
//     </ThemedView>
//   );
// }

//   // return (
//   //   <ThemedView style={styles.container}>
//   //     <View style={styles.header}>
//   //       <ThemedText type="title">Subjects</ThemedText>
//   //       <ThemedText style={styles.subtitle}>{subjects.length} subjects found</ThemedText>
//   //       <TextInput
//   //         value={search}
//   //         onChangeText={setSearch}
//   //         placeholder="Search subjects, teachers, or classes"
//   //         style={{ marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}
//   //       />
//   //     </View>

//   //     <FlatList
//   //       data={filteredSubjects}
//   //       keyExtractor={(item) => item._id}
//   //       contentContainerStyle={styles.list}
//   //       renderItem={({ item }) => (
//   //         <Pressable onPress={() => router.push(`/subjects/${item._id}`)} style={styles.card}>
//   //           <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
//   //           <ThemedText style={styles.meta}>Code: {item.code || 'N/A'}</ThemedText>
//   //           <ThemedText style={styles.meta}>Max Marks: {item.maxMarks ?? 'N/A'}</ThemedText>
//   //           <ThemedText style={styles.meta}>
//   //             Class: {item.class?.name ? `${item.class.name}${item.class.grade ? ` (${item.class.grade})` : ''}${item.class.section ? ` - ${item.class.section}` : ''}` : 'N/A'}
//   //           </ThemedText>
//   //           <ThemedText style={styles.meta}>Teacher: {item.teacher?.user?.name || 'N/A'}</ThemedText>
//   //         </Pressable>
//   //       )}
//   //       ListEmptyComponent={
//   //         <View style={styles.emptyCard}>
//   //           <ThemedText>No subjects found.</ThemedText>
//   //         </View>
//   //       }
//   //     />
//   //   </ThemedView>
//   // );

//   return (
//   <ThemedView
//     style={[
//       styles.container,
//       {
//         backgroundColor: theme.background,
//       },
//     ]}>

//     <View
//       style={[
//         styles.heroCard,
//         {
//           backgroundColor: theme.card,
//           borderColor: theme.border,
//         },
//       ]}>

//       <ThemedText type="title">
//         Subjects
//       </ThemedText>

//       <ThemedText
//         style={[
//           styles.subtitle,
//           { color: theme.textSecondary },
//         ]}>
//         Manage and browse all available subjects
//       </ThemedText>

//       <View style={styles.statsRow}>
//         <View
//           style={[
//             styles.statCard,
//             {
//               backgroundColor: theme.surface,
//               borderColor: theme.border,
//             },
//           ]}>
//           <ThemedText style={styles.statValue}>
//             {subjects.length}
//           </ThemedText>

//           <ThemedText style={styles.statLabel}>
//             Subjects
//           </ThemedText>
//         </View>

//         <View
//           style={[
//             styles.statCard,
//             {
//               backgroundColor: theme.surface,
//               borderColor: theme.border,
//             },
//           ]}>
//           <ThemedText
//             style={[
//               styles.statValue,
//               { color: theme.accent },
//             ]}>
//             ERP
//           </ThemedText>

//           <ThemedText style={styles.statLabel}>
//             Academic
//           </ThemedText>
//         </View>
//       </View>

//       <TextInput
//         value={search}
//         onChangeText={setSearch}
//         placeholder="Search subjects, teachers or classes"
//         placeholderTextColor={theme.textSecondary}
//         style={[
//           styles.searchInput,
//           {
//             backgroundColor: theme.surface,
//             borderColor: theme.border,
//             color: theme.text,
//           },
//         ]}
//       />
//     </View>

//     <FlatList
//       data={filteredSubjects}
//       keyExtractor={(item) => item._id}
//       contentContainerStyle={styles.list}
//       showsVerticalScrollIndicator={false}
//       renderItem={({ item }) => (
//         <Pressable
//           onPress={() =>
//             router.push(`/subjects/${item._id}`)
//           }
//           style={[
//             styles.card,
//             {
//               backgroundColor: theme.card,
//               borderColor: theme.border,
//             },
//           ]}>

//           <View style={styles.cardHeader}>
//             <View style={{ flex: 1 }}>
//               <ThemedText
//                 type="defaultSemiBold"
//                 style={styles.subjectTitle}>
//                 {item.name}
//               </ThemedText>

//               <ThemedText
//                 style={[
//                   styles.codeBadge,
//                   {
//                     backgroundColor:
//                       colorScheme === 'dark'
//                         ? 'rgba(118,171,174,0.15)'
//                         : 'rgba(118,171,174,0.12)',
//                   },
//                 ]}>
//                 {item.code || 'NO CODE'}
//               </ThemedText>
//             </View>

//             <View
//               style={[
//                 styles.maxMarksBadge,
//                 {
//                   backgroundColor: theme.cta,
//                 },
//               ]}>
//               <ThemedText style={styles.maxMarksText}>
//                 {item.maxMarks ?? '--'}
//               </ThemedText>
//             </View>
//           </View>

//           <View style={styles.metaSection}>
//             <ThemedText
//               style={[
//                 styles.meta,
//                 { color: theme.textSecondary },
//               ]}>
//               👨‍🏫 {item.teacher?.user?.name || 'No Teacher'}
//             </ThemedText>

//             <ThemedText
//               style={[
//                 styles.meta,
//                 { color: theme.textSecondary },
//               ]}>
//               🏫{' '}
//               {item.class?.name
//                 ? `${item.class.name}${
//                     item.class.section
//                       ? ` - ${item.class.section}`
//                       : ''
//                   }`
//                 : 'No Class'}
//             </ThemedText>
//           </View>
//         </Pressable>
//       )}
//       ListEmptyComponent={
//         <View
//           style={[
//             styles.emptyCard,
//             {
//               backgroundColor: theme.card,
//               borderColor: theme.border,
//             },
//           ]}>
//           <ThemedText>
//             No subjects found
//           </ThemedText>
//         </View>
//       }
//     />
//   </ThemedView>
// );
// }


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },

//   heroCard: {
//     margin: 16,
//     padding: 18,
//     borderRadius: 20,
//     borderWidth: 1,
//   },

//   subtitle: {
//     marginTop: 6,
//     marginBottom: 14,
//   },

//   statsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginBottom: 14,
//   },

//   statCard: {
//     flex: 1,
//     padding: 14,
//     borderRadius: 16,
//     borderWidth: 1,
//     alignItems: 'center',
//   },

//   statValue: {
//     fontSize: 22,
//     fontWeight: '700',
//   },

//   statLabel: {
//     marginTop: 4,
//     opacity: 0.7,
//     fontSize: 12,
//   },

//   searchInput: {
//     borderWidth: 1,
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 15,
//   },

//   list: {
//     paddingHorizontal: 16,
//     paddingBottom: 40,
//   },

//   card: {
//     borderRadius: 18,
//     borderWidth: 1,
//     padding: 16,
//     marginBottom: 12,
//   },

//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },

//   subjectTitle: {
//     fontSize: 16,
//     marginBottom: 8,
//   },

//   codeBadge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 999,
//     overflow: 'hidden',
//     fontSize: 12,
//   },

//   maxMarksBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },

//   maxMarksText: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//   },

//   metaSection: {
//     marginTop: 14,
//     gap: 8,
//   },

//   meta: {
//     fontSize: 13,
//   },

//   emptyCard: {
//     padding: 24,
//     borderRadius: 18,
//     borderWidth: 1,
//     alignItems: 'center',
//   },

//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

interface SubjectItem {
  _id: string;
  name: string;
  code?: string;
  maxMarks?: number;
  class?: { _id?: string; name?: string; grade?: string; section?: string };
  teacher?: { _id?: string; user?: { name?: string } };
}

export default function SubjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((s) => 
      s.name.toLowerCase().includes(term) || 
      s.code?.toLowerCase().includes(term) || 
      s.teacher?.user?.name?.toLowerCase().includes(term) || 
      s.class?.name?.toLowerCase().includes(term)
    );
  }, [search, subjects]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllSubjects();
        if (response.success) setSubjects(Array.isArray(response.data) ? response.data : []);
      } catch (e) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={PALETTE.accent} />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.heroCard}>
        <ThemedText style={styles.heading}>Subjects</ThemedText>
        <ThemedText style={styles.subText}>Manage and browse all available subjects</ThemedText>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{subjects.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: PALETTE.accent }]}>ERP</ThemedText>
            <ThemedText style={styles.statLabel}>Academic</ThemedText>
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search subjects, teachers or classes"
          placeholderTextColor={PALETTE.textBody}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/subjects/${item._id}`)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.subjectTitle}>{item.name}</ThemedText>
                <View style={styles.codeBadge}>
                  <ThemedText style={styles.codeText}>{item.code || 'N/A'}</ThemedText>
                </View>
              </View>
              <View style={styles.maxMarksBadge}>
                <ThemedText style={styles.maxMarksText}>{item.maxMarks ?? '--'}</ThemedText>
              </View>
            </View>

            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={PALETTE.textBody} />
                <ThemedText style={styles.meta}>{item.teacher?.user?.name || 'No Teacher'}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="school-outline" size={14} color={PALETTE.textBody} />
                <ThemedText style={styles.meta}>
                  {item.class?.name ? `${item.class.name}${item.class.section ? ` - ${item.class.section}` : ''}` : 'No Class'}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  heroCard: { backgroundColor: PALETTE.surface, padding: 16, borderBottomWidth: 1, borderColor: PALETTE.border },
  heading: { fontSize: 22, fontWeight: '800', color: PALETTE.textHeading },
  subText: { fontSize: 14, color: PALETTE.textBody, marginTop: 4, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: PALETTE.background, padding: 12, borderRadius: 4, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: PALETTE.textHeading },
  statLabel: { fontSize: 11, color: PALETTE.textBody, marginTop: 2 },
  searchInput: { backgroundColor: PALETTE.background, borderRadius: 4, paddingHorizontal: 12, height: 44, color: PALETTE.textHeading },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: PALETTE.surface, borderRadius: 4, padding: 16, borderWidth: 1, borderColor: PALETTE.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subjectTitle: { fontSize: 16, fontWeight: '700', color: PALETTE.textHeading, marginBottom: 4 },
  codeBadge: { backgroundColor: 'rgba(118,171,174,0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  codeText: { fontSize: 11, color: PALETTE.accent, fontWeight: '700' },
  maxMarksBadge: { backgroundColor: PALETTE.cta, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  maxMarksText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  metaSection: { marginTop: 12, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, color: PALETTE.textBody },
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   header: {
//     marginBottom: 12,
//   },
//   card: {
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 10,
//     backgroundColor: 'rgba(21, 101, 192, 0.08)',
//   },
//   subtitle: {
//     marginTop: 8,
//     opacity: 0.75,
//   },
//   list: {
//     paddingBottom: 20,
//   },
//   meta: {
//     marginTop: 4,
//     opacity: 0.8,
//   },
//   emptyCard: {
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(21, 101, 192, 0.08)',
//   },
// });
