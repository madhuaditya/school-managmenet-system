import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  city?: string;
  state?: string;
  address?: string;
  pinCode?: string;
  active?: boolean;
}

interface AdminRecord {
  _id: string;
  user?: AdminUser;
}

type AttendanceState = 'present' | 'absent' | 'leave' | 'not-marked';

export default function AdminScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingForAdmin, setSubmittingForAdmin] = useState<string | null>(null);
  const [todayStatusByAdmin, setTodayStatusByAdmin] = useState<Record<string, AttendanceState>>({});
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    void fetchAdmins();
  }, [role, router]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAdmins();

      if (response.success) {
        const adminList = (response.data as AdminRecord[]) || [];
        setAdmins(adminList);
        await hydrateTodayAttendanceStatus(adminList);
      } else {
        setError(response.msg || 'Failed to fetch admins');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const adminCount = useMemo(() => admins.length, [admins]);

  const hydrateTodayAttendanceStatus = async (adminList: AdminRecord[]) => {
    const statusMap: Record<string, AttendanceState> = {};

    await Promise.all(
      adminList.map(async (admin) => {
        const adminUserId = admin.user?._id;
        if (!adminUserId) {
          statusMap[admin._id] = 'not-marked';
          return;
        }

        try {
          const attendanceResponse = await apiService.getTodayAttendance(adminUserId);
          const attendancePayload = attendanceResponse.data as
            | { attendance?: Array<{ status?: AttendanceState }> }
            | undefined;
          const attendanceList = attendancePayload?.attendance || [];
          const todayRecord = attendanceList[0];
          statusMap[admin._id] = todayRecord?.status || 'not-marked';
        } catch {
          statusMap[admin._id] = 'not-marked';
        }
      })
    );

    setTodayStatusByAdmin(statusMap);
  };

  const markAdminAttendance = async (
    admin: AdminRecord,
    status: 'present' | 'absent' | 'leave'
  ) => {
    const adminUserId = admin.user?._id;
    if (!adminUserId) {
      Alert.alert('Missing Admin User', 'Unable to mark attendance for this admin.');
      return;
    }

    try {
      setSubmittingForAdmin(admin._id);
      const today = new Date().toISOString().slice(0, 10);
      const hasAttendance = todayStatusByAdmin[admin._id] && todayStatusByAdmin[admin._id] !== 'not-marked';

      const response = hasAttendance
        ? await apiService.updateAttendance({
            userId: adminUserId,
            date: today,
            status,
          })
        : await apiService.markAttendance({
            userId: adminUserId,
            date: today,
            status,
          });

      if (response.success) {
        setTodayStatusByAdmin((prev) => ({
          ...prev,
          [admin._id]: status,
        }));
        Alert.alert('Attendance Updated', `${admin.user?.name || 'Admin'} marked ${status}.`);
      } else {
        Alert.alert('Failed', response.msg || 'Could not update attendance.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update attendance.');
    } finally {
      setSubmittingForAdmin(null);
    }
  };

  const renderAdminCard = ({ item }: { item: AdminRecord }) => {
    const currentStatus = todayStatusByAdmin[item._id] || 'not-marked';
    const currentStatusLabel =
      currentStatus === 'not-marked'
        ? 'Not Marked'
        : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

    return (
      <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <ThemedText type="subtitle" style={styles.name}>
          {item.user?.name || 'Unnamed Admin'}
        </ThemedText>
        <ThemedText style={styles.meta}>Email: {item.user?.email || 'N/A'}</ThemedText>
        <ThemedText style={styles.meta}>Phone: {item.user?.phone || 'N/A'}</ThemedText>
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
            disabled={submittingForAdmin === item._id}
            onPress={() => markAdminAttendance(item, 'present')}>
            <ThemedText style={styles.attendanceButtonText}>Present</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.absentButton]}
            disabled={submittingForAdmin === item._id}
            onPress={() => markAdminAttendance(item, 'absent')}>
            <ThemedText style={styles.attendanceButtonText}>Absent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.leaveButton]}
            disabled={submittingForAdmin === item._id}
            onPress={() => markAdminAttendance(item, 'leave')}>
            <ThemedText style={styles.attendanceButtonText}>Leave</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.viewAttendanceButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push(`/attdence-detail/${item.user?._id}`)}>
          <ThemedText style={styles.viewAttendanceButtonText}>View Attendance</ThemedText>
        </TouchableOpacity>

        {submittingForAdmin === item._id ? (
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
        <ThemedText style={styles.count}>{adminCount} admins found</ThemedText>
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item._id}
        renderItem={renderAdminCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.centered}>
            <ThemedText>No admins found</ThemedText>
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
    paddingVertical: 8,
    alignItems: 'center',
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
  submittingContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submittingText: {
    fontSize: 12,
    opacity: 0.8,
  },
  viewAttendanceButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAttendanceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.8,
  },
  count: {
    marginTop: 6,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
