import React, { useMemo } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not-marked';

interface ItemProps {
  _key: string;
  _id?: string;
  userId?: string;
  name: string;
  image?: string | null;
  rollNumber?: string | number;
  studentIdCode?: string;
  email?: string;
  fatherName?: string | null;
  motherName?: string | null;
  currentStatus: AttendanceStatus;
}

interface Props {
  item: ItemProps;
  onUpdate: (item: ItemProps, status: Exclude<AttendanceStatus, 'not-marked'>) => void;
  variant?: 'compact' | 'fullscreen';
  onMoveNext?: () => void;
  onMovePrev?: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
}

function renderStatusBadge(status: AttendanceStatus, isDark: boolean) {
  if (status === 'present') return styles.badgePresent;
  if (status === 'absent') return styles.badgeAbsent;
  if (status === 'leave') return styles.badgeLeave;
  return isDark ? styles.badgeNeutralDark : styles.badgeNeutral;
}

function renderStatusPillText(status: AttendanceStatus) {
  if (status === 'present') return styles.statusPillTextPresent;
  if (status === 'absent') return styles.statusPillTextAbsent;
  if (status === 'leave') return styles.statusPillTextLeave;
  return styles.statusPillTextNeutral;
}

function renderStatusLabel(status: AttendanceStatus) {
  if (status === 'not-marked') return 'Not Marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function Row({ item, onUpdate, variant = 'compact', onMoveNext, onMovePrev }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isSelected = item.currentStatus !== 'not-marked';
  const rowTint = item.currentStatus === 'present'
    ? styles.rowPresent
    : item.currentStatus === 'absent'
      ? styles.rowAbsent
      : item.currentStatus === 'leave'
        ? styles.rowLeave
        : styles.rowNeutral;

  const panResponder = useMemo(() => {
    if (variant !== 'fullscreen') return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const vertical = Math.abs(gestureState.dy);
        const horizontal = Math.abs(gestureState.dx);
        return vertical > 14 && vertical > horizontal;
      },
      onPanResponderRelease: (_, gestureState) => {
        const vertical = gestureState.dy;
        if (vertical < -50) {
          onUpdate(item, 'present');
          onMoveNext?.();
        } else if (vertical > 50) {
          onUpdate(item, 'absent');
          onMoveNext?.();
        }
      },
    });
  }, [item, onMoveNext, onUpdate, variant]);

  const palette = useMemo(() => ({
    card: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(239, 246, 255, 0.96)',
    hintBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
    ghostText: isDark ? '#93c5fd' : '#2563eb',
    avatarBg: isDark ? '#334155' : '#e5e7eb',
  }), [isDark]);

  if (variant === 'fullscreen') {
    return (
      <View
        style={[
          styles.fullscreenCard,
          { backgroundColor: palette.card },
          rowTint,
          isSelected ? styles.rosterRowSelected : null,
        ]}
        {...(panResponder ? panResponder.panHandlers : {})}>
        <View style={styles.fullscreenHeader}>
          <View style={styles.avatarShell}>
            {item.image ? (
              <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, styles.avatarFallback, { backgroundColor: palette.avatarBg }]}>
                <ThemedText style={styles.avatarFallbackText}>{getInitials(item.name)}</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.fullscreenMeta}>
            <ThemedText type="title" style={styles.studentName}>{item.name}</ThemedText>
            <ThemedText style={[styles.studentMeta, isDark && styles.studentMetaDark]}>Roll {item.rollNumber || 'N/A'} · {item.studentIdCode || 'No ID'}</ThemedText>
            <ThemedText style={[styles.studentMeta, isDark && styles.studentMetaDark]}>{item.email || 'N/A'}</ThemedText>
            <ThemedText style={[styles.studentMeta, isDark && styles.studentMetaDark]}>{item.fatherName ? `Father: ${item.fatherName}` : 'Father: N/A'}</ThemedText>
            <ThemedText style={[styles.studentMeta, isDark && styles.studentMetaDark]}>{item.motherName ? `Mother: ${item.motherName}` : 'Mother: N/A'}</ThemedText>
          </View>

          <View style={[styles.statusPill, renderStatusBadge(item.currentStatus, isDark)]}>
            <ThemedText style={[styles.statusPillText, renderStatusPillText(item.currentStatus)]}>{renderStatusLabel(item.currentStatus)}</ThemedText>
          </View>
        </View>

        <View style={[styles.fullscreenHintCard, { backgroundColor: palette.hintBg }]}>
          <ThemedText style={styles.hintText}>Swipe up to mark present and go next. Swipe down to mark absent and go next.</ThemedText>
        </View>

        <View style={styles.rowActionsFull}>
          <Pressable onPress={() => onUpdate(item, 'present')} style={({ pressed }) => [styles.actionChip, styles.presentChip, pressed && styles.chipPressed]}>
            <ThemedText style={styles.actionChipText}>Present</ThemedText>
          </Pressable>
          <Pressable onPress={() => onUpdate(item, 'absent')} style={({ pressed }) => [styles.actionChip, styles.absentChip, pressed && styles.chipPressed]}>
            <ThemedText style={styles.actionChipText}>Absent</ThemedText>
          </Pressable>
          <Pressable onPress={() => onUpdate(item, 'leave')} style={({ pressed }) => [styles.actionChip, styles.leaveChip, pressed && styles.chipPressed]}>
            <ThemedText style={styles.actionChipText}>Leave</ThemedText>
          </Pressable>
        </View>

        <View style={styles.fullscreenFooter}>
          <Pressable onPress={onMovePrev} style={({ pressed }) => [styles.navGhostButton, pressed && styles.chipPressed]}>
            <ThemedText style={[styles.navGhostText, { color: palette.ghostText }]}>Prev</ThemedText>
          </Pressable>
          <Pressable onPress={onMoveNext} style={({ pressed }) => [styles.navGhostButton, pressed && styles.chipPressed]}>
            <ThemedText style={[styles.navGhostText, { color: palette.ghostText }]}>Next</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.rosterRow, { backgroundColor: palette.card }, rowTint, isSelected ? styles.rosterRowSelected : null]}>
      <View style={styles.rowHeader}>
        {item.image ? (
          <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: palette.avatarBg }]}>
            <ThemedText style={styles.avatarFallbackText}>{getInitials(item.name)}</ThemedText>
          </View>
        )}
        <View style={styles.rowMeta}>
          <ThemedText type="defaultSemiBold" style={styles.studentName}>{item.name}</ThemedText>
          <ThemedText style={[styles.studentMeta, isDark && styles.studentMetaDark]}>Roll {item.rollNumber || 'N/A'} · {item.studentIdCode || 'No ID'}</ThemedText>
          <ThemedText style={[styles.studentMeta, isDark && styles.studentMetaDark]}>{item.email || 'N/A'}</ThemedText>
        </View>
        <View style={[styles.statusPill, renderStatusBadge(item.currentStatus, isDark)]}>
          <ThemedText style={[styles.statusPillText, renderStatusPillText(item.currentStatus)]}>{renderStatusLabel(item.currentStatus)}</ThemedText>
        </View>
      </View>

      <View style={styles.rowParentInfo}>
        <ThemedText style={[styles.parentText, isDark && styles.parentTextDark]}>Father: {item.fatherName || 'N/A'}</ThemedText>
        <ThemedText style={[styles.parentText, isDark && styles.parentTextDark]}>Mother: {item.motherName || 'N/A'}</ThemedText>
      </View>

      <View style={styles.rowActions}>
        <Pressable onPress={() => onUpdate(item, 'present')} style={({ pressed }) => [styles.actionChip, styles.presentChip, pressed && styles.chipPressed]}>
          <ThemedText style={styles.actionChipText}>Present</ThemedText>
        </Pressable>
        <Pressable onPress={() => onUpdate(item, 'absent')} style={({ pressed }) => [styles.actionChip, styles.absentChip, pressed && styles.chipPressed]}>
          <ThemedText style={styles.actionChipText}>Absent</ThemedText>
        </Pressable>
        <Pressable onPress={() => onUpdate(item, 'leave')} style={({ pressed }) => [styles.actionChip, styles.leaveChip, pressed && styles.chipPressed]}>
          <ThemedText style={styles.actionChipText}>Leave</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(Row, (prev, next) => prev.item._key === next.item._key && prev.item.currentStatus === next.item.currentStatus && prev.variant === next.variant);

