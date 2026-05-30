import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { apiService } from '@/api/client';
import {
  BroadcastDelivery,
  BroadcastHistoryItem,
  BroadcastPreviewRecipient,
  BroadcastPreviewResponse,
  Class,
  Student,
  Teacher,
  User,
} from '@/src/types';
import { useAuthStore } from '@/src/store/auth.store';

const lightPalette = {
  bg: '#F3F4F6',
  card: '#FFFFFF',
  cardSoft: '#F9FAFB',
  border: '#E5E7EB',
  text: '#111827',
  subText: '#6B7280',
  primary: '#2563EB',
  primarySoft: '#DBEAFE',
  success: '#059669',
  successSoft: '#D1FAE5',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warn: '#D97706',
  warnSoft: '#FEF3C7',
};

const darkPalette = {
  bg: '#0B1220',
  card: '#111827',
  cardSoft: '#172033',
  border: '#243244',
  text: '#E5E7EB',
  subText: '#9CA3AF',
  primary: '#60A5FA',
  primarySoft: '#1E3A8A',
  success: '#34D399',
  successSoft: '#064E3B',
  danger: '#F87171',
  dangerSoft: '#7F1D1D',
  warn: '#FBBF24',
  warnSoft: '#78350F',
};

type BroadcastChannel = 'alert' | 'email' | 'sms' | 'whatsapp' | 'telegram';
type BroadcastRole = 'admin' | 'teacher' | 'staff' | 'student';

interface PersonOption {
  id: string;
  label: string;
  meta?: string;
}

interface ClassOption {
  id: string;
  label: string;
}

const CHANNEL_OPTIONS: Array<{
  value: BroadcastChannel;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof FontAwesome6>['name'];
}> = [
  { value: 'alert', label: 'In-App Alert', description: 'Internal notification inside the app.', icon: 'bell' },
  { value: 'email', label: 'Email', description: 'Send to registered email addresses.', icon: 'envelope' },
  { value: 'sms', label: 'SMS', description: 'Send through configured SMS provider.', icon: 'message' },
  { value: 'whatsapp', label: 'WhatsApp', description: 'Send through configured WhatsApp provider.', icon: 'whatsapp' },
  { value: 'telegram', label: 'Telegram', description: 'Send through linked Telegram accounts.', icon: 'telegram' },
];

const ROLE_OPTIONS: Array<{ value: BroadcastRole; label: string }> = [
  { value: 'admin', label: 'Admins' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Students' },
];

const emptySummary = { total: 0, sent: 0, failed: 0, skipped: 0 };

const getStatusColors = (palette: typeof lightPalette): Record<string, { bg: string; fg: string }> => ({
  completed: { bg: palette.successSoft, fg: palette.success },
  completed_with_failures: { bg: palette.warnSoft, fg: palette.warn },
  failed: { bg: palette.dangerSoft, fg: palette.danger },
  processing: { bg: palette.primarySoft, fg: palette.primary },
  sent: { bg: palette.successSoft, fg: palette.success },
  skipped: { bg: palette.warnSoft, fg: palette.warn },
});

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString();
};

const normalizePerson = (item: { _id?: string; user?: User; name?: string; email?: string; phone?: string }, fallback: string): PersonOption | null => {
  const id = item?.user?._id || item?._id || '';
  if (!id) return null;
  return {
    id,
    label: item?.user?.name || item?.name || fallback,
    meta: item?.user?.email || item?.email || item?.phone || undefined,
  };
};

const normalizeClass = (item: Class): ClassOption | null => {
  if (!item?._id) return null;
  return {
    id: item._id,
    label: `${item.name || 'Class'}${item.section ? ` (${item.section})` : ''}`,
  };
};

