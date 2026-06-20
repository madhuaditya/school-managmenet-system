// import React, { useCallback, useMemo, useRef, useState } from 'react';
// import { FlatList, View, StyleSheet, Dimensions, Pressable } from 'react-native';
// import AttendanceRow from '@/components/AttendanceRow';
// import { ThemedText } from '@/components/themed-text';

// type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not-marked';

// interface Props {
//   roster: any[];
//   role?: string;
//   updateStatus: (row: any, status: Exclude<AttendanceStatus, 'not-marked'>) => void;
//   loading?: boolean;
//   mode?: 'list' | 'card';
//   onSubmitBulk?: () => void;
//   submitting?: boolean;
// }

// type CardItem =
//   | { _key: string; type: 'summary-start' | 'summary-end' }
//   | ({ type: 'student' } & Record<string, any>);

// function getStatusCounts(roster: any[]) {
//   return roster.reduce(
//     (acc, item) => {
//       const status = item.currentStatus || 'not-marked';
//       if (status === 'present') acc.present += 1;
//       else if (status === 'absent') acc.absent += 1;
//       else if (status === 'leave') acc.leave += 1;
//       else acc.notMarked += 1;
//       return acc;
//     },
//     { present: 0, absent: 0, leave: 0, notMarked: 0 },
//   );
// }

// function SummaryCard({
//   role,
//   total,
//   counts,
//   pendingCount,
//   onSubmitBulk,
//   submitting,
//   title,
// }: {
//   role?: string;
//   total: number;
//   counts: ReturnType<typeof getStatusCounts>;
//   pendingCount: number;
//   onSubmitBulk?: () => void;
//   submitting?: boolean;
//   title: string;
// }) {
//   return (
//     <View style={styles.summaryCard}>
//       <ThemedText type="subtitle" style={styles.summaryTitle}>{title}</ThemedText>
//       <ThemedText style={styles.summaryText}>Total {role || 'students'}: {total}</ThemedText>
//       <View style={styles.summaryGrid}>
//         <SummaryStat label="Present" value={counts.present} tone="present" />
//         <SummaryStat label="Absent" value={counts.absent} tone="absent" />
//         <SummaryStat label="Leave" value={counts.leave} tone="leave" />
//         <SummaryStat label="Not marked" value={counts.notMarked} tone="neutral" />
//       </View>
//       <ThemedText style={styles.summaryText}>Marked: {total - counts.notMarked} · Pending: {pendingCount}</ThemedText>
//       {onSubmitBulk ? (
//         <Pressable
//           onPress={onSubmitBulk}
//           disabled={submitting || pendingCount === 0}
//           style={({ pressed }) => [
//             styles.submitButton,
//             (submitting || pendingCount === 0) && styles.submitButtonDisabled,
//             pressed && styles.submitButtonPressed,
//           ]}>
//           <ThemedText style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Bulk Attendance'}</ThemedText>
//         </Pressable>
//       ) : null}
//     </View>
//   );
// }

// function SummaryStat({ label, value, tone }: { label: string; value: number; tone: 'present' | 'absent' | 'leave' | 'neutral' }) {
//   return (
//     <View style={[styles.summaryStat, tone === 'present' ? styles.presentStat : tone === 'absent' ? styles.absentStat : tone === 'leave' ? styles.leaveStat : styles.neutralStat]}>
//       <ThemedText style={styles.summaryStatValue}>{value}</ThemedText>
//       <ThemedText style={styles.summaryStatLabel}>{label}</ThemedText>
//     </View>
//   );
// }

// export default function AttendanceRoster({role='Student', roster, updateStatus, mode = 'list', onSubmitBulk, submitting }: Props) {
//   const listRef = useRef<FlatList<CardItem | any>>(null);
//   const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
//     if (!viewableItems || viewableItems.length === 0) return;
//     const first = viewableItems[0];
//     const idx = typeof first.index === 'number' ? first.index : 0;
//     setCurrentIndex(idx);
//   });
//   const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
//   const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
//   const cardHeight = Math.max(360, Math.min(screenHeight - 140, 500));
//   const horizontalMargin = 12;
//   const cardWidth = Math.max(360, Math.min(screenWidth - 32, 980));
//   const itemWidth = cardWidth + horizontalMargin * 2;
//   const counts = useMemo(() => getStatusCounts(roster), [roster]);
//   const pendingCount = counts.notMarked;