const styles = StyleSheet.create({
  rosterRow: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  fullscreenCard: {
    flex: 1,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    gap: 14,
  },
  rosterRowSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rowPresent: {
    borderColor: 'rgba(34, 197, 94, 0.28)',
    backgroundColor: 'rgba(220, 252, 231, 0.96)',
  },
  rowAbsent: {
    borderColor: 'rgba(239, 68, 68, 0.28)',
    backgroundColor: 'rgba(254, 226, 226, 0.96)',
  },
  rowLeave: {
    borderColor: 'rgba(245, 158, 11, 0.28)',
    backgroundColor: 'rgba(255, 237, 213, 0.96)',
  },
  rowNeutral: {
    borderColor: 'rgba(96, 165, 250, 0.28)',
    backgroundColor: 'rgba(219, 234, 254, 0.96)',
  },
  rowHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fullscreenHeader: {
    gap: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e5e7eb',
  },
  avatarShell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#e5e7eb',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  rowMeta: {
    flex: 1
  },
  fullscreenMeta: {
    alignItems: 'center',
    gap: 1,
    width: '100%',
  },
  studentName: {
    fontSize: 15,
    color: '#000',
  },
  studentMeta: {
    fontSize: 12,
    opacity: 0.72,
    marginTop: 2,
    color: '#000',
  },
  studentMetaDark: {
    opacity: 0.95,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  statusPillTextPresent: { color: '#000' },
  statusPillTextAbsent: { color: '#000' },
  statusPillTextLeave: { color: '#000' },
  statusPillTextNeutral: { color: '#000' },
  badgePresent: { backgroundColor: '#166534' },
  badgeAbsent: { backgroundColor: '#991b1b' },
  badgeLeave: { backgroundColor: '#92400e' },
  badgeNeutral: { backgroundColor: '#1e3a8a' },
  badgeNeutralDark: { backgroundColor: '#334155' },
  rowParentInfo: { marginTop: 10, gap: 2 },
  parentText: { fontSize: 12, opacity: 0.78, color: '#000' },
  parentTextDark: { opacity: 0.95 },
  rowActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  rowActionsFull: { flexDirection: 'row', gap: 10 },
  actionChip: { flex: 1, borderRadius: 12, minHeight: 40, justifyContent: 'center', alignItems: 'center' },
  presentChip: { backgroundColor: '#16a34a' },
  absentChip: { backgroundColor: '#dc2626' },
  leaveChip: { backgroundColor: '#d97706' },
  actionChipText: { color: '#000', fontWeight: '800', fontSize: 12 },
  chipPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  fullscreenHintCard: {
    borderRadius: 16,
    padding: 10,
    gap: 3,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  hintText: {
    fontSize: 11,
    opacity: 0.72,
    lineHeight: 16,
    color: '#000',
  },
  fullscreenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navGhostButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  navGhostText: {
    fontWeight: '800',
    color: '#000',
  },
});
