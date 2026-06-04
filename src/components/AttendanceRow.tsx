import React, { useMemo } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
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

function Row({ item, onUpdate, variant = 'compact', onMoveNext, onMovePrev }: Props) {

    const router = useRouter();
  // console.log('Rendering row for', item, 'with status', item.currentStatus);
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
        const horizontal = Math.abs(gestureState.dx);
        const vertical = Math.abs(gestureState.dy);
        return Math.max(horizontal, vertical) > 14;
      },
      onPanResponderRelease: (_, gestureState) => {
        const horizontal = gestureState.dx;
        const vertical = gestureState.dy;

        if (Math.abs(vertical) > Math.abs(horizontal)) {
          if (vertical < -50) {
            onMoveNext?.();
          } else if (vertical > 50) {
            onMovePrev?.();
          }
          return;
        }

        if (horizontal < -50) {
          onUpdate(item, 'present');
          onMoveNext?.();
        } else if (horizontal > 50) {
          onUpdate(item, 'absent');
          onMoveNext?.();
        }
      },
    });
  }, [item, onMoveNext, onUpdate, variant]);

  if (variant === 'fullscreen') {
    return (
      <View
        style={[styles.fullscreenCard, rowTint, isSelected ? styles.rosterRowSelected : null]}
        {...(panResponder ? panResponder.panHandlers : {})}>
        <View style={styles.fullscreenHeader}>
          <View style={styles.avatarShell}>
            {item.image ? (
              <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, styles.avatarFallback]}>
                <ThemedText style={styles.avatarFallbackText}>{getInitials(item.name)}</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.fullscreenMeta}>
            <ThemedText type="title" style={styles.studentName}>{item.name}</ThemedText>
            <ThemedText style={styles.studentMeta}>{item.email || 'N/A'}</ThemedText>
          </View>

          <View style={[styles.statusPill, renderStatusBadge(item.currentStatus)]}>
            <ThemedText style={styles.statusPillText}>{renderStatusLabel(item.currentStatus)}</ThemedText>
          </View>
           <Pressable
           style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#2563eb', borderRadius: 8 }}
                    // style={[styles.actionButton, { backgroundColor: theme.tint }]}
                    onPress={() => {
                      if (item._id) {
                        router.push({
                          pathname: '/attdence-detail/[id]',
                          params: { id: String(item._id) },
                        });
                      }
                    }}
                  >
                    <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>View Monthly Attendance</ThemedText>
                  </Pressable>
        </View>

        <View style={styles.fullscreenHintCard}>
          <View style={styles.hintHeaderRow}>
            <ThemedText style={styles.hintTitle}>Swipe to mark attendance</ThemedText>
            <ThemedText style={styles.hintSideLabel}>Left / Right</ThemedText>
          </View>

          <View style={styles.sliderTrackWrap}>
            <ThemedText style={styles.sliderHintText}>Present</ThemedText>
            <View style={styles.sliderTrack}>
              <View style={styles.sliderTrackFill} />
              <View style={styles.sliderThumb}>
                <View style={styles.sliderThumbInner} />
              </View>
            </View>
            <ThemedText style={styles.sliderHintText}>Absent</ThemedText>
          </View>

          <ThemedText style={styles.hintText}>Swipe left to mark present and go next. Swipe right to mark absent and go next.</ThemedText>
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
            <ThemedText style={styles.navGhostText}>Prev</ThemedText>
          </Pressable>
          <Pressable onPress={onMoveNext} style={({ pressed }) => [styles.navGhostButton, pressed && styles.chipPressed]}>
            <ThemedText style={styles.navGhostText}>Next</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.rosterRow, rowTint, isSelected ? styles.rosterRowSelected : null]}>
      <View style={styles.rowHeader}>
        {item.image ? (
          <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText style={styles.avatarFallbackText}>{getInitials(item.name)}</ThemedText>
          </View>
        )}
        <View style={styles.rowMeta}>
          <ThemedText type="defaultSemiBold" style={styles.studentName}>{item.name}</ThemedText>
          <ThemedText style={styles.studentMeta}>{item.email || 'N/A'}</ThemedText>
        </View>
        <View style={[styles.statusPill, renderStatusBadge(item.currentStatus)]}>
          <ThemedText style={styles.statusPillText}>{renderStatusLabel(item.currentStatus)}</ThemedText>
        </View>
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
    backgroundColor: 'rgba(219, 234, 254, 0.95)',
  },
  fullscreenCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(219, 234, 254, 0.95)',
    gap: 30,
    // justifyContent: 'space-between',
  },
  rosterRowSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
    backgroundColor: 'rgba(219, 234, 254, 0.96)'
  },
  rowHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fullscreenHeader: {
    gap: 6,
    alignItems: 'center',
    marginBottom: 6,
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
    flex: 1,
    minWidth: 0,
  },
  fullscreenMeta: {
    alignItems: 'center',
    gap: 0,
    width: '100%',
  },
  studentName: {
    fontSize: 15,
    color: '#000',
  },
  studentMeta: {
    fontSize: 12,
    opacity: 0.72,
    marginTop: 1,
    color: '#000',
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
  badgePresent: { backgroundColor: 'rgba(34,197,94,0.14)' },
  badgeAbsent: { backgroundColor: 'rgba(239,68,68,0.14)' },
  badgeLeave: { backgroundColor: 'rgba(245,158,11,0.14)' },
  badgeNeutral: { backgroundColor: 'rgba(107,114,128,0.14)' },
  rowParentInfo: { marginTop: 6, gap: 1 },
  parentText: { fontSize: 12, opacity: 0.78, color: '#000' },
  rowActions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  rowActionsFull: { flexDirection: 'row', gap: 8 },
  actionChip: { flex: 1, borderRadius: 12, minHeight: 38, justifyContent: 'center', alignItems: 'center' },
  presentChip: { backgroundColor: '#16a34a' },
  absentChip: { backgroundColor: '#dc2626' },
  leaveChip: { backgroundColor: '#d97706' },
  actionChipText: { color: '#000', fontWeight: '800', fontSize: 12 },
  chipPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  fullscreenHintCard: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15,23,42,0.05)',
    gap: 8,
    marginTop: 2,
  },
  hintHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  hintSideLabel: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#000',
  },
  sliderTrackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderHintText: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.75,
    minWidth: 44,
    textAlign: 'center',
    color: '#000',
  },
  sliderTrack: {
    flex: 1,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.22)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sliderTrackFill: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '50%',
    marginLeft: '-25%',
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  sliderThumb: {
    position: 'absolute',
    left: '50%',
    top: 2,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sliderThumbInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  hintText: {
    fontSize: 11,
    opacity: 0.72,
    lineHeight: 16,
    textAlign: 'center',
    color: '#000',
  },
  fullscreenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  navGhostButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  navGhostText: {
    fontWeight: '800',
    color: '#000',
  },
});