//   const keyExtractor = useCallback((item: any) => item._key, []);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const lastSideTapRef = useRef<{ time: number; dir: 'left' | 'right' | null }>({ time: 0, dir: null });

  

//   const cardData = useMemo<CardItem[]>(() => {
//     if (mode !== 'card') return [];
//     return [
//       { _key: 'summary-start', type: 'summary-start' },
//       ...roster.map((item) => ({ ...item, type: 'student' as const })),
//       { _key: 'summary-end', type: 'summary-end' },
//     ];
//   }, [mode, roster]);

//   const scrollToIndex = useCallback((index: number) => {
//     if (!listRef.current) return;
//     const currentData = mode === 'card' ? cardData : roster;
//     if (!currentData || currentData.length === 0) return;
//     const maxIndex = Math.max(0, currentData.length - 1);
//     const safeIndex = Math.min(Math.max(0, index), maxIndex);
//     requestAnimationFrame(() => {
//       try {
//         listRef.current?.scrollToIndex({ index: safeIndex, animated: true });
//       } catch (err) {
//         const offset = safeIndex * cardHeight;
//         listRef.current?.scrollToOffset({ offset, animated: true });
//       }
//     });
//   }, [cardData, cardHeight, mode, roster]);

//   const scrollToPosition = useCallback((position: 'top' | 'bottom') => {
//     const currentData = mode === 'card' ? cardData : roster;
//     if (currentData.length === 0) return;

//     if (position === 'top') {
//       if (mode === 'card') {
//         scrollToIndex(0);
//       } else {
//         listRef.current?.scrollToOffset({ offset: 0, animated: true });
//       }
//       return;
//     }

//     if (mode === 'card') {
//       const targetIndex = currentData.length - 1;
//       requestAnimationFrame(() => {
//         listRef.current?.scrollToIndex({ index: targetIndex, animated: true });
//       });
//       return;
//     }

//     listRef.current?.scrollToEnd({ animated: true });
//   }, [cardData, mode, roster, scrollToIndex]);

//   const renderCardItem = useCallback(({ item, index }: { item: CardItem; index: number }) => {
//     if (item.type === 'summary-start' || item.type === 'summary-end') {
//       return (
//         <View style={[styles.cardPage, { height: cardHeight, width: cardWidth, marginHorizontal: horizontalMargin }]}>
//           <SummaryCard
//           role={role}
//             title={item.type === 'summary-start' ? 'Attendance summary' : 'Review and submit'}
//             total={roster.length}
//             counts={counts}
//             pendingCount={pendingCount}
//             onSubmitBulk={onSubmitBulk}
//             submitting={submitting}
//           />
//         </View>
//       );
//     }

//     const studentItem = item as any;

//     return (
//       <View style={[styles.cardPage,  { height: cardHeight, width: cardWidth, marginHorizontal: horizontalMargin }]} pointerEvents={submitting ? 'none' : 'auto'}>
//         <AttendanceRow
//           item={studentItem}
//           variant="fullscreen"
//           onUpdate={updateStatus}
//           onMoveNext={() => scrollToIndex(index + 1)}
//           onMovePrev={() => scrollToIndex(index - 1)}
//         />
//       </View>
//     );
//   }, [cardHeight, counts, onSubmitBulk, pendingCount, roster.length, scrollToIndex, submitting, updateStatus]);

//   const renderItem = useCallback(({ item }: { item: any }) => <AttendanceRow item={item} onUpdate={updateStatus} variant="compact" />, [updateStatus]);

