import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import type { UserRole } from '@/src/types';

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

const asDateOnly = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export default function AttendanceDetailByMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const currentUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

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

    console.log('Authorization check:', role, currentId, targetId, getRoleValue(target.role));
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
      const profileRes = await apiService.getUserProfile(id);
      if (!profileRes.success || !profileRes.data) {
        throw new Error(profileRes.msg || 'Failed to load member profile');
      }
      setTargetProfile(profileRes.data as TargetProfile);

      const title = (profileRes.data as TargetProfile).name || 'Attendance Details';
      navigation.setOptions({ title });
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
      // 404 means no records for this month; keep calendar visible with all unmarked.
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

  const statusColor = (status?: AttendanceStatus) => {
    if (status === 'present') return '#16a34a';
    if (status === 'absent') return '#dc2626';
    if (status === 'leave') return '#d97706';
    return '#9ca3af';
  };

  const totalForChart = Math.max(1, consideredDays);

  if (loading && !targetProfile) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (!targetProfile) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Member not found.</ThemedText>
      </ThemedView>
    );
  }

  if (!isAuthorized(currentRole, currentUser?._id, targetProfile)) {
    return (
      <ThemedView style={styles.centered}>
        <MaterialCommunityIcons name="shield-alert-outline" size={28} color="#ef4444" />
        <ThemedText style={styles.deniedTitle}>Access denied</ThemedText>
        <ThemedText style={styles.deniedText}>
          Students can view only their own attendance. Teachers can view their own and student
          attendance. Admin can view anyone.
        </ThemedText>
        <ThemedText style={{ marginTop: 12, opacity: 0.75 }}>Your role: {currentRole || 'unknown'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={[styles.memberCard, { borderColor: theme.icon }]}> 
        <ThemedText style={styles.memberName}>{targetProfile.name || 'Unknown Member'}</ThemedText>
        <ThemedText style={styles.memberMeta}>
          Role: {getRoleValue(targetProfile.role) || 'User'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.monthHeader, { borderColor: theme.icon }]}> 
        <Pressable onPress={() => changeMonth('prev')} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={theme.tint} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </ThemedText>
        <Pressable onPress={() => changeMonth('next')} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.tint} />
        </Pressable>
      </ThemedView>

      <ThemedView style={[styles.chartCard, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle">Monthly Chart</ThemedText>

        {[ 
          { key: 'present', label: 'Present', value: computed.present, color: '#16a34a' },
          { key: 'absent', label: 'Absent', value: computed.absent, color: '#dc2626' },
          { key: 'leave', label: 'Leave', value: computed.leave, color: '#d97706' },
          { key: 'unmarked', label: 'Unmarked', value: computed.unmarked, color: '#6b7280' },
        ].map((item) => (
          <View key={item.key} style={styles.chartRow}>
            <View style={styles.chartLabelWrap}>
              <View style={[styles.chartDot, { backgroundColor: item.color }]} />
              <ThemedText style={styles.chartLabel}>{item.label}</ThemedText>
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
            <ThemedText style={styles.chartValue}>{item.value}</ThemedText>
          </View>
        ))}

        <ThemedText style={styles.chartHint}>
          Showing {consideredDays} day(s) for {MONTH_NAMES[month - 1]} {year}
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.calendarCard, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle">Calendar</ThemedText>
        <View style={styles.weekHeaderRow}>
          {WEEK_DAYS.map((w) => (
            <ThemedText key={w} style={styles.weekCell}>
              {w}
            </ThemedText>
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
                  { borderColor: statusColor(status), opacity: disabled ? 0.45 : 1 },
                ]}>
                <ThemedText style={styles.dayNumber}>{day}</ThemedText>
                {!disabled && <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />}
                {!disabled && (
                  <ThemedText style={styles.dayStatusText}>
                    {status ? status.slice(0, 1).toUpperCase() : 'U'}
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
            <ThemedText style={styles.legendText}>Present</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
            <ThemedText style={styles.legendText}>Absent</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#d97706' }]} />
            <ThemedText style={styles.legendText}>Leave</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
            <ThemedText style={styles.legendText}>Unmarked</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={[styles.summaryCard, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle">API Summary</ThemedText>
        <ThemedText style={styles.summaryText}>Total Marked: {summary?.total ?? computed.marked}</ThemedText>
        <ThemedText style={styles.summaryText}>Present: {summary?.present ?? computed.present}</ThemedText>
        <ThemedText style={styles.summaryText}>Absent: {summary?.absent ?? computed.absent}</ThemedText>
        <ThemedText style={styles.summaryText}>Leave: {summary?.leave ?? computed.leave}</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  deniedTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
  },
  deniedText: {
    textAlign: 'center',
    opacity: 0.75,
    lineHeight: 20,
  },
  memberCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  memberName: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
  },
  memberMeta: {
    marginTop: 2,
    opacity: 0.75,
  },
  monthHeader: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127,127,127,0.12)',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLabelWrap: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLabel: {
    fontSize: 13,
  },
  chartBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(127,127,127,0.2)',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  chartValue: {
    width: 26,
    textAlign: 'right',
    fontWeight: '700',
  },
  chartHint: {
    opacity: 0.65,
    fontSize: 12,
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  weekHeaderRow: {
    flexDirection: 'row',
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.75,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    padding: 3,
  },
  dayBox: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'rgba(127,127,127,0.06)',
  },
  dayNumber: {
    fontWeight: '700',
    fontSize: 12,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dayStatusText: {
    fontSize: 10,
    opacity: 0.8,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  summaryText: {
    fontSize: 13,
    opacity: 0.9,
  },
});