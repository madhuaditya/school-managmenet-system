// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';
// import type { LeaveRequest, UserRole } from '@/src/types';

// const getRole = (role?: UserRole | { role?: UserRole }) => {
//   if (!role) return '';
//   return typeof role === 'string' ? role : role.role || '';
// };

// const getApplicantName = (leave: LeaveRequest) => {
//   const applicant = leave.applicantUser;
//   if (applicant && typeof applicant === 'object') {
//     return applicant.name || applicant.email || applicant._id;
//   }

//   const user = leave.userId;
//   if (user && typeof user === 'object') {
//     return user.name || user.email || user._id;
//   }

//   return applicant || user || 'User';
// };

// const getLeaveDetails = (leave: LeaveRequest) => {
//   const parts = [leave.leaveType, leave.purpose || leave.reason].filter(Boolean);
//   return parts.length ? parts.join(' • ') : 'No leave details provided';
// };

// export default function LeaveReviewTab() {
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const user = useAuthStore((state) => state.user);
//   const role = getRole(user?.role);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [items, setItems] = useState<LeaveRequest[]>([]);
//   const [remarks, setRemarks] = useState<Record<string, string>>({});
//   const [submittingId, setSubmittingId] = useState<string | null>(null);

//   const fetchLeaves = useCallback(async (isRefresh = false) => {
//     try {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }

//       const response = await apiService.getAdminLeaves();
//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to fetch leave requests.');
//       }

//       const payload = response.data;
//       const rawItems = Array.isArray(payload) ? payload : payload?.leaves || payload?.data || [];
//       setItems(rawItems);
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch leave requests.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (role === 'admin') {
//       void fetchLeaves();
//       return;
//     }
//     setLoading(false);
//   }, [fetchLeaves, role]);

//   const pendingCount = useMemo(() => items.filter((item) => item.status === 'pending').length, [items]);

//   const review = async (leaveId: string, action: 'approve' | 'decline') => {
//     try {
//       setSubmittingId(leaveId);
//       const response = await apiService.reviewLeave(leaveId, {
//         action,
//         reviewRemark: remarks[leaveId]?.trim() || undefined,
//       });

//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to review leave.');
//       }

//       setItems((prev) =>
//         prev.map((entry) =>
//           entry._id === leaveId
//             ? {
//                 ...entry,
//                 status: action === 'approve' ? 'approved' : 'declined',
//                 reviewRemark: remarks[leaveId]?.trim() || entry.reviewRemark,
//               }
//             : entry,
//         ),
//       );
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to review leave.');
//     } finally {
//       setSubmittingId(null);
//     }
//   };

//   if (role !== 'admin') {
//     return (
//       <ThemedView style={styles.centered}>
//         <ThemedText>Access denied. Admin role is required.</ThemedText>
//       </ThemedView>
//     );
//   }

//   return (
//     <ThemedView style={styles.container}>
//       <ThemedText style={styles.countText}>Pending requests: {pendingCount}</ThemedText>

//       {loading ? (
//         <View style={styles.centered}><ActivityIndicator size="large" color={theme.tint} /></View>
//       ) : (
//         <FlatList
//           data={items}
//           keyExtractor={(item) => item._id}
//           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchLeaves(true)} />}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={<ThemedText style={styles.emptyText}>No leave requests found.</ThemedText>}
//           renderItem={({ item }) => {
//             return (
//               <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//                 <View style={styles.rowBetween}>
//                   <ThemedText type="defaultSemiBold">{getApplicantName(item)}</ThemedText>
//                   <ThemedText style={styles.statusText}>{item.status.toUpperCase()}</ThemedText>
//                 </View>

//                 <ThemedText style={styles.metaText}>From: {new Date(item.startDate).toLocaleDateString()}</ThemedText>
//                 <ThemedText style={styles.metaText}>To: {new Date(item.endDate).toLocaleDateString()}</ThemedText>
//                 <ThemedText>{getLeaveDetails(item)}</ThemedText>
//                 {item.reviewRemark ? <ThemedText style={styles.metaText}>Review: {item.reviewRemark}</ThemedText> : null}

//                 <TextInput
//                   value={remarks[item._id] || ''}
//                   onChangeText={(text) => setRemarks((prev) => ({ ...prev, [item._id]: text }))}
//                   placeholder="Optional review remark"
//                   placeholderTextColor={theme.icon}
//                   style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//                 />

//                 {item.status === 'pending' ? (
//                   <View style={styles.actionsRow}>
//                     <Pressable
//                       disabled={submittingId === item._id}
//                       style={[styles.actionBtn, styles.approveBtn, submittingId === item._id && styles.disabled]}
//                       onPress={() => review(item._id, 'approve')}>
//                       <ThemedText style={styles.btnText}>Approve</ThemedText>
//                     </Pressable>
//                     <Pressable
//                       disabled={submittingId === item._id}
//                       style={[styles.actionBtn, styles.declineBtn, submittingId === item._id && styles.disabled]}
//                       onPress={() => review(item._id, 'decline')}>
//                       <ThemedText style={styles.btnText}>Decline</ThemedText>
//                     </Pressable>
//                   </View>
//                 ) : null}
//               </ThemedView>
//             );
//           }}
//         />
//       )}
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 16 },
//   centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
//   countText: { fontSize: 13, opacity: 0.75 },
//   listContent: { paddingTop: 10, paddingBottom: 24, gap: 10 },
//   emptyText: { opacity: 0.7, marginTop: 14 },
//   card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
//   rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   statusText: { fontSize: 12, fontWeight: '700', opacity: 0.8 },
//   metaText: { opacity: 0.75, fontSize: 12 },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     minHeight: 40,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//   },
//   actionsRow: { flexDirection: 'row', gap: 8 },
//   actionBtn: {
//     flex: 1,
//     borderRadius: 8,
//     height: 38,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   approveBtn: { backgroundColor: '#16A34A' },
//   declineBtn: { backgroundColor: '#DC2626' },
//   btnText: { color: '#fff', fontWeight: '700' },
//   disabled: { opacity: 0.65 },
// });

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View, Text } from 'react-native';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';
import type { LeaveRequest, UserRole } from '@/src/types';

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