//   return (
//     <View style={styles.container}>
//    {mode === 'card' && (
//         <>
//           <Pressable
//             onPress={() => {
//               const now = Date.now();
//               const last = lastSideTapRef.current;
//               if (last.dir === 'left' && now - last.time < 350) {
//                 scrollToIndex(0);
//                 lastSideTapRef.current = { time: 0, dir: null };
//                 return;
//               }
//               lastSideTapRef.current = { time: now, dir: 'left' };
//               scrollToIndex(currentIndex - 1);
//             }}
//             style={({ pressed }) => [styles.quickNavSideButton, pressed && styles.quickNavPressed, styles.quickNavLeft]}
//           >
//             <ThemedText style={styles.quickNavText}>‹</ThemedText>
//           </Pressable>
//           <Pressable
//             onPress={() => {
//               const now = Date.now();
//               const last = lastSideTapRef.current;
//               if (last.dir === 'right' && now - last.time < 350) {
//                 const currentData = mode === 'card' ? cardData : roster;
//                 const target = currentData.length - 1;
//                 scrollToIndex(target);
//                 lastSideTapRef.current = { time: 0, dir: null };
//                 return;
//               }
//               lastSideTapRef.current = { time: now, dir: 'right' };
//               scrollToIndex(currentIndex + 1);
//             }}
//             style={({ pressed }) => [styles.quickNavSideButton, pressed && styles.quickNavPressed, styles.quickNavRight]}
//           >
//             <ThemedText style={styles.quickNavText}>›</ThemedText>
//           </Pressable>
//         </>
//       )}
//       {mode === 'card' ? (
//         <FlatList
//           key="card-mode"
//           ref={listRef}
//           horizontal
//           data={cardData}
//           keyExtractor={(item) => item._key}
//           renderItem={renderCardItem as any}
//           onViewableItemsChanged={onViewableItemsChangedRef.current}
//           viewabilityConfig={viewabilityConfigRef.current}
//           pagingEnabled
//           decelerationRate="fast"
//           snapToInterval={itemWidth}
//           snapToAlignment="center"
//           disableIntervalMomentum
//           showsHorizontalScrollIndicator={false}
//           bounces={false}
//           contentContainerStyle={{ paddingHorizontal: horizontalMargin }}
//           getItemLayout={(_, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
//           initialNumToRender={2}
//           windowSize={5}
//           removeClippedSubviews
//           maxToRenderPerBatch={4}
//           updateCellsBatchingPeriod={50}
//           onScrollToIndexFailed={(info) => {
//             const offset = (info.averageItemLength || itemWidth) * info.index;
//             listRef.current?.scrollToOffset({ offset, animated: true });
//           }}
//         />
//       ) : (
//         <FlatList
//           key="list-mode"
//           data={roster}
//           keyExtractor={keyExtractor}
//           renderItem={renderItem}
//           initialNumToRender={8}
//           windowSize={11}
//           removeClippedSubviews
//           maxToRenderPerBatch={10}
//           updateCellsBatchingPeriod={50}
//           ItemSeparatorComponent={() => <View style={styles.separator} />}
//           ListEmptyComponent={<ThemedText style={styles.empty}>No students found in this class.</ThemedText>}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   quickNavWrap: {
//     position: 'absolute',
//     left: 8,
//     top: '45%',
//     zIndex: 100,
//     gap: 8,
//   },
//   quickNavButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(255,255,255,0.24)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.34)',
//     shadowColor: '#000',
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 3,
//   },
//   quickNavPressed: {
//     opacity: 0.8,
//     transform: [{ scale: 0.98 }],
//   },
//   quickNavText: {
//     fontSize: 16,
//     fontWeight: '900',
//     color: '#111827',
//     lineHeight: 16,
//   },
//   quickNavLabel: {
//     fontSize: 8,
//     fontWeight: '800',
//     color: '#111827',
//     opacity: 0.85,
//   },
//   separator: { height: 10 },
//   empty: { textAlign: 'center', opacity: 0.72, paddingVertical: 8 },
//   cardPage: {
//     padding: 4,
//   },
//   summaryCard: {
//     flex: 1,
//     borderRadius: 28,
//     padding: 18,
//     backgroundColor: 'rgba(255,255,255,0.96)',
//     borderWidth: 1,
//     borderColor: 'rgba(148,163,184,0.25)',
//     gap: 14,
//   },
//   summaryTitle: {
//     textAlign: 'center',
//     color: '#000',
//   },
//   summaryText: {
//     textAlign: 'center',
//     opacity: 0.76,
//     fontSize: 13,
//     color: '#000',
//   },
//   summaryGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   summaryStat: {
//     width: '48%',
//     borderRadius: 18,
//     paddingVertical: 16,
//     paddingHorizontal: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     color: '#000',
//   },
//   presentStat: { backgroundColor: 'rgba(19, 236, 98, 0.1)' },
//   absentStat: { backgroundColor: 'rgba(226, 14, 14, 0.1)' },
//   leaveStat: { backgroundColor: 'rgba(217,119,6,0.10)' },
//   neutralStat: { backgroundColor: 'rgba(100,116,139,0.10)' },
//   summaryStatValue: { fontSize: 24, fontWeight: '900' ,color: '#000' },
//   summaryStatLabel: { fontSize: 12, opacity: 0.72, fontWeight: '700', marginTop: 4 ,color: '#000' },
//   submitButton: {
//     borderRadius: 16,
//     paddingVertical: 14,
//     alignItems: 'center',
//     backgroundColor: '#2563eb',
//     color: '#000',
//   },
//   submitButtonDisabled: {
//     opacity: 0.45,
//   },
//   submitButtonPressed: {
//     opacity: 0.88,
//   },
//   submitButtonText: {
//     fontWeight: '900',
//     color: '#000',
//   },
//   quickNavSideButton: {
//     position: 'absolute',
//     top: '50%',
//     transform: [{ translateY: -22 }],
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.06)',
//     elevation: 12,
//     zIndex: 999,
//     shadowColor: '#000',
//     shadowOpacity: 0.18,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   quickNavLeft: { left: 8 },
//   quickNavRight: { right: 8 },
// });

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, View, StyleSheet, Dimensions, Pressable, Text } from 'react-native';
import AttendanceRow from '@/components/AttendanceRow';

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not-marked';