const BroadcastTabScreen = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? darkPalette : lightPalette;
  const { width } = useWindowDimensions();
  const compactLayout = width < 420;

  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const canAccess = ['admin', 'teacher', 'staff'].includes(String(role || ''));

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const [admins, setAdmins] = useState<PersonOption[]>([]);
  const [teachers, setTeachers] = useState<PersonOption[]>([]);
  const [staff, setStaff] = useState<PersonOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [studentsByClassId, setStudentsByClassId] = useState<Record<string, PersonOption[]>>({});

  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState('');
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastHistoryItem | null>(null);
  const [deliveries, setDeliveries] = useState<BroadcastDelivery[]>([]);

  const [selectedChannels, setSelectedChannels] = useState<BroadcastChannel[]>(['alert']);
  const [selectedRoles, setSelectedRoles] = useState<BroadcastRole[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [sectionState, setSectionState] = useState({
    create: true,
    preview: !compactLayout,
    history: !compactLayout,
    delivery: !compactLayout,
  });

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [preview, setPreview] = useState<BroadcastPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (canAccess) return;
    router.replace('/(tabs)');
  }, [canAccess, router]);

  useEffect(() => {
    if (!canAccess) return;
    void loadInitialData();
  }, [canAccess]);

  useEffect(() => {
    setSectionState({
      create: true,
      preview: !compactLayout,
      history: !compactLayout,
      delivery: !compactLayout,
    });
  }, [compactLayout]);

  useEffect(() => {
    if (!selectedClassIds.length) {
      setSelectedStudentIds([]);
      return;
    }

    selectedClassIds.forEach((classId) => {
      if (!studentsByClassId[classId]) {
        void loadStudentsByClass(classId);
      }
    });
  }, [selectedClassIds, studentsByClassId]);

  useEffect(() => {
    const allowedStudentIds = new Set(studentOptions.map((option) => option.id));
    setSelectedStudentIds((prev) => prev.filter((id) => allowedStudentIds.has(id)));
  }, [selectedClassIds, studentsByClassId]);

  const adminOptions = useMemo(() => admins, [admins]);
  const teacherOptions = useMemo(() => teachers, [teachers]);
  const staffOptions = useMemo(() => staff, [staff]);
  const classOptions = useMemo(() => classes, [classes]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, PersonOption>();

    selectedClassIds.forEach((classId) => {
      (studentsByClassId[classId] || []).forEach((student) => {
        if (map.has(student.id)) return;
        map.set(student.id, {
          id: student.id,
          label: student.label,
          meta: classOptions.find((item) => item.id === classId)?.label,
        });
      });
    });

    return Array.from(map.values());
  }, [classOptions, selectedClassIds, studentsByClassId]);

  const selectedUserIds = useMemo(
    () =>
      [...new Set([
        ...selectedAdminIds,
        ...selectedTeacherIds,
        ...selectedStaffIds,
        ...selectedStudentIds,
      ])],
    [selectedAdminIds, selectedTeacherIds, selectedStaffIds, selectedStudentIds],
  );

  const audiencePayload = useMemo(
    () => ({
      userIds: selectedUserIds,
      roleNames: selectedRoles,
      classIds: selectedClassIds,
    }),
    [selectedClassIds, selectedRoles, selectedUserIds],
  );

  const summary = useMemo(() => {
    return history.reduce(
      (accumulator, item) => {
        accumulator.campaigns += 1;
        accumulator.sent += Number(item.deliverySummary?.sent || 0);
        accumulator.failed += Number(item.deliverySummary?.failed || 0);
        accumulator.skipped += Number(item.deliverySummary?.skipped || 0);
        return accumulator;
      },
      { campaigns: 0, sent: 0, failed: 0, skipped: 0 },
    );
  }, [history]);

  const clearTransient = () => {
    setError(null);
    setSuccess(null);
  };

  const toggleValue = <T,>(values: T[], setValues: React.Dispatch<React.SetStateAction<T[]>>, nextValue: T) => {
    setValues((current) =>
      current.includes(nextValue) ? current.filter((value) => value !== nextValue) : [...current, nextValue],
    );
  };

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const [adminResult, teacherResult, staffResult, classResult, historyResult] = await Promise.all([
        apiService.getAdmins(),
        apiService.getTeachers(),
        apiService.getStaff(),
        apiService.getClasses(),
        apiService.getBroadcastHistory(),
      ]);

      if (!adminResult.success) throw new Error(adminResult.msg || 'Failed to load admins');
      if (!teacherResult.success) throw new Error(teacherResult.msg || 'Failed to load teachers');
      if (!staffResult.success) throw new Error(staffResult.msg || 'Failed to load staff');
      if (!classResult.success) throw new Error(classResult.msg || 'Failed to load classes');
      if (!historyResult.success) throw new Error(historyResult.msg || 'Failed to load history');

      setAdmins((Array.isArray(adminResult.data) ? adminResult.data : [])
        .map((item) => normalizePerson(item as { _id?: string; user?: User }, 'Admin'))
        .filter((item): item is PersonOption => Boolean(item)));
      setTeachers((Array.isArray(teacherResult.data) ? teacherResult.data : [])
        .map((item) => normalizePerson(item as Teacher, 'Teacher'))
        .filter((item): item is PersonOption => Boolean(item)));
      setStaff((Array.isArray(staffResult.data) ? staffResult.data : [])
        .map((item) => normalizePerson(item as { _id?: string; user?: User }, 'Staff'))
        .filter((item): item is PersonOption => Boolean(item)));
      setClasses((Array.isArray(classResult.data) ? classResult.data : [])
        .map((item) => normalizeClass(item))
        .filter((item): item is ClassOption => Boolean(item)));
      setHistory(Array.isArray(historyResult.data) ? historyResult.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load broadcast data');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadStudentsByClass = async (classId: string) => {
    try {
      const response = await apiService.getClassStudents(classId);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to load class students');
      }

      const students = (Array.isArray(response.data) ? response.data : [])
        .map((student) => normalizePerson(student as Student & { user?: User }, 'Student'))
        .filter((item): item is PersonOption => Boolean(item));

      setStudentsByClassId((current) => ({
        ...current,
        [classId]: students,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load class students');
    }
  };

  const refreshHistory = async () => {
    try {
      setRefreshingHistory(true);
      const response = await apiService.getBroadcastHistory();
      if (!response.success) {
        throw new Error(response.msg || 'Failed to refresh history');
      }
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh history');
    } finally {
      setRefreshingHistory(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required.';
    if (!message.trim()) return 'Message is required.';
    if (!selectedChannels.length) return 'Select at least one delivery channel.';
    if (!selectedRoles.length && !selectedClassIds.length && !selectedUserIds.length) {
      return 'Select at least one role, class, or manual recipient.';
    }
    return null;
  };

  const previewRecipients = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setPreviewing(true);
      clearTransient();
      const response = await apiService.previewBroadcastRecipients(audiencePayload);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to preview recipients');
      }
      setPreview(response.data || null);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Failed to preview recipients');
    } finally {
      setPreviewing(false);
    }
  };

  const sendBroadcast = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSending(true);
      clearTransient();

      const response = await apiService.sendBroadcast({
        title: title.trim(),
        subject: subject.trim(),
        message: message.trim(),
        channels: selectedChannels,
        ...audiencePayload,
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to send broadcast');
      }

      setSuccess(response.msg || 'Broadcast sent successfully.');
      setTitle('');
      setSubject('');
      setMessage('');
      setSelectedChannels(['alert']);
      setSelectedRoles([]);
      setSelectedClassIds([]);
      setSelectedAdminIds([]);
      setSelectedTeacherIds([]);
      setSelectedStaffIds([]);
      setSelectedStudentIds([]);
      setPreview(null);

      await refreshHistory();

      if (response.data?._id) {
        void openBroadcastDetails(response.data._id);
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const openBroadcastDetails = async (broadcastId: string) => {
    if (!broadcastId) return;

    try {
      setSelectedBroadcastId(broadcastId);
      setLoadingDeliveries(true);
      const [broadcastResult, deliveryResult] = await Promise.all([
        apiService.getBroadcastById(broadcastId),
        apiService.getBroadcastDeliveries(broadcastId),
      ]);

      if (!broadcastResult.success) {
        throw new Error(broadcastResult.msg || 'Failed to load broadcast details');
      }

      if (!deliveryResult.success) {
        throw new Error(deliveryResult.msg || 'Failed to load delivery details');
      }

      setSelectedBroadcast(broadcastResult.data || null);
      setDeliveries(Array.isArray(deliveryResult.data) ? deliveryResult.data : []);
    } catch (detailsError) {
      setError(detailsError instanceof Error ? detailsError.message : 'Failed to load delivery details');
    } finally {
      setLoadingDeliveries(false);
    }
  };

  if (!canAccess) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (initialLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: palette.text }]}>Broadcast Messages</Text>
          <Text style={[styles.subtitle, { color: palette.subText }]}>Compose, preview, and track school-wide messages from one screen.</Text>
        </View>
        <Pressable
          onPress={refreshHistory}
          style={({ pressed }) => [
            styles.iconButton,
            { borderColor: palette.border, backgroundColor: pressed ? palette.cardSoft : palette.card },
          ]}
        >
          <MaterialIcons name="refresh" size={20} color={palette.text} />
        </Pressable>
      </View>

      {error ? <View style={[styles.banner, { backgroundColor: palette.dangerSoft }]}><Text style={[styles.bannerText, { color: palette.danger }]}>{error}</Text></View> : null}
      {success ? <View style={[styles.banner, { backgroundColor: palette.successSoft }]}><Text style={[styles.bannerText, { color: palette.success }]}>{success}</Text></View> : null}

      <View style={styles.statsRow}>
        <StatCard label="Campaigns" value={summary.campaigns} palette={palette} />
        <StatCard label="Sent" value={summary.sent} palette={palette} accent="success" />
        <StatCard label="Failed" value={summary.failed} palette={palette} accent="danger" />
        <StatCard label="Skipped" value={summary.skipped} palette={palette} accent="warn" />
      </View>

      <SectionCard
        title="Create Broadcast"
        subtitle="Channels, audience, and content."
        palette={palette}
        expanded={sectionState.create}
        onToggle={() => setSectionState((current) => ({ ...current, create: !current.create }))}
      >
        {sectionState.create ? (
          <>
        <SectionLabel title="Delivery Channels" palette={palette} />
        <View style={styles.chipWrap}>
          {CHANNEL_OPTIONS.map((channel) => {
            const active = selectedChannels.includes(channel.value);
            return (
              <Pressable
                key={channel.value}
                onPress={() => toggleValue(selectedChannels, setSelectedChannels, channel.value)}
                style={({ pressed }) => [
                  styles.channelCard,
                  {
                    backgroundColor: active ? palette.primarySoft : palette.cardSoft,
                    borderColor: active ? palette.primary : palette.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.channelIcon, { backgroundColor: active ? palette.primary : palette.card, borderColor: active ? palette.primary : palette.border }]}>
                  <FontAwesome6 name={channel.icon} size={16} color={active ? '#fff' : palette.subText} />
                </View>
                <View style={styles.channelTextWrap}>
                  <Text style={[styles.optionTitle, { color: palette.text }]}>{channel.label}</Text>
                  <Text style={[styles.optionMeta, { color: palette.subText }]}>{channel.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fieldGap}>
          <SectionLabel title="Title" palette={palette} />
          <TextInput
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              clearTransient();
            }}
            placeholder="Broadcast title"
            placeholderTextColor={palette.subText}
            style={[styles.input, { backgroundColor: palette.cardSoft, borderColor: palette.border, color: palette.text }]}
          />
        </View>

        <View style={styles.fieldGap}>
          <SectionLabel title="Subject" palette={palette} />
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Optional email subject"
            placeholderTextColor={palette.subText}
            style={[styles.input, { backgroundColor: palette.cardSoft, borderColor: palette.border, color: palette.text }]}
          />
        </View>

        <View style={styles.fieldGap}>
          <SectionLabel title="Message" palette={palette} />
          <TextInput
            value={message}
            onChangeText={(value) => {
              setMessage(value);
              clearTransient();
            }}
            placeholder="Write the message recipients should receive."
            placeholderTextColor={palette.subText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[styles.textArea, { backgroundColor: palette.cardSoft, borderColor: palette.border, color: palette.text }]}
          />
        </View>

        <View style={styles.fieldGap}>
          <SectionLabel title="Target by Role" palette={palette} />
          <View style={styles.inlineChipRow}>
            {ROLE_OPTIONS.map((roleOption) => {
              const active = selectedRoles.includes(roleOption.value);
              return (
                <Pressable
                  key={roleOption.value}
                  onPress={() => toggleValue(selectedRoles, setSelectedRoles, roleOption.value)}
                  style={({ pressed }) => [
                    styles.pill,
                    {
                      backgroundColor: active ? palette.text : palette.cardSoft,
                      borderColor: active ? palette.text : palette.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: active ? palette.card : palette.text }]}>{roleOption.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGap}>
          <SectionLabel title="Target Classes" palette={palette} />
          <View style={styles.inlineChipRow}>
            {classOptions.map((classOption) => {
              const active = selectedClassIds.includes(classOption.id);
              return (
                <Pressable
                  key={classOption.id}
                  onPress={() => toggleValue(selectedClassIds, setSelectedClassIds, classOption.id)}
                  style={({ pressed }) => [
                    styles.pill,
                    {
                      backgroundColor: active ? palette.primarySoft : palette.cardSoft,
                      borderColor: active ? palette.primary : palette.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: active ? palette.primary : palette.text }]}>{classOption.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.helperText, { color: palette.subText }]}>Students for selected classes load automatically into the manual recipient list.</Text>
        </View>

        <View style={styles.fieldGap}>
          <SectionLabel title="Manual Recipients" palette={palette} />
          <RecipientGroup title="Admins" items={adminOptions} selectedIds={selectedAdminIds} onToggle={(id) => toggleValue(selectedAdminIds, setSelectedAdminIds, id)} palette={palette} />
          <RecipientGroup title="Teachers" items={teacherOptions} selectedIds={selectedTeacherIds} onToggle={(id) => toggleValue(selectedTeacherIds, setSelectedTeacherIds, id)} palette={palette} />
          <RecipientGroup title="Staff" items={staffOptions} selectedIds={selectedStaffIds} onToggle={(id) => toggleValue(selectedStaffIds, setSelectedStaffIds, id)} palette={palette} />
          <RecipientGroup title="Students" items={studentOptions} selectedIds={selectedStudentIds} onToggle={(id) => toggleValue(selectedStudentIds, setSelectedStudentIds, id)} palette={palette} />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={previewRecipients}
            disabled={previewing || sending}
            style={({ pressed }) => [
              styles.actionButton,
              styles.secondaryButton,
              {
                borderColor: palette.border,
                backgroundColor: palette.card,
                opacity: previewing || sending ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {previewing ? <ActivityIndicator color={palette.primary} /> : <><FontAwesome6 name="eye" size={14} color={palette.primary} /><Text style={[styles.actionText, { color: palette.primary }]}>Preview Recipients</Text></>}
          </Pressable>

          <Pressable
            onPress={sendBroadcast}
            disabled={previewing || sending}
            style={({ pressed }) => [
              styles.actionButton,
              styles.primaryButton,
              {
                backgroundColor: palette.primary,
                opacity: previewing || sending ? 0.6 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <><FontAwesome6 name="paper-plane" size={14} color="#fff" /><Text style={styles.actionTextPrimary}>Send Broadcast</Text></>}
          </Pressable>
        </View>
          </>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Recipient Preview"
        subtitle="Check the audience before sending."
        palette={palette}
        expanded={sectionState.preview}
        onToggle={() => setSectionState((current) => ({ ...current, preview: !current.preview }))}
      >
        {sectionState.preview ? (!preview ? (
          <EmptyState text="No preview generated yet." palette={palette} />
        ) : (
          <View style={styles.previewWrap}>
            <View style={[styles.previewCount, { backgroundColor: palette.primarySoft, borderColor: palette.primary }]}>
              <Text style={[styles.previewCountLabel, { color: palette.primary }]}>Estimated recipients</Text>
              <Text style={[styles.previewCountValue, { color: palette.primary }]}>{preview.count}</Text>
            </View>
            <View style={styles.previewList}>
              {(preview.recipients || []).map((recipient: BroadcastPreviewRecipient) => (
                <View key={recipient._id} style={[styles.previewItem, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
                  <Text style={[styles.previewItemTitle, { color: palette.text }]}>{recipient.name || 'Unnamed user'}</Text>
                  <Text style={[styles.previewItemMeta, { color: palette.subText }]}>{recipient.role || 'unknown role'} | {recipient.email || recipient.phone || 'No contact'}</Text>
                </View>
              ))}
            </View>
          </View>
        )) : null}
      </SectionCard>

      <SectionCard
        title="Campaign History"
        subtitle="Review recent broadcasts and delivery results."
        palette={palette}
        expanded={sectionState.history}
        onToggle={() => setSectionState((current) => ({ ...current, history: !current.history }))}
      >
        {sectionState.history ? (history.length === 0 ? (
          <EmptyState text="No broadcasts have been sent yet." palette={palette} />
        ) : (
          <View style={styles.historyList}>
            {history.map((item) => {
              const statusKey = String(item.status || 'unknown').toLowerCase();
              const colorSet = getStatusColors(palette)[statusKey] || { bg: palette.cardSoft, fg: palette.text };
              const summaryBlock = item.deliverySummary || emptySummary;
              return (
                <View key={item._id} style={[styles.historyItem, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
                  <View style={styles.historyTopRow}>
                    <View style={styles.historyBody}>
                      <Text style={[styles.historyTitle, { color: palette.text }]}>{item.title || 'Untitled broadcast'}</Text>
                      <Text style={[styles.historyMessage, { color: palette.subText }]}>{item.message || '-'}</Text>
                      <Text style={[styles.historyMeta, { color: palette.subText }]}>{formatDateTime(item.createdAt)} • {Array.isArray(item.channels) ? item.channels.join(', ') : '-'} • {item.recipientCount || 0} recipients</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: colorSet.bg }]}>
                      <Text style={[styles.statusText, { color: colorSet.fg }]}>{statusKey.replaceAll('_', ' ')}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryRow}>
                    <SummaryBox label="Total" value={summaryBlock.total || 0} palette={palette} />
                    <SummaryBox label="Sent" value={summaryBlock.sent || 0} palette={palette} accent="success" />
                    <SummaryBox label="Failed" value={summaryBlock.failed || 0} palette={palette} accent="danger" />
                    <SummaryBox label="Skipped" value={summaryBlock.skipped || 0} palette={palette} accent="warn" />
                  </View>

                  <Pressable
                    onPress={() => void openBroadcastDetails(item._id)}
                    style={({ pressed }) => [
                      styles.viewButton,
                      {
                        backgroundColor: palette.text,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.viewButtonText}>View Deliveries</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )) : null}
      </SectionCard>

      <SectionCard
        title="Delivery Details"
        subtitle={selectedBroadcastId ? 'Inspect channel-level outcomes.' : 'Select a campaign to inspect delivery results.'}
        palette={palette}
        expanded={sectionState.delivery}
        onToggle={() => setSectionState((current) => ({ ...current, delivery: !current.delivery }))}
      >
        {sectionState.delivery ? (loadingDeliveries ? (
          <ActivityIndicator size="large" color={palette.primary} />
        ) : !selectedBroadcastId ? (
          <EmptyState text="No campaign selected." palette={palette} />
        ) : deliveries.length === 0 ? (
          <EmptyState text="No delivery records found for this campaign." palette={palette} />
        ) : (
          <View style={styles.deliveryList}>
            {selectedBroadcast ? (
              <View style={[styles.deliveryHeader, { borderColor: palette.border, backgroundColor: palette.cardSoft }]}>
                <Text style={[styles.deliveryHeaderTitle, { color: palette.text }]}>{selectedBroadcast.title || 'Broadcast'}</Text>
                <Text style={[styles.deliveryHeaderMeta, { color: palette.subText }]}>{formatDateTime(selectedBroadcast.createdAt)}</Text>
              </View>
            ) : null}

            {deliveries.map((delivery) => {
              const deliveryStatus = String(delivery.status || 'unknown').toLowerCase();
              const colorSet = getStatusColors(palette)[deliveryStatus] || { bg: palette.cardSoft, fg: palette.text };
              return (
                <View key={delivery._id} style={[styles.deliveryCard, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
                  <View style={styles.deliveryCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deliveryName, { color: palette.text }]}>{delivery.createdFor?.name || 'Unknown user'}</Text>
                      <Text style={[styles.deliveryMeta, { color: palette.subText }]}>{delivery.createdFor?.email || delivery.createdFor?.phone || '-'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: colorSet.bg }]}>
                      <Text style={[styles.statusText, { color: colorSet.fg }]}>{deliveryStatus}</Text>
                    </View>
                  </View>

                  <View style={styles.deliveryGrid}>
                    <DeliveryMeta label="Channel" value={delivery.channel || '-'} palette={palette} />
                    <DeliveryMeta label="Destination" value={delivery.destination || '-'} palette={palette} />
                    <DeliveryMeta label="Provider" value={delivery.provider || '-'} palette={palette} />
                    <DeliveryMeta label="Sent At" value={formatDateTime(delivery.sentAt || delivery.createdAt)} palette={palette} />
                  </View>

                  {delivery.errorMessage ? <Text style={[styles.errorText, { color: palette.danger }]}>{delivery.errorMessage}</Text> : null}
                </View>
              );
            })}
          </View>
        )) : null}
      </SectionCard>
    </ScrollView>
  );
};

function SectionCard({
  title,
  subtitle,
  palette,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  palette: typeof lightPalette;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.sectionSubtitle, { color: palette.subText }]}>{subtitle}</Text> : null}
        </View>
        <View style={styles.sectionHeaderActions}>
          <View style={[styles.sectionBadge, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
            <FontAwesome6 name="megaphone" size={14} color={palette.subText} />
          </View>
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color={palette.subText} />
        </View>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

function SectionLabel({ title, palette }: { title: string; palette: typeof lightPalette; }) {
  return <Text style={[styles.sectionLabel, { color: palette.text }]}>{title}</Text>;
}

function EmptyState({ text, palette }: { text: string; palette: typeof lightPalette; }) {
  return (
    <View style={[styles.emptyState, { backgroundColor: palette.cardSoft, borderColor: palette.border }]}>
      <Text style={[styles.emptyStateText, { color: palette.subText }]}>{text}</Text>
    </View>
  );
}

function StatCard({ label, value, palette, accent }: { label: string; value: number; palette: typeof lightPalette; accent?: 'success' | 'danger' | 'warn'; }) {
  const accentColor = accent === 'success' ? palette.success : accent === 'danger' ? palette.danger : accent === 'warn' ? palette.warn : palette.primary;
  const accentBg = accent === 'success' ? palette.successSoft : accent === 'danger' ? palette.dangerSoft : accent === 'warn' ? palette.warnSoft : palette.primarySoft;
  return (
    <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.statLabel, { color: palette.subText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
      <View style={[styles.statAccent, { backgroundColor: accentBg }]} />
    </View>
  );
}

function SummaryBox({ label, value, palette, accent }: { label: string; value: number; palette: typeof lightPalette; accent?: 'success' | 'danger' | 'warn'; }) {
  const accentColor = accent === 'success' ? palette.success : accent === 'danger' ? palette.danger : accent === 'warn' ? palette.warn : palette.text;
  return (
    <View style={[styles.summaryBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.summaryBoxLabel, { color: palette.subText }]}>{label}</Text>
      <Text style={[styles.summaryBoxValue, { color: accentColor }]}>{value}</Text>
    </View>
  );
}

function RecipientGroup({
  title,
  items,
  selectedIds,
  onToggle,
  palette,
}: {
  title: string;
  items: PersonOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  palette: typeof lightPalette;
}) {
  return (
    <View style={styles.recipientGroup}>
      <Text style={[styles.recipientGroupTitle, { color: palette.text }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.helperText, { color: palette.subText }]}>No records found.</Text>
      ) : (
        <View style={styles.inlineChipRow}>
          {items.map((item) => {
            const active = selectedIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggle(item.id)}
                style={({ pressed }) => [
                  styles.personChip,
                  {
                    backgroundColor: active ? palette.primarySoft : palette.cardSoft,
                    borderColor: active ? palette.primary : palette.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.personTitle, { color: active ? palette.primary : palette.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
                {item.meta ? <Text style={[styles.personMeta, { color: palette.subText }]} numberOfLines={1}>{item.meta}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function DeliveryMeta({ label, value, palette }: { label: string; value: string; palette: typeof lightPalette; }) {
  return (
    <View style={styles.deliveryMetaBox}>
      <Text style={[styles.deliveryMetaLabel, { color: palette.subText }]}>{label}</Text>
      <Text style={[styles.deliveryMetaValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 14, paddingBottom: 36, gap: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 18 },
  iconButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: { borderRadius: 16, padding: 12 },
  bannerText: { fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47.5%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    overflow: 'hidden',
  },
  statLabel: { fontSize: 12, fontWeight: '700' },
  statValue: { marginTop: 12, fontSize: 28, fontWeight: '800' },
  statAccent: { position: 'absolute', right: -18, bottom: -18, width: 48, height: 48, borderRadius: 24, opacity: 0.7 },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  sectionBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  fieldGap: { gap: 8 },
  chipWrap: { gap: 8 },
  channelCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelIcon: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTextWrap: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '800' },
  optionMeta: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inlineChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillText: { fontSize: 12, fontWeight: '800' },
  helperText: { fontSize: 12, lineHeight: 16 },
  recipientGroup: { gap: 8, marginTop: 8 },
  recipientGroupTitle: { fontSize: 13, fontWeight: '800' },
  personChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '48%',
    flexGrow: 1,
    gap: 2,
  },
  personTitle: { fontSize: 13, fontWeight: '800' },
  personMeta: { fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  actionButton: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    flexGrow: 1,
  },
  secondaryButton: { borderWidth: 1 },
  primaryButton: {},
  actionText: { fontSize: 13, fontWeight: '800' },
  actionTextPrimary: { color: '#fff', fontSize: 13, fontWeight: '800' },
  previewWrap: { gap: 14 },
  previewCount: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  previewCountLabel: { fontSize: 13, fontWeight: '800' },
  previewCountValue: { marginTop: 6, fontSize: 30, fontWeight: '900' },
  previewList: { gap: 10 },
  previewItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  previewItemTitle: { fontSize: 14, fontWeight: '800' },
  previewItemMeta: { fontSize: 12 },
  historyList: { gap: 12 },
  historyItem: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  historyTopRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  historyBody: { flex: 1, gap: 4 },
  historyTitle: { fontSize: 15, fontWeight: '800' },
  historyMessage: { fontSize: 13, lineHeight: 18 },
  historyMeta: { fontSize: 11.5, lineHeight: 16 },
  statusPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryBox: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  summaryBoxLabel: { fontSize: 11, fontWeight: '700' },
  summaryBoxValue: { fontSize: 18, fontWeight: '900' },
  viewButton: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  viewButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyStateText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  deliveryList: { gap: 12 },
  deliveryHeader: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  deliveryHeaderTitle: { fontSize: 14, fontWeight: '800' },
  deliveryHeaderMeta: { fontSize: 12 },
  deliveryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  deliveryCardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  deliveryName: { fontSize: 14, fontWeight: '800' },
  deliveryMeta: { marginTop: 3, fontSize: 12 },
  deliveryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deliveryMetaBox: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  deliveryMetaLabel: { fontSize: 11, fontWeight: '700' },
  deliveryMetaValue: { fontSize: 12, fontWeight: '700' },
  errorText: { fontSize: 12, fontWeight: '700' },
});

export default BroadcastTabScreen;
