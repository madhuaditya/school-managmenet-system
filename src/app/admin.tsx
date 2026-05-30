import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import AttendanceRoster from '@/components/AttendanceRoster';

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
  const [mode, setMode] = useState<'list' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-marked' | 'present' | 'absent' | 'leave'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const adminCount = useMemo(() => admins.length, [admins]);

  const statusFilterOptions = useMemo(() => ([
    { label: 'All', value: 'all' },
    { label: 'Not Marked', value: 'not-marked' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Leave', value: 'leave' },
  ] as const), []);

  const activeFilterLabel = useMemo(() => statusFilterOptions.find((option) => option.value === statusFilter)?.label || 'All', [statusFilter, statusFilterOptions]);
  const activeModeLabel = mode === 'card' ? 'Card' : 'List';
  const isCardMode = mode === 'card';

  const filteredAdmins = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return admins.filter((admin) => {
      const status = todayStatusByAdmin[admin._id] || 'not-marked';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      if (!matchesStatus) return false;

      if (!search) return true;

      const searchableText = [
        admin.user?.name,
        admin.user?.email,
        admin.user?.phone,
        admin.user?.city,
        admin.user?.state,
        admin.user?.address,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(search);
    });
  }, [admins, searchQuery, statusFilter, todayStatusByAdmin]);

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

  const hydrateTodayAttendanceStatus = async (adminList: AdminRecord[]) => {
    const statusMap: Record<string, AttendanceState> = {};

    try {
      const attendanceResponse = await apiService.getTodayAttendanceByRole('admin');
      const attendanceList = attendanceResponse.data?.attendance || [];

      const statusByUserId = new Map<string, AttendanceState>();
      attendanceList.forEach((entry) => {
        const status = entry.status || 'not-marked';
        [entry.userId, entry._id].forEach((key) => {
          if (key) {
            statusByUserId.set(String(key), status);
          }
        });
      });

      adminList.forEach((admin) => {
        const adminUserId = admin.user?._id;
        if (!adminUserId) {
          statusMap[admin._id] = 'not-marked';
          return;
        }

        const status = statusByUserId.get(String(adminUserId)) || 'not-marked';
        statusMap[admin._id] = status;
        statusMap[String(adminUserId)] = status;
      });
    } catch {
      adminList.forEach((admin) => {
        statusMap[admin._id] = 'not-marked';
        if (admin.user?._id) {
          statusMap[String(admin.user._id)] = 'not-marked';
        }
      });
    }

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
        // Alert.alert('Attendance Updated', `${admin.user?.name || 'Admin'} marked ${status}.`);
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
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.icon} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search admins"
            placeholderTextColor={theme.icon}
            style={[styles.searchInput, { color: theme.text, borderColor: theme.icon, backgroundColor: theme.background }]}
          />
        </View>
        <View style={styles.toolbarRow}>
          <View style={styles.filterWrap}>
            <Pressable
              onPress={() => {
                setFilterOpen((prev) => !prev);
                setModeOpen(false);
              }}
              style={({ pressed }) => [styles.dropdownButton, pressed && styles.modeChipPressed]}>
              <ThemedText style={styles.dropdownButtonText}>Filter: {activeFilterLabel}</ThemedText>
              <MaterialCommunityIcons name={filterOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.tint} />
            </Pressable>

            {filterOpen ? (
              <View style={[styles.filterMenu, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                {statusFilterOptions.map((option) => {
                  const isActive = statusFilter === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setStatusFilter(option.value);
                        setFilterOpen(false);
                      }}
                      style={({ pressed }) => [styles.filterOption, isActive && styles.filterOptionActive, pressed && styles.filterOptionPressed]}>
                      <ThemedText style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{option.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.filterWrap}>
            <Pressable
              onPress={() => {
                setModeOpen((prev) => !prev);
                setFilterOpen(false);
              }}
              style={({ pressed }) => [styles.dropdownButton, isCardMode && styles.dropdownButtonActive, pressed && styles.modeChipPressed]}>
              <ThemedText style={[styles.dropdownButtonText, isCardMode && styles.dropdownButtonTextActive]}>View: {activeModeLabel}</ThemedText>
              <MaterialCommunityIcons name={modeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isCardMode ? '#fff' : theme.tint} />
            </Pressable>

            {modeOpen ? (
              <View style={[styles.filterMenu, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                {(['card', 'list'] as const).map((option) => {
                  const isActive = mode === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setMode(option);
                        setModeOpen(false);
                      }}
                      style={({ pressed }) => [styles.filterOption, isActive && styles.filterOptionActive, pressed && styles.filterOptionPressed]}>
                      <ThemedText style={[styles.filterOptionText, isActive && styles.filterOptionTextActive]}>{option === 'card' ? 'Card' : 'List'}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>
        <ThemedText style={styles.count}>{adminCount} admins</ThemedText>
      </View>

      <AttendanceRoster
        role='Admin'
        roster={filteredAdmins.map((a) => ({
          _key: a._id,
          _id: a._id,
          name: a.user?.name || 'Unnamed Admin',
          image: a.user?.image || null,
          rollNumber: undefined,
          studentIdCode: a.user?._id,
          email: a.user?.email,
          fatherName: null,
          motherName: null,
          currentStatus: todayStatusByAdmin[a._id] || (a.user?._id ? todayStatusByAdmin[a.user._id] : undefined) || 'not-marked',
        }))}
        mode={mode}
        updateStatus={(row, status) => {
          const target = admins.find((x) => x._id === row._id);
          if (!target) return;
          void markAdminAttendance(target, status);
        }}
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
  searchWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchIcon: {
    marginLeft: 10,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontWeight: '600',
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterWrap: { position: 'relative', flex: 1 },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.22)',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.22)',
  },
  dropdownButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dropdownButtonText: {
    fontWeight: '800',
    color: '#2563eb',
  },
  dropdownButtonTextActive: {
    color: '#fff',
  },
  modeChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  modeChipText: {
    fontWeight: '800',
    color: '#2563eb',
  },
  modeChipTextActive: {
    color: '#fff',
  },
  modeChipPressed: {
    opacity: 0.9,
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
  filterMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    zIndex: 20,
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  filterOption: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  filterOptionActive: { backgroundColor: 'rgba(37,99,235,0.12)' },
  filterOptionPressed: { opacity: 0.82 },
  filterOptionText: { fontWeight: '700' },
  filterOptionTextActive: { color: '#2563eb' },
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
