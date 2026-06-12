import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
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
}

function renderStatusBadge(status: AttendanceStatus) {
  if (status === 'present') return styles.badgePresent;
  if (status === 'absent') return styles.badgeAbsent;
  if (status === 'leave') return styles.badgeLeave;
  return styles.badgeNeutral;
}

function renderStatusLabel(status: AttendanceStatus) {
  if (status === 'not-marked') return 'Not Marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function Row({ item, onUpdate }: Props) {
  const isSelected = item.currentStatus !== 'not-marked';
  const rowTint = item.currentStatus === 'present'
    ? styles.rowPresent
    : item.currentStatus === 'absent'
      ? styles.rowAbsent
      : item.currentStatus === 'leave'
        ? styles.rowLeave
        : styles.rowNeutral;

  return (
    <View style={[styles.rosterRow, rowTint, isSelected ? styles.rosterRowSelected : null]}>
      <View style={styles.rowHeader}>
        <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatar} />
        <View style={styles.rowMeta}>
          <ThemedText type="defaultSemiBold" style={styles.studentName}>{item.name}</ThemedText>
          <ThemedText style={styles.studentMeta}>Roll {item.rollNumber || 'N/A'} · {item.studentIdCode || 'No ID'}</ThemedText>
          <ThemedText style={styles.studentMeta}>{item.email || 'N/A'}</ThemedText>
        </View>
        <View style={[styles.statusPill, renderStatusBadge(item.currentStatus)]}>
          <ThemedText style={styles.statusPillText}>{renderStatusLabel(item.currentStatus)}</ThemedText>
        </View>
      </View>

      <View style={styles.rowParentInfo}>
        <ThemedText style={styles.parentText}>Father: {item.fatherName || 'N/A'}</ThemedText>
        <ThemedText style={styles.parentText}>Mother: {item.motherName || 'N/A'}</ThemedText>
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

export default React.memo(Row, (prev, next) => prev.item._key === next.item._key && prev.item.currentStatus === next.item.currentStatus);

const styles = StyleSheet.create({
  rosterRow: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  rosterRowSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowPresent: {
    borderColor: 'rgba(34,197,94,0.24)',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  rowAbsent: {
    borderColor: 'rgba(239,68,68,0.24)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  rowLeave: {
    borderColor: 'rgba(245,158,11,0.24)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  rowNeutral: {
    borderColor: 'rgba(107,114,128,0.18)',
    backgroundColor: 'rgba(255,255,255,0.98)'
  },
  rowHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e5e7eb',
  },
  rowMeta: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 15,
  },
  studentMeta: {
    fontSize: 12,
    opacity: 0.72,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgePresent: { backgroundColor: 'rgba(34,197,94,0.14)' },
  badgeAbsent: { backgroundColor: 'rgba(239,68,68,0.14)' },
  badgeLeave: { backgroundColor: 'rgba(245,158,11,0.14)' },
  badgeNeutral: { backgroundColor: 'rgba(107,114,128,0.14)' },
  rowParentInfo: { marginTop: 10, gap: 2 },
  parentText: { fontSize: 12, opacity: 0.78 },
  rowActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  actionChip: { flex: 1, borderRadius: 12, minHeight: 40, justifyContent: 'center', alignItems: 'center' },
  presentChip: { backgroundColor: '#16a34a' },
  absentChip: { backgroundColor: '#dc2626' },
  leaveChip: { backgroundColor: '#d97706' },
  actionChipText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chipPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