const getRole = (role?: UserRole | { role?: UserRole }) => {
  if (!role) return '';
  return typeof role === 'string' ? role : role.role || '';
};

const getApplicantName = (leave: LeaveRequest) => {
  const applicant = leave.applicantUser;
  if (applicant && typeof applicant === 'object') {
    return applicant.name || applicant.email || applicant._id;
  }

  const user = leave.userId;
  if (user && typeof user === 'object') {
    return user.name || user.email || user._id;
  }

  return applicant || user || 'Unknown User';
};

const getLeaveDetails = (leave: LeaveRequest) => {
  const parts = [leave.leaveType, leave.purpose || leave.reason].filter(Boolean);
  return parts.length ? parts.join(' • ') : 'No leave details provided';
};

export default function LeaveReviewTab() {
  const user = useAuthStore((state) => state.user);
  const role = getRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getAdminLeaves();
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch leave requests.');
      }

      const payload = response.data;
      const rawItems = Array.isArray(payload) ? payload : payload?.leaves || payload?.data || [];
      setItems(rawItems);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch leave requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      void fetchLeaves();
      return;
    }
    setLoading(false);
  }, [fetchLeaves, role]);

  const pendingCount = useMemo(() => items.filter((item) => item.status === 'pending').length, [items]);

  const review = async (leaveId: string, action: 'approve' | 'decline') => {
    try {
      setSubmittingId(leaveId);
      const response = await apiService.reviewLeave(leaveId, {
        action,
        reviewRemark: remarks[leaveId]?.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to review leave.');
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry._id === leaveId
            ? {
                ...entry,
                status: action === 'approve' ? 'approved' : 'declined',
                reviewRemark: remarks[leaveId]?.trim() || entry.reviewRemark,
              }
            : entry,
        ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to review leave.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (role !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Access denied. Admin role is required.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Leave Review</Text>
          <Text style={styles.countText}>Pending requests: {pendingCount}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={PALETTE.accent} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchLeaves(true)} tintColor={PALETTE.accent} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No leave requests found.</Text>}
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            
            return (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.applicantName}>{getApplicantName(item)}</Text>
                  <View style={[
                    styles.statusBadge, 
                    isPending ? styles.badgePending : isApproved ? styles.badgeApproved : styles.badgeDeclined
                  ]}>
                    <Text style={[
                      styles.statusText,
                      isPending ? styles.textPending : isApproved ? styles.textApproved : styles.textDeclined
                    ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.metaText}>From: <Text style={styles.metaValue}>{new Date(item.startDate).toLocaleDateString()}</Text></Text>
                  <Text style={styles.metaText}>To: <Text style={styles.metaValue}>{new Date(item.endDate).toLocaleDateString()}</Text></Text>
                </View>
                
                <Text style={styles.leaveDetails}>{getLeaveDetails(item)}</Text>
                
                {item.reviewRemark ? (
                  <View style={styles.remarkBox}>
                    <Text style={styles.remarkLabel}>Admin Review:</Text>
                    <Text style={styles.remarkValue}>{item.reviewRemark}</Text>
                  </View>
                ) : null}

                {isPending ? (
                  <>
                    <TextInput
                      value={remarks[item._id] || ''}
                      onChangeText={(text) => setRemarks((prev) => ({ ...prev, [item._id]: text }))}
                      placeholder="Optional review remark..."
                      placeholderTextColor={PALETTE.textBody}
                      style={styles.input}
                    />

                    <View style={styles.actionsRow}>
                      <Pressable
                        disabled={submittingId === item._id}
                        style={({ pressed }) => [styles.actionBtn, styles.approveBtn, (submittingId === item._id || pressed) && styles.disabled]}
                        onPress={() => review(item._id, 'approve')}>
                        {submittingId === item._id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Approve</Text>}
                      </Pressable>
                      <Pressable
                        disabled={submittingId === item._id}
                        style={({ pressed }) => [styles.actionBtn, styles.declineBtn, (submittingId === item._id || pressed) && styles.disabled]}
                        onPress={() => review(item._id, 'decline')}>
                        <Text style={styles.btnText}>Decline</Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: PALETTE.background 
  },
  centered: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24,
    backgroundColor: PALETTE.background
  },
  errorText: {
    color: PALETTE.error,
    fontWeight: '600',
    fontSize: 16,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textHeading,
  },
  countText: { 
    fontSize: 13, 
    color: PALETTE.textBody,
    marginTop: 4,
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 40, 
    gap: 12 
  },
  emptyText: { 
    color: PALETTE.textBody,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },

  /* CARDS */
  card: { 
    borderWidth: 1, 
    borderRadius: 4, 
    padding: 16, 
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
    flex: 1,
    paddingRight: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaText: { 
    color: PALETTE.textBody, 
    fontSize: 13, 
  },
  metaValue: {
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  leaveDetails: {
    fontSize: 14,
    color: PALETTE.textHeading,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 20,
  },
  remarkBox: {
    backgroundColor: PALETTE.background,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 4,
  },
  remarkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textBody,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  remarkValue: {
    fontSize: 13,
    color: PALETTE.textHeading,
  },

  /* BADGES */
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgePending: {
    backgroundColor: 'rgba(249, 168, 37, 0.1)',
    borderColor: 'rgba(249, 168, 37, 0.3)',
  },
  textPending: {
    color: PALETTE.warning,
  },
  badgeApproved: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: 'rgba(46, 125, 50, 0.3)',
  },
  textApproved: {
    color: PALETTE.success,
  },
  badgeDeclined: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderColor: 'rgba(211, 47, 47, 0.3)',
  },
  textDeclined: {
    color: PALETTE.error,
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '700',
  },

  /* FORM & ACTIONS */
  input: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: PALETTE.background,
    borderColor: PALETTE.border,
    color: PALETTE.textHeading,
    fontSize: 14,
    marginBottom: 12,
  },
  actionsRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  actionBtn: {
    flex: 1,
    borderRadius: 4,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: { 
    backgroundColor: PALETTE.success 
  },
  declineBtn: { 
    backgroundColor: PALETTE.error 
  },
  btnText: { 
    color: PALETTE.surface, 
    fontWeight: '700',
    fontSize: 13,
  },
  disabled: { 
    opacity: 0.7 
  },
});