import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDashboardModulesForRole } from '@/src/constants/dashboardMenu';
import { useAuthStore } from '@/src/store/auth.store';

interface OverviewStats {
  totalAdmins: number;
  totalClasses: number;
  totalStudents: number;
  totalTeachers?: number;
  totalSubjects?: number;
  totalStaff?: number;
}

interface SchoolInfo {
  _id: string;
  schoolId?: string;
  schoolName: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  image?: string;
}

interface NoticeItem {
  _id: string;
  title: string;
  details: string;
  date: string;
  validity: string;
}

type DayFilter = 'All' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface ClassItem {
  _id: string;
  name: string;
  grade?: string | number;
  section?: string;
}

interface SubjectItem {
  _id: string;
  name?: string;
  code?: string;
}

interface TimetableItem {
  _id: string;
  name?: string;
  day?: string;
  class?: ClassItem | string;
  classId?: string;
  periods?: Array<{
    subject?: SubjectItem | string;
    startTime: string;
    endTime: string;
    hour?: number;
  }>;
}

interface RouteCard {
  route: string;
  label: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  color: string;
}

const DAYS: DayFilter[] = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const schoolId = typeof user?.school === 'string' ? user.school : user?.school?._id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'school' | 'class'>('school');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayFilter>('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState<'All' | string>('All');

  const loadOverview = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [overviewResponse, noticeResponse, classesResponse, timetableResponse, schoolResponse] = await Promise.all([
        apiService.getSchoolOverview(),
        apiService.getValidNotices(),
        apiService.getClasses(),
        apiService.getAllTimetables(),
        schoolId ? apiService.getSchoolInfo(schoolId) : Promise.resolve(null),
      ]);

      if (!overviewResponse.success || !overviewResponse.data) {
        throw new Error(overviewResponse.msg || 'Failed to fetch school overview');
      }

      if (!noticeResponse.success) {
        throw new Error(noticeResponse.msg || 'Failed to fetch notices');
      }

      if (!classesResponse.success) {
        throw new Error(classesResponse.msg || 'Failed to fetch classes');
      }

      if (!timetableResponse.success) {
        throw new Error(timetableResponse.msg || 'Failed to fetch timetable');
      }

      if (schoolResponse && schoolResponse.success && schoolResponse.data) {
        setSchoolInfo(schoolResponse.data);
      }

      setStats(overviewResponse.data);
      setNotices(Array.isArray(noticeResponse.data) ? (noticeResponse.data as unknown as NoticeItem[]) : []);
      setClasses(Array.isArray(classesResponse.data) ? (classesResponse.data as unknown as ClassItem[]) : []);
      setTimetables(Array.isArray(timetableResponse.data) ? (timetableResponse.data as unknown as TimetableItem[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch school overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const loadFilteredTimetable = useCallback(async () => {
    try {
      setTableLoading(true);
      let response;

      if (viewMode === 'class' && selectedClassId) {
        if (selectedDay === 'All') {
          response = await apiService.getTimetableByClass(selectedClassId);
        } else {
          response = await apiService.getTimetableByDay(selectedDay, selectedClassId);
        }
      } else if (selectedDay === 'All') {
        response = await apiService.getAllTimetables();
      } else {
        response = await apiService.getTimetableByDay(selectedDay);
      }

      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch timetable');
      }

      setTimetables(Array.isArray(response.data) ? (response.data as unknown as TimetableItem[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setTableLoading(false);
    }
  }, [selectedClassId, selectedDay, viewMode]);

  useEffect(() => {
    void loadFilteredTimetable();
  }, [loadFilteredTimetable]);

  const getClassName = (item: TimetableItem) => {
    if (item.class && typeof item.class === 'object') {
      return `${item.class.name}${item.class.section ? ` (${item.class.section})` : ''}`;
    }

    const classId = item.classId || (typeof item.class === 'string' ? item.class : '');
    const cls = classes.find((entry) => entry._id === classId);
    if (!cls) return 'Class';
    return `${cls.name}${cls.section ? ` (${cls.section})` : ''}`;
  };

  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    timetables.forEach((item) => {
      (item.periods || []).forEach((period) => {
        if (period.subject && typeof period.subject === 'object' && period.subject._id) {
          map.set(period.subject._id, period.subject.name || period.subject.code || 'Subject');
        }
      });
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [timetables]);

  const filteredTimetables = useMemo(() => {
    if (selectedSubjectId === 'All') return timetables;

    return timetables.filter((item) =>
      (item.periods || []).some((period) => {
        if (period.subject && typeof period.subject === 'object') {
          return period.subject._id === selectedSubjectId;
        }
        if (typeof period.subject === 'string') {
          return period.subject === selectedSubjectId;
        }
        return false;
      }),
    );
  }, [selectedSubjectId, timetables]);

  const getSubjectName = (subject: SubjectItem | string | undefined) => {
    if (!subject) return 'Subject';
    if (typeof subject === 'string') {
      const matched = subjectOptions.find((entry) => entry.id === subject);
      return matched?.label || 'Subject';
    }
    return subject.name || subject.code || 'Subject';
  };

  const overviewItems = [
    { label: 'Total Admins', value: stats?.totalAdmins ?? 0, icon: 'admin-panel-settings' },
    { label: 'Total Classes', value: stats?.totalClasses ?? 0, icon: 'menu-book' },
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: 'school' },
    { label: 'Total Subjects', value: stats?.totalSubjects ?? 0, icon: 'library-books' },
    { label: 'Total Teachers', value: stats?.totalTeachers ?? 0, icon: 'groups' },
    { label: 'Total Staff', value: stats?.totalStaff ?? 0, icon: 'badge' },
  ] as const;

  const visibleRoutes = useMemo(() => {
    if (!role) return [];
    return getDashboardModulesForRole(role, user?._id).map(
      (item): RouteCard => ({
        route: item.route,
        label: item.label,
        icon: item.icon as ComponentProps<typeof MaterialIcons>['name'],
        color: item.color,
      }),
    );
  }, [role, user?._id]);

  const handleNavigate = (route: string) => {
    router.push(route as Href);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadOverview(true)} />}>
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <ThemedView style={[styles.schoolInfoBox, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">School Info</ThemedText>
        <ThemedText style={styles.schoolInfoText}>Name: {schoolInfo?.schoolName || 'N/A'}</ThemedText>
        <ThemedText style={styles.schoolInfoText}>School ID: {schoolInfo?.schoolId || 'N/A'}</ThemedText>
        <ThemedText style={styles.schoolInfoText}>Email: {schoolInfo?.email || 'N/A'}</ThemedText>
        <ThemedText style={styles.schoolInfoText}>
          Address: {[schoolInfo?.address, schoolInfo?.city, schoolInfo?.state, schoolInfo?.pinCode].filter(Boolean).join(', ') || 'N/A'}
        </ThemedText>
      </ThemedView>

      <ThemedText style={styles.subtitle}>School Overview</ThemedText>

      {loading ? (
        <ThemedView style={styles.centered}>
          <ActivityIndicator size="large" color={theme.tint} />
        </ThemedView>
      ) : (
        <>
          <FlatList
            data={overviewItems}
            keyExtractor={(item) => item.label}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.overviewListContainer}
            renderItem={({ item }) => (
              <ThemedView
                style={[
                  styles.overviewCard,
                  { borderColor: theme.icon, backgroundColor: theme.background },
                ]}>
                <View style={styles.overviewTop}>
                  <View style={[styles.iconWrap, { backgroundColor: `${theme.tint}1f` }]}>
                    <MaterialIcons name={item.icon} size={18} color={theme.tint} />
                  </View>
                  <ThemedText style={styles.cardLabel}>{item.label}</ThemedText>
                </View>
                <ThemedText type="title">{item.value}</ThemedText>
              </ThemedView>
            )}
          />

          <ThemedText type="subtitle" style={styles.noticeHeading}>Notices</ThemedText>
          {notices.length === 0 ? (
            <ThemedText style={styles.emptyNoticeText}>No notices available</ThemedText>
          ) : (
            <FlatList
              data={notices}
              renderItem={({ item }) => (
                <ThemedView style={[styles.noticeCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                  <ThemedText>{item.details}</ThemedText>
                  <ThemedText style={styles.noticeMeta}>
                    Date: {new Date(item.date).toLocaleDateString()} | Valid till: {new Date(item.validity).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
              )}
              keyExtractor={(item) => item._id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.noticeListContainer}
            />
          )}

          <ThemedText type="subtitle" style={styles.quickActionsHeading}>Quick Actions</ThemedText>
          {visibleRoutes.length === 0 ? (
            <ThemedText style={styles.emptyNoticeText}>No actions available for your role</ThemedText>
          ) : (
            <FlatList
              data={visibleRoutes}
              renderItem={({ item: card }) => (
                <Pressable
                  onPress={() => handleNavigate(card.route)}
                  style={({ pressed }) => [
                    styles.routeCard,
                    {
                      backgroundColor: card.color,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <MaterialIcons name={card.icon} size={24} color="#fff" />
                  <ThemedText style={styles.routeCardLabel}>{card.label}</ThemedText>
                </Pressable>
              )}
              keyExtractor={(card) => card.route}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.routeCardsContainer}
            />
          )}



          <ThemedText type="subtitle" style={styles.noticeHeading}>Timetable</ThemedText>
          <ThemedText style={styles.filterHint}>Filter by school/class, day and subject</ThemedText>

          <View style={styles.dropdownGroup}>
            <ThemedText style={styles.dropdownLabel}>View</ThemedText>
            <View style={[styles.pickerWrap, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <Picker
                selectedValue={viewMode}
                onValueChange={(value: 'school' | 'class') => {
                  setViewMode(value);
                  if (value === 'school') {
                    setSelectedClassId(null);
                  }
                }}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}>
                <Picker.Item label="School" value="school" />
                <Picker.Item label="School Class" value="class" />
              </Picker>
            </View>
          </View>

          {viewMode === 'class' ? (
            <View style={styles.dropdownGroup}>
              <ThemedText style={styles.dropdownLabel}>Class</ThemedText>
              <View style={[styles.pickerWrap, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                <Picker
                  selectedValue={selectedClassId ?? ''}
                  onValueChange={(value: string) => setSelectedClassId(value || null)}
                  style={[styles.picker, { color: theme.text }]}
                  dropdownIconColor={theme.text}>
                  <Picker.Item label={classes.length === 0 ? 'No classes found' : 'Select Class'} value="" />
                  {classes.map((cls) => (
                    <Picker.Item
                      key={cls._id}
                      label={`${cls.name}${cls.section ? ` (${cls.section})` : ''}`}
                      value={cls._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          ) : null}

          <View style={styles.dropdownGroup}>
            <ThemedText style={styles.dropdownLabel}>Day</ThemedText>
            <View style={[styles.pickerWrap, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <Picker
                selectedValue={selectedDay}
                onValueChange={(value: DayFilter) => setSelectedDay(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}>
                {DAYS.map((day) => (
                  <Picker.Item key={day} label={day} value={day} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.dropdownGroup}>
            <ThemedText style={styles.dropdownLabel}>Subject</ThemedText>
            <View style={[styles.pickerWrap, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <Picker
                selectedValue={selectedSubjectId}
                onValueChange={(value: 'All' | string) => setSelectedSubjectId(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}>
                <Picker.Item label="All Subjects" value="All" />
                {subjectOptions.map((subject) => (
                  <Picker.Item key={subject.id} label={subject.label} value={subject.id} />
                ))}
              </Picker>
            </View>
          </View>

          {tableLoading ? (
            <ThemedView style={styles.centered}>
              <ActivityIndicator size="small" color={theme.tint} />
            </ThemedView>
          ) : filteredTimetables.length === 0 ? (
            <ThemedText style={styles.emptyNoticeText}>No timetable found for selected filters</ThemedText>
          ) : (
            <FlatList
              data={filteredTimetables}
              horizontal={true}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.timetableListContainer}
              renderItem={({ item }) => (
                <ThemedView style={[styles.timetableCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                  <ThemedText type="defaultSemiBold">{item.name || 'Timetable'} | {item.day || 'Day'}</ThemedText>
                  <ThemedText style={styles.noticeMeta}>Class: {getClassName(item)}</ThemedText>
                  {(item.periods || []).map((period, idx) => (
                    <ThemedText key={`${item._id}-${idx}`}>
                      {idx + 1}. {getSubjectName(period.subject)} | {period.startTime} - {period.endTime}
                    </ThemedText>
                  ))}
                </ThemedView>
              )}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     padding: 16,
//     gap: 12,
//     paddingBottom: 36,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   subtitle: {
//     opacity: 0.75,
//   },
//   errorText: {
//     color: '#d93025',
//     fontSize: 13,
//     marginTop: 6,
//   },
//   statsBox: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     gap: 8,
//     marginTop: 8,
//   },
//   schoolInfoBox: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     gap: 6,
//     marginTop: 8,
//   },
//   schoolInfoText: {
//     opacity: 0.85,
//     fontSize: 13,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 6,
//   },
//   statsLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   iconWrap: {
//     width: 30,
//     height: 30,
//     borderRadius: 999,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cardLabel: {
//     opacity: 0.75,
//     fontSize: 13,
//   },
//   quickActionsHeading: {
//     marginTop: 8,
//   },
//   routeCardsContainer: {
//     paddingRight: 16,
//     gap: 12,
//     marginVertical: 8,
//   },
//   routeCard: {
//     width: 120,
//     minWidth: 120,
//     borderRadius: 12,
//     padding: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   routeCardLabel: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 12,
//     textAlign: 'center',
//   },
//   noticeHeading: {
//     marginTop: 8,
//   },
//   noticeListContainer: {
//     paddingRight: 16,
//     gap: 12,
//   },
//   emptyNoticeText: {
//     opacity: 0.7,
//     fontSize: 13,
//   },
//   noticeCard: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     gap: 8,
//     width: 280,
//     minWidth: 280,
//   },
//   noticeMeta: {
//     opacity: 0.65,
//     fontSize: 12,
//   },
//   timetableListContainer: {
//     paddingRight: 16,
//     gap: 12,
//   },
//   timetableCard: {
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     gap: 8,
//     width: 300,
//     minWidth: 300,
//   },
//   filterHint: {
//     opacity: 0.75,
//     fontSize: 12,
//     marginTop: -2,
//   },
//   filterRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   filterChip: {
//     borderWidth: 1,
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },
// });


const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },

  /* SCHOOL INFO */
  schoolInfoBox: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    elevation: 4,
  },

  schoolInfoText: {
    fontSize: 13,
    opacity: 0.8,
  },

  /* OVERVIEW */
  overviewListContainer: {
    paddingRight: 16,
    gap: 12,
  },

  overviewCard: {
    width: 150,
    minWidth: 150,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    elevation: 4,
  },

  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardLabel: {
    fontSize: 13,
    opacity: 0.7,
  },

  /* QUICK ACTIONS */
  quickActionsHeading: {
    marginTop: 6,
  },

  routeCardsContainer: {
    paddingRight: 16,
    gap: 14,
  },

  routeCard: {
    width: 120,
    minWidth: 120,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 5,
  },

  routeCardLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },

  /* NOTICES */
  noticeHeading: {
    marginTop: 6,
  },

  noticeListContainer: {
    paddingRight: 16,
    gap: 12,
  },

  noticeCard: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
    width: 280,
    elevation: 4,
  },

  noticeMeta: {
    fontSize: 11,
    opacity: 0.6,
  },

  emptyNoticeText: {
    opacity: 0.7,
    fontSize: 13,
  },

  /* FILTERS */
  filterHint: {
    fontSize: 12,
    opacity: 0.7,
  },
  dropdownGroup: {
    gap: 6,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  /* TIMETABLE */
  timetableListContainer: {
    paddingRight: 16,
    gap: 12,
  },

  timetableCard: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
    width: 300,
    elevation: 4,
  },
});