import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';
import AttendanceRoster from '@/components/AttendanceRoster';

interface StaffUser {
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
  const [mode, setMode] = useState<'list' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-marked' | 'present' | 'absent' | 'leave'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const staffCount = useMemo(() => staff.length, [staff]);

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

  const filteredStaff = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return staff.filter((staffMember) => {
      const status = todayStatusByStaff[staffMember._id] || 'not-marked';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      if (!matchesStatus) return false;

      if (!search) return true;

      const searchableText = [
        staffMember.user?.name,
        staffMember.user?.email,
        staffMember.user?.phone,
        staffMember.user?.city,
        staffMember.user?.state,
        staffMember.user?.address,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(search);
    });
  }, [staff, searchQuery, statusFilter, todayStatusByStaff]);

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

    try {
      const attendanceResponse = await apiService.getTodayAttendanceByRole('staff');
      
      const attendanceList = attendanceResponse.data?.attendance || [];
      console.log('Attendance response for staff:', attendanceList);
      const statusByUserId = new Map<string, AttendanceState>();
      attendanceList.forEach((entry) => {
        console.log('Processing attendance entry:', entry);
        const status = entry.status || 'not-marked';
        [entry.userId, entry._id].forEach((key) => {
          if (key) {
            statusByUserId.set(String(key), status);
          }
        });
      });

      console.log('Mapped attendance status by user ID:', Array.from(statusByUserId.entries()));

      staffList.forEach((staffMember) => {
        const staffUserId = staffMember.user?._id || staffMember._id;
        if (!staffUserId) {
          statusMap[staffMember._id] = 'not-marked';
          return;
        }

        const status = statusByUserId.get(String(staffUserId)) || 'not-marked';
        statusMap[staffMember._id] = status;
        statusMap[String(staffUserId)] = status;
      });
    } catch {
      staffList.forEach((staffMember) => {
        statusMap[staffMember._id] = 'not-marked';
        const staffUserId = staffMember.user?._id || staffMember._id;
        if (staffUserId) {
          statusMap[String(staffUserId)] = 'not-marked';
        }
      });
    }

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
      // Alert.alert('Attendance Updated', `${staffMember.user?.name || 'Staff'} marked ${status}.`);
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
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={theme.icon} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search staff"
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
        <ThemedText style={styles.count}>{staffCount} staff</ThemedText>
      </View>

      <AttendanceRoster
         role='Staff'
        roster={filteredStaff.map((s) => ({
          _key: s._id,
          _id: s._id,
          name: s.user?.name || 'Unnamed Staff',
          image: s.user?.image || null,
          rollNumber: undefined,
          studentIdCode: s.user?._id || s._id,
          email: s.user?.email,
          fatherName: null,
          motherName: null,
          currentStatus: todayStatusByStaff[s._id] || (s.user?._id ? todayStatusByStaff[s.user._id] : undefined) || 'not-marked',
        }))}
        mode={mode}
        updateStatus={(row, status) => {
          const target = staff.find((x) => x._id === row._id);
          if (!target) return;
          void markStaffAttendance(target, status);
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
