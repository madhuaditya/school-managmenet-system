import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';

interface StaffUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  pinCode?: string;
  active?: boolean;
}

interface StaffRecord {
  _id: string;
  user?: StaffUser;
  role?: { role?: string };
}

type AttendanceState = 'present' | 'absent' | 'leave' | 'not-marked';

export default function StaffScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const user = useAuthStore((state) => state.user);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingForStaff, setSubmittingForStaff] = useState<string | null>(null);
  const [todayStatusByStaff, setTodayStatusByStaff] = useState<Record<string, AttendanceState>>({});

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const staffCount = useMemo(() => staff.length, [staff]);

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    void fetchStaff();
  }, [role, router]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStaff();
      if (!response.success) throw new Error(response.msg || 'Failed to fetch staff');

      const staffList = (response.data as StaffRecord[]) || [];
      setStaff(staffList);
      await hydrateTodayAttendanceStatus(staffList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const hydrateTodayAttendanceStatus = async (staffList: StaffRecord[]) => {
    const statusMap: Record<string, AttendanceState> = {};

    await Promise.all(
      staffList.map(async (staffMember) => {
        const staffUserId = staffMember.user?._id || staffMember._id;
        if (!staffUserId) {
          statusMap[staffMember._id] = 'not-marked';
          return;
        }

        try {
          const attendanceResponse = await apiService.getTodayAttendance(staffUserId);
          const attendancePayload = attendanceResponse.data as { attendance?: Array<{ status?: AttendanceState }> } | undefined;
          const attendanceList = attendancePayload?.attendance || [];
          statusMap[staffMember._id] = attendanceList[0]?.status || 'not-marked';
        } catch {
          statusMap[staffMember._id] = 'not-marked';
        }
      }),
    );

    setTodayStatusByStaff(statusMap);
  };

  const markStaffAttendance = async (staffMember: StaffRecord, status: 'present' | 'absent' | 'leave') => {
    const staffUserId = staffMember.user?._id || staffMember._id;
    if (!staffUserId) {
      Alert.alert('Missing Staff User', 'Unable to mark attendance for this staff member.');
      return;
    }

    try {
      setSubmittingForStaff(staffMember._id);
      const today = new Date().toISOString().slice(0, 10);
      const hasAttendance = todayStatusByStaff[staffMember._id] && todayStatusByStaff[staffMember._id] !== 'not-marked';

      const response = hasAttendance
        ? await apiService.updateAttendance({
            userId: staffUserId,
            date: today,
            status,
          })
        : await apiService.markAttendance({
            userId: staffUserId,
            date: today,
            status,
          });

      if (!response.success) {
        Alert.alert('Failed', response.msg || 'Could not mark attendance.');
        return;
      }

      setTodayStatusByStaff((prev) => ({ ...prev, [staffMember._id]: status }));
      Alert.alert('Attendance Updated', `${staffMember.user?.name || 'Staff'} marked ${status}.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not mark attendance.');
    } finally {
      setSubmittingForStaff(null);
    }
  };

  const renderStaffCard = ({ item }: { item: StaffRecord }) => {
    const currentStatus = todayStatusByStaff[item._id] || 'not-marked';
    const currentStatusLabel =
      currentStatus === 'not-marked'
        ? 'Not Marked'
        : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

    return (
      <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}> 
        <ThemedText type="subtitle" style={styles.name}>{item.user?.name || 'Unnamed Staff'}</ThemedText>
        <ThemedText style={styles.meta}>Email: {item.user?.email || 'N/A'}</ThemedText>
        <ThemedText style={styles.meta}>Phone: {item.user?.phone || 'N/A'}</ThemedText>
        <ThemedText style={styles.meta}>Role: {item.role?.role || 'staff'}</ThemedText>
        <ThemedText style={styles.meta}>Status: {item.user?.active ? 'Active' : 'Inactive'}</ThemedText>
        <ThemedText style={styles.meta}>
          Address: {[item.user?.address, item.user?.city, item.user?.state, item.user?.pinCode].filter(Boolean).join(', ') || 'N/A'}
        </ThemedText>

        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusLabel}>Today's Status:</ThemedText>
          <View
            style={[
              styles.statusBadge,
              currentStatus === 'present'
                ? styles.statusPresent
                : currentStatus === 'absent'
                ? styles.statusAbsent
                : currentStatus === 'leave'
                ? styles.statusLeave
                : styles.statusNotMarked,
            ]}>
            <ThemedText style={styles.statusText}>{currentStatusLabel}</ThemedText>
          </View>
        </View>

        <View style={styles.attendanceRow}>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.presentButton]}
            disabled={submittingForStaff === item._id}
            onPress={() => markStaffAttendance(item, 'present')}>
            <ThemedText style={styles.attendanceButtonText}>Present</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.absentButton]}
            disabled={submittingForStaff === item._id}
            onPress={() => markStaffAttendance(item, 'absent')}>
            <ThemedText style={styles.attendanceButtonText}>Absent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.leaveButton]}
            disabled={submittingForStaff === item._id}
            onPress={() => markStaffAttendance(item, 'leave')}>
            <ThemedText style={styles.attendanceButtonText}>Leave</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.viewAttendanceButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push(`/attdence-detail/${item.user?._id}`)}>
          <ThemedText style={styles.viewAttendanceButtonText}>View Attendance</ThemedText>
        </TouchableOpacity>

        {submittingForStaff === item._id ? (
          <View style={styles.submittingContainer}>
            <ActivityIndicator size="small" color={theme.tint} />
            <ThemedText style={styles.submittingText}>Saving attendance...</ThemedText>
          </View>
        ) : null}
      </ThemedView>
    );
  };

  if (role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.count}>{staffCount} staff members found</ThemedText>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(item) => item._id}
        renderItem={renderStaffCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.centered}>
            <ThemedText>No staff found</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  count: {
    marginTop: 6,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  name: {
    marginBottom: 8,
  },
  meta: {
    marginTop: 4,
    lineHeight: 20,
  },
  statusContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPresent: {
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
  },
  statusAbsent: {
    backgroundColor: 'rgba(198, 40, 40, 0.15)',
  },
  statusLeave: {
    backgroundColor: 'rgba(239, 108, 0, 0.15)',
  },
  statusNotMarked: {
    backgroundColor: 'rgba(120, 120, 120, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attendanceRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  attendanceButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  presentButton: {
    backgroundColor: '#2e7d32',
  },
  absentButton: {
    backgroundColor: '#c62828',
  },
  leaveButton: {
    backgroundColor: '#ef6c00',
  },
  attendanceButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  viewAttendanceButton: {
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewAttendanceButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
  },
  submittingContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submittingText: {
    fontSize: 12,
    opacity: 0.75,
  },
});