// --- ERP BRANDING PALETTE ---
const PALETTE = {
  primary: '#303841',
  accent: '#76ABAE',
  cta: '#FF5722',
  background: '#F5F5F5',
  border: '#E6E6E6',
  surface: '#FFFFFF',
  textBody: '#5D646B',
  textHeading: '#303841',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F9A825',
};

interface Props {
  roster: any[];
  role?: string;
  updateStatus: (row: any, status: Exclude<AttendanceStatus, 'not-marked'>) => void;
  loading?: boolean;
  mode?: 'list' | 'card';
  onSubmitBulk?: () => void;
  submitting?: boolean;
}

type CardItem =
  | { _key: string; type: 'summary-start' | 'summary-end' }
  | ({ type: 'student' } & Record<string, any>);

function getStatusCounts(roster: any[]) {
  return roster.reduce(
    (acc, item) => {
      const status = item.currentStatus || 'not-marked';
      if (status === 'present') acc.present += 1;
      else if (status === 'absent') acc.absent += 1;
      else if (status === 'leave') acc.leave += 1;
      else acc.notMarked += 1;
      return acc;
    },
    { present: 0, absent: 0, leave: 0, notMarked: 0 },
  );
}

function SummaryCard({
  role,
  total,
  counts,
  pendingCount,
  onSubmitBulk,
  submitting,
  title,
}: {
  role?: string;
  total: number;
  counts: ReturnType<typeof getStatusCounts>;
  pendingCount: number;
  onSubmitBulk?: () => void;
  submitting?: boolean;
  title: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryText}>Total {role || 'students'}: {total}</Text>
      <View style={styles.summaryGrid}>
        <SummaryStat label="Present" value={counts.present} tone="present" />
        <SummaryStat label="Absent" value={counts.absent} tone="absent" />
        <SummaryStat label="Leave" value={counts.leave} tone="leave" />
        <SummaryStat label="Not Marked" value={counts.notMarked} tone="neutral" />
      </View>
      <Text style={styles.summaryText}>Marked: {total - counts.notMarked} · Pending: {pendingCount}</Text>
      {onSubmitBulk ? (
        <Pressable
          onPress={onSubmitBulk}
          disabled={submitting || pendingCount === 0}
          style={({ pressed }) => [
            styles.submitButton,
            (submitting || pendingCount === 0) && styles.submitButtonDisabled,
            pressed && styles.submitButtonPressed,
          ]}>
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Bulk Attendance'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: 'present' | 'absent' | 'leave' | 'neutral' }) {
  return (
    <View style={[styles.summaryStat, tone === 'present' ? styles.presentStat : tone === 'absent' ? styles.absentStat : tone === 'leave' ? styles.leaveStat : styles.neutralStat]}>
      <Text style={styles.summaryStatValue}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

export default function AttendanceRoster({role='Student', roster, updateStatus, mode = 'list', onSubmitBulk, submitting }: Props) {
  const listRef = useRef<FlatList<CardItem | any>>(null);
  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (!viewableItems || viewableItems.length === 0) return;
    const first = viewableItems[0];
    const idx = typeof first.index === 'number' ? first.index : 0;
    setCurrentIndex(idx);
  });
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  
  // --- LAYOUT MATH FOR PERFECT CENTERING AND WIDER CARDS ---
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const itemWidth = screenWidth; // FlatList snap interval takes the full screen
  const cardWidth = Math.min(screenWidth - 16, 1200); // 8px gap on each side, stretches to 1200 on tablets
  const cardHeight = Math.max(360, Math.min(screenHeight - 140, 500));
  
  const counts = useMemo(() => getStatusCounts(roster), [roster]);
  const pendingCount = counts.notMarked;

  const keyExtractor = useCallback((item: any) => item._key, []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastSideTapRef = useRef<{ time: number; dir: 'left' | 'right' | null }>({ time: 0, dir: null });

  const cardData = useMemo<CardItem[]>(() => {
    if (mode !== 'card') return [];
    return [
      { _key: 'summary-start', type: 'summary-start' },
      ...roster.map((item) => ({ ...item, type: 'student' as const })),
      { _key: 'summary-end', type: 'summary-end' },
    ];
  }, [mode, roster]);

  const scrollToIndex = useCallback((index: number) => {
    if (!listRef.current) return;
    const currentData = mode === 'card' ? cardData : roster;
    if (!currentData || currentData.length === 0) return;
    const maxIndex = Math.max(0, currentData.length - 1);
    const safeIndex = Math.min(Math.max(0, index), maxIndex);
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToIndex({ index: safeIndex, animated: true });
      } catch (err) {
        const offset = safeIndex * itemWidth;
        listRef.current?.scrollToOffset({ offset, animated: true });
      }
    });
  }, [cardData, itemWidth, mode, roster]);

  const scrollToPosition = useCallback((position: 'top' | 'bottom') => {
    const currentData = mode === 'card' ? cardData : roster;
    if (currentData.length === 0) return;

    if (position === 'top') {
      if (mode === 'card') {
        scrollToIndex(0);
      } else {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
      return;
    }

    if (mode === 'card') {
      const targetIndex = currentData.length - 1;
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: targetIndex, animated: true });
      });
      return;
    }

    listRef.current?.scrollToEnd({ animated: true });
  }, [cardData, mode, roster, scrollToIndex]);

  const renderCardItem = useCallback(({ item, index }: { item: CardItem; index: number }) => {
    if (item.type === 'summary-start' || item.type === 'summary-end') {
      return (
        <View style={[{ width: itemWidth }, styles.carouselItemWrapper]} pointerEvents={submitting ? 'none' : 'auto'}>
          <View style={{ height: cardHeight, width: cardWidth }}>
            <SummaryCard
              role={role}
              title={item.type === 'summary-start' ? 'Attendance Summary' : 'Review & Submit'}
              total={roster.length}
              counts={counts}
              pendingCount={pendingCount}
              onSubmitBulk={onSubmitBulk}
              submitting={submitting}
            />
          </View>
        </View>
      );
    }

    const studentItem = item as any;

    return (
      <View style={[{ width: itemWidth }, styles.carouselItemWrapper]} pointerEvents={submitting ? 'none' : 'auto'}>
        <View style={{ height: cardHeight, width: cardWidth }}>
          <AttendanceRow
          role={role}
            item={studentItem}
            variant="fullscreen"
            onUpdate={updateStatus}
            onMoveNext={() => scrollToIndex(index + 1)}
            onMovePrev={() => scrollToIndex(index - 1)}
          />
        </View>
      </View>
    );
  }, [itemWidth, cardHeight, cardWidth, counts, onSubmitBulk, pendingCount, role, roster.length, scrollToIndex, submitting, updateStatus]);

  const renderItem = useCallback(({ item }: { item: any }) => <AttendanceRow role={role} item={item} onUpdate={updateStatus} variant="compact" />, [role, updateStatus]);

  return (
    <View style={styles.container}>
      {mode === 'card' && (
        <>
          <Pressable
            onPress={() => {
              const now = Date.now();
              const last = lastSideTapRef.current;
              if (last.dir === 'left' && now - last.time < 350) {
                scrollToIndex(0);
                lastSideTapRef.current = { time: 0, dir: null };
                return;
              }
              lastSideTapRef.current = { time: now, dir: 'left' };
              scrollToIndex(currentIndex - 1);
            }}
            style={({ pressed }) => [styles.quickNavSideButton, pressed && styles.quickNavPressed, styles.quickNavLeft]}
          >
            <Text style={styles.quickNavText}>‹</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const now = Date.now();
              const last = lastSideTapRef.current;
              if (last.dir === 'right' && now - last.time < 350) {
                const currentData = mode === 'card' ? cardData : roster;
                const target = currentData.length - 1;
                scrollToIndex(target);
                lastSideTapRef.current = { time: 0, dir: null };
                return;
              }
              lastSideTapRef.current = { time: now, dir: 'right' };
              scrollToIndex(currentIndex + 1);
            }}
            style={({ pressed }) => [styles.quickNavSideButton, pressed && styles.quickNavPressed, styles.quickNavRight]}
          >
            <Text style={styles.quickNavText}>›</Text>
          </Pressable>
        </>
      )}
      {mode === 'card' ? (
        <FlatList
          key="card-mode"
          ref={listRef}
          horizontal
          data={cardData}
          keyExtractor={(item) => item._key}
          renderItem={renderCardItem as any}
          onViewableItemsChanged={onViewableItemsChangedRef.current}
          viewabilityConfig={viewabilityConfigRef.current}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={itemWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
          initialNumToRender={2}
          windowSize={5}
          removeClippedSubviews
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={50}
          onScrollToIndexFailed={(info) => {
            const offset = (info.averageItemLength || itemWidth) * info.index;
            listRef.current?.scrollToOffset({ offset, animated: true });
          }}
        />
      ) : (
        <FlatList
          key="list-mode"
          data={roster}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          initialNumToRender={8}
          windowSize={11}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.empty}>No USER found in this class.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  
  /* CAROUSEL CENTERING */
  carouselItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* QUICK NAV BUTTONS */
  quickNavSideButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 4, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    elevation: 2,
    zIndex: 999,
  },
  quickNavLeft: { left: 8 },
  quickNavRight: { right: 8 },
  quickNavPressed: {
    opacity: 0.8,
  },
  quickNavText: {
    fontSize: 22,
    fontWeight: '600',
    color: PALETTE.primary,
    lineHeight: 22,
  },

  /* LIST STYLES */
  separator: { height: 10 },
  empty: { 
    textAlign: 'center', 
    color: PALETTE.textBody, 
    paddingVertical: 16 
  },

  /* SUMMARY CARD */
  summaryCard: {
    flex: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    justifyContent: 'center',
    gap: 12,
  },
  summaryTitle: {
    textAlign: 'center',
    color: PALETTE.textHeading,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryText: {
    textAlign: 'center',
    color: PALETTE.textBody,
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  summaryStat: {
    width: '48%',
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  presentStat: { backgroundColor: 'rgba(46, 125, 50, 0.05)', borderColor: 'rgba(46, 125, 50, 0.2)' },
  absentStat: { backgroundColor: 'rgba(211, 47, 47, 0.05)', borderColor: 'rgba(211, 47, 47, 0.2)' },
  leaveStat: { backgroundColor: 'rgba(249, 168, 37, 0.05)', borderColor: 'rgba(249, 168, 37, 0.2)' },
  neutralStat: { backgroundColor: PALETTE.background },
  summaryStatValue: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: PALETTE.textHeading 
  },
  summaryStatLabel: { 
    fontSize: 13, 
    color: PALETTE.textBody, 
    fontWeight: '600', 
    marginTop: 4 
  },

  /* SUBMIT BUTTON */
  submitButton: {
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: PALETTE.cta,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: PALETTE.border,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    color: PALETTE.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});