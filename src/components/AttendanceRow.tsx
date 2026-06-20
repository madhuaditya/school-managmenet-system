// import React, { useMemo } from 'react';
// import { Image, PanResponder, Pressable, StyleSheet, View } from 'react-native';
// import { ThemedText } from '@/components/themed-text';
// import { useRouter } from 'expo-router';
// const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

// type AttendanceStatus = 'present' | 'absent' | 'leave' | 'not-marked';

// interface ItemProps {
//   _key: string;
//   _id?: string;
//   userId?: string;
//   name: string;
//   image?: string | null;
//   rollNumber?: string | number;
//   studentIdCode?: string;
//   email?: string;
//   fatherName?: string | null;
//   motherName?: string | null;
//   currentStatus: AttendanceStatus;
// }

// interface Props {
//   item: ItemProps;
//   onUpdate: (item: ItemProps, status: Exclude<AttendanceStatus, 'not-marked'>) => void;
//   variant?: 'compact' | 'fullscreen';
//   onMoveNext?: () => void;
//   onMovePrev?: () => void;
// }

// function getInitials(name: string) {
//   const parts = name.trim().split(/\s+/).filter(Boolean);
//   if (parts.length === 0) return '?';
//   return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
// }

// function renderStatusBadge(status: AttendanceStatus) {
//   if (status === 'present') return styles.badgePresent;
//   if (status === 'absent') return styles.badgeAbsent;
//   if (status === 'leave') return styles.badgeLeave;
//   return styles.badgeNeutral;
// }

// function renderStatusLabel(status: AttendanceStatus) {
//   if (status === 'not-marked') return 'Not Marked';
//   return status.charAt(0).toUpperCase() + status.slice(1);
// }

// function Row({ item, onUpdate, variant = 'compact', onMoveNext, onMovePrev }: Props) {

//     const router = useRouter();
//   // console.log('Rendering row for', item, 'with status', item.currentStatus);
//   const isSelected = item.currentStatus !== 'not-marked';
//   const rowTint = item.currentStatus === 'present'
//     ? styles.rowPresent
//     : item.currentStatus === 'absent'
//       ? styles.rowAbsent
//       : item.currentStatus === 'leave'
//         ? styles.rowLeave
//         : styles.rowNeutral;

//   const panResponder = useMemo(() => {
//     if (variant !== 'fullscreen') return null;

//     return PanResponder.create({
//       onStartShouldSetPanResponder: () => false,
//       onMoveShouldSetPanResponder: (_, gestureState) => {
//         const vertical = Math.abs(gestureState.dy);
//         const horizontal = Math.abs(gestureState.dx);
//         return vertical > 14 && vertical > horizontal;
//       },
//       onPanResponderRelease: (_, gestureState) => {
//         const vertical = gestureState.dy;
//         if (vertical < -50) {
//           onUpdate(item, 'present');
//           onMoveNext?.();
//         } else if (vertical > 50) {
//           onUpdate(item, 'absent');
//           onMoveNext?.();
//         }
//       },
//     });
//   }, [item, onMoveNext, onUpdate, variant]);

//   if (variant === 'fullscreen') {
//     return (
//       <View
//         style={[styles.fullscreenCard, rowTint, isSelected ? styles.rosterRowSelected : null]}
//         {...(panResponder ? panResponder.panHandlers : {})}>
//         <View style={styles.fullscreenHeader}>
//           <View style={styles.avatarShell}>
//             {item.image ? (
//               <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatarLarge} />
//             ) : (
//               <View style={[styles.avatarLarge, styles.avatarFallback]}>
//                 <ThemedText style={styles.avatarFallbackText}>{getInitials(item.name)}</ThemedText>
//               </View>
//             )}
//           </View>

//           <View style={styles.fullscreenMeta}>
//             <ThemedText type="title" style={styles.studentName}>{item.name}</ThemedText>
//             <ThemedText style={styles.studentMeta}>{item.email || 'N/A'}</ThemedText>
//           </View>

//           <View style={[styles.statusPill, renderStatusBadge(item.currentStatus)]}>
//             <ThemedText style={styles.statusPillText}>{renderStatusLabel(item.currentStatus)}</ThemedText>
//           </View>
//            <Pressable
//            style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#2563eb', borderRadius: 8 }}
//                     // style={[styles.actionButton, { backgroundColor: theme.tint }]}
//                     onPress={() => {
//                       if (item._id) {
//                         router.push({
//                           pathname: '/attdence-detail/[id]',
//                           params: { id: String(item._id) },
//                         });
//                       }
//                     }}
//                   >
//                     <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>View Monthly Attendance</ThemedText>
//                   </Pressable>
//         </View>

//         <View style={styles.fullscreenHintCard}>
//           <View style={styles.hintHeaderRow}>
//             <ThemedText style={styles.hintTitle}>Swipe </ThemedText>
//             <ThemedText style={styles.hintSideLabel}>Up (Present) / Down (Absent)</ThemedText>
//           </View>

//           {/* <View style={styles.sliderTrackWrap}>
//             <ThemedText style={styles.sliderHintText}>Present</ThemedText>
//             <View style={styles.sliderTrack}>
//               <View style={styles.sliderTrackFill} />
//               <View style={styles.sliderThumb}>
//                 <View style={styles.sliderThumbInner} />
//               </View>
//             </View>
//             <ThemedText style={styles.sliderHintText}>Absent</ThemedText>
//           </View> */}

//           {/* <ThemedText style={styles.hintText}>Swipe up to mark present and go next. Swipe down to mark absent and go next.</ThemedText> */}
//         </View>

//         <View style={styles.rowActionsFull}>
//           <Pressable onPress={() => onUpdate(item, 'present')} style={({ pressed }) => [styles.actionChip, styles.presentChip, pressed && styles.chipPressed]}>
//             <ThemedText style={styles.actionChipText}>Present</ThemedText>
//           </Pressable>
//           <Pressable onPress={() => onUpdate(item, 'absent')} style={({ pressed }) => [styles.actionChip, styles.absentChip, pressed && styles.chipPressed]}>
//             <ThemedText style={styles.actionChipText}>Absent</ThemedText>
//           </Pressable>
//           <Pressable onPress={() => onUpdate(item, 'leave')} style={({ pressed }) => [styles.actionChip, styles.leaveChip, pressed && styles.chipPressed]}>
//             <ThemedText style={styles.actionChipText}>Leave</ThemedText>
//           </Pressable>
//         </View>

//         <View style={styles.fullscreenFooter}>
//           <Pressable onPress={onMovePrev} style={({ pressed }) => [styles.navGhostButton, pressed && styles.chipPressed]}>
//             <ThemedText style={styles.navGhostText}>Prev</ThemedText>
//           </Pressable>
//           <Pressable onPress={onMoveNext} style={({ pressed }) => [styles.navGhostButton, pressed && styles.chipPressed]}>
//             <ThemedText style={styles.navGhostText}>Next</ThemedText>
//           </Pressable>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={[styles.rosterRow, rowTint, isSelected ? styles.rosterRowSelected : null]}>
//       <View style={styles.rowHeader}>
//         {item.image ? (
//           <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.avatar} />
//         ) : (
//           <View style={[styles.avatar, styles.avatarFallback]}>
//             <ThemedText style={styles.avatarFallbackText}>{getInitials(item.name)}</ThemedText>
//           </View>
//         )}
//         <View style={styles.rowMeta}>
//           <ThemedText type="defaultSemiBold" style={styles.studentName}>{item.name}</ThemedText>
//           <ThemedText style={styles.studentMeta}>{item.email || 'N/A'}</ThemedText>
//         </View>
//         <View style={[styles.statusPill, renderStatusBadge(item.currentStatus)]}>
//           <ThemedText style={styles.statusPillText}>{renderStatusLabel(item.currentStatus)}</ThemedText>
//         </View>
//       </View>

//       <View style={styles.rowActions}>
//         <Pressable onPress={() => onUpdate(item, 'present')} style={({ pressed }) => [styles.actionChip, styles.presentChip, pressed && styles.chipPressed]}>
//           <ThemedText style={styles.actionChipText}>Present</ThemedText>
//         </Pressable>
//         <Pressable onPress={() => onUpdate(item, 'absent')} style={({ pressed }) => [styles.actionChip, styles.absentChip, pressed && styles.chipPressed]}>
//           <ThemedText style={styles.actionChipText}>Absent</ThemedText>
//         </Pressable>
//         <Pressable onPress={() => onUpdate(item, 'leave')} style={({ pressed }) => [styles.actionChip, styles.leaveChip, pressed && styles.chipPressed]}>
//           <ThemedText style={styles.actionChipText}>Leave</ThemedText>
//         </Pressable>
//       </View>
//     </View>
//   );
// }

// export default React.memo(Row, (prev, next) => prev.item._key === next.item._key && prev.item.currentStatus === next.item.currentStatus && prev.variant === next.variant);

// const styles = StyleSheet.create({
//   rosterRow: {
//     borderRadius: 18,
//     padding: 14,
//     borderWidth: 1,
//     backgroundColor: 'rgba(219, 234, 254, 0.95)',
//   },
//   fullscreenCard: {
//     flex: 1,
//     borderRadius: 24,
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     backgroundColor: 'rgba(219, 234, 254, 0.95)',
//     gap: 16,
//     // justifyContent: 'space-between',
//   },
//   rosterRowSelected: {
//     shadowColor: '#000',
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 2,
//   },
//   rowPresent: {
//     borderColor: 'rgba(34, 197, 94, 0.28)',
//     backgroundColor: 'rgba(220, 252, 231, 0.96)',
//   },
//   rowAbsent: {
//     borderColor: 'rgba(239, 68, 68, 0.28)',
//     backgroundColor: 'rgba(254, 226, 226, 0.96)',
//   },
//   rowLeave: {
//     borderColor: 'rgba(245, 158, 11, 0.28)',
//     backgroundColor: 'rgba(255, 237, 213, 0.96)',
//   },
//   rowNeutral: {
//     borderColor: 'rgba(96, 165, 250, 0.28)',
//     backgroundColor: 'rgba(219, 234, 254, 0.96)'
//   },
//   rowHeader: {
//     flexDirection: 'row',
//     gap: 12,
//     alignItems: 'center',
//   },
//   fullscreenHeader: {
//     gap: 4,
//     alignItems: 'center',
//     marginBottom: 2,
//   },
//   avatar: {
//     width: 54,
//     height: 54,
//     borderRadius: 27,
//     backgroundColor: '#e5e7eb',
//   },
//   avatarShell: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarLarge: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#e5e7eb',
//   },
//   avatarFallback: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#1d4ed8',
//   },
//   avatarFallbackText: {
//     color: '#fff',
//     fontWeight: '900',
//     fontSize: 20,
//   },
//   rowMeta: {
//     flex: 1,
//     minWidth: 0,
//   },
//   fullscreenMeta: {
//     alignItems: 'center',
//     gap: 0,
//     width: '100%',
//   },
//   studentName: {
//     fontSize: 15,
//     color: '#000',
//   },
//   studentMeta: {
//     fontSize: 12,
//     opacity: 0.72,
//     marginTop: 1,
//     color: '#000',
//   },
//   statusPill: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 14,
//   },
//   statusPillText: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#000',
//   },
//   badgePresent: { backgroundColor: 'rgba(34,197,94,0.14)' },
//   badgeAbsent: { backgroundColor: 'rgba(239,68,68,0.14)' },
//   badgeLeave: { backgroundColor: 'rgba(245,158,11,0.14)' },
//   badgeNeutral: { backgroundColor: 'rgba(107,114,128,0.14)' },
//   rowParentInfo: { marginTop: 6, gap: 1 },
//   parentText: { fontSize: 12, opacity: 0.78, color: '#000' },
//   rowActions: { marginTop: 10, flexDirection: 'row', gap: 8 },
//   rowActionsFull: { flexDirection: 'row', gap: 8 },
//   actionChip: { flex: 1, borderRadius: 12, minHeight: 38, justifyContent: 'center', alignItems: 'center' },
//   presentChip: { backgroundColor: '#16a34a' },
//   absentChip: { backgroundColor: '#dc2626' },
//   leaveChip: { backgroundColor: '#d97706' },
//   actionChipText: { color: '#000', fontWeight: '800', fontSize: 12 },
//   chipPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
//   fullscreenHintCard: {
//     borderRadius: 16,
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     backgroundColor: 'rgba(15,23,42,0.05)',
//     gap: 6,
//     marginTop: 0,
//   },
//   hintHeaderRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   hintTitle: {
//     fontSize: 12,
//     fontWeight: '800',
//     color: '#000',
//   },
//   hintSideLabel: {
//     fontSize: 10,
//     fontWeight: '800',
//     opacity: 0.7,
//     textTransform: 'uppercase',
//     letterSpacing: 0.4,
//     color: '#000',
//   },
//   sliderTrackWrap: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   sliderHintText: {
//     fontSize: 10,
//     fontWeight: '800',
//     opacity: 0.75,
//     minWidth: 44,
//     textAlign: 'center',
//     color: '#000',
//   },
//   sliderTrack: {
//     flex: 1,
//     height: 18,
//     borderRadius: 999,
//     backgroundColor: 'rgba(148,163,184,0.22)',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   sliderTrackFill: {
//     position: 'absolute',
//     left: '50%',
//     top: 0,
//     bottom: 0,
//     width: '50%',
//     marginLeft: '-25%',
//     backgroundColor: 'rgba(37,99,235,0.12)',
//   },
//   sliderThumb: {
//     position: 'absolute',
//     left: '50%',
//     top: 2,
//     width: 14,
//     height: 14,
//     marginLeft: -7,
//     borderRadius: 7,
//     backgroundColor: '#2563eb',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 3,
//     shadowOffset: { width: 0, height: 1 },
//     elevation: 2,
//   },
//   sliderThumbInner: {
//     width: 4,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#fff',
//   },
//   hintText: {
//     fontSize: 11,
//     opacity: 0.72,
//     lineHeight: 16,
//     textAlign: 'center',
//     color: '#000',
//   },
//   fullscreenFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 6,
//   },
//   navGhostButton: {
//     flex: 1,
//     borderRadius: 14,
//     paddingVertical: 6,
//     alignItems: 'center',
//     backgroundColor: 'rgba(37,99,235,0.08)',
//   },
//   navGhostText: {
//     fontWeight: '800',
//     color: '#000',
//   },
// });


import React, { useMemo } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';

const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

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
  role: string;
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

function renderStatusLabel(status: AttendanceStatus) {
  if (status === 'not-marked') return 'Not Marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Generates a fake barcode matching the ID Card aesthetic
const DecorativeBarcode = () => {
  const pattern = [2, 4, 1, 3, 2, 1, 5, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2];
  return (
    <View style={styles.barcodeWrapper}>
      {pattern.map((width, i) => (
        <View key={i} style={[styles.bar, { width }]} />
      ))}
    </View>
  );
};

let NAME = 'U S E R'; // Default role name, will be updated based on the role prop

function Row({ role = 'student', item, onUpdate, variant = 'compact', onMoveNext, onMovePrev }: Props) {

  const router = useRouter();
  if (role === 'Teacher') {
    NAME = 'T E A C H E R';
  } else if (role === 'Staff') {
    NAME = 'S T A F F';
  } else if(role === 'Admin') {
    NAME = 'A D M I N';
  }else {
    NAME = 'S T U D E N T';
  }

  const isSelected = item.currentStatus !== 'not-marked';
  
  // Apply a subtle tint and border color based on attendance status to keep the ID card look clean
  const cardTint = item.currentStatus === 'present'
    ? { backgroundColor: 'rgba(46, 125, 50, 0.03)', borderColor: PALETTE.success }
    : item.currentStatus === 'absent'
      ? { backgroundColor: 'rgba(211, 47, 47, 0.03)', borderColor: PALETTE.error }
      : item.currentStatus === 'leave'
        ? { backgroundColor: 'rgba(249, 168, 37, 0.03)', borderColor: PALETTE.warning }
        : { backgroundColor: PALETTE.surface, borderColor: PALETTE.border };

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

  // The unified ID Card content structure
  const IDCardContent = (
    <>
      {/* 1. Header Band */}
      <View style={styles.idHeader}>
        <Text style={styles.idHeaderText}>{NAME}</Text>
      </View>

      {/* 2. Main Body (Info + Photo) */}
      <View style={[styles.idBody, variant === 'fullscreen' && { flex: 1 }]}>
        
        {/* Left Column: Data */}
        <View style={styles.idInfoCol}>
          <Text style={styles.idName} numberOfLines={1} adjustsFontSizeToFit>
            {item.name.toUpperCase()}
          </Text>
          <Text style={styles.idDetailText}>Card #{item.studentIdCode || '00000000'}</Text>
          <Text style={styles.idDetailText}>Roll: {item.rollNumber || 'N/A'}</Text>
          <Text style={styles.idDetailText}>Email: {item.email || 'N/A'}</Text>
          
          <View style={styles.idStatusWrapper}>
             <Text style={styles.idDetailText}>Status: </Text>
             <Text style={[
               styles.idStatusValue,
               item.currentStatus === 'present' && { color: PALETTE.success },
               item.currentStatus === 'absent' && { color: PALETTE.error },
               item.currentStatus === 'leave' && { color: PALETTE.warning },
             ]}>
               {renderStatusLabel(item.currentStatus)}
             </Text>
          </View>

          {/* Decorative Barcode */}
          <DecorativeBarcode />
        </View>

        {/* Right Column: Square-ish Photo with border */}
        <View style={styles.idPhotoCol}>
          {item.image ? (
            <Image source={{ uri: item.image || AVATAR_FALLBACK }} style={styles.idPhoto} />
          ) : (
            <View style={[styles.idPhoto, styles.idPhotoFallback]}>
              <Text style={styles.idPhotoFallbackText}>{getInitials(item.name)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. Footer / Actions */}
      <View style={styles.idFooter}>
        
        {variant === 'fullscreen' && (
          <Pressable
            style={({ pressed }) => [styles.monthlyButton, pressed && styles.buttonPressed]}
            onPress={() => {
              if (item._id) {
                router.push({
                  pathname: '/attdence-detail/[id]',
                  params: { id: String(item._id) },
                });
              }
            }}
          >
            <Text style={styles.monthlyButtonText}>View Monthly Attendance</Text>
          </Pressable>
        )}

        {variant === 'fullscreen' && (
          <View style={styles.fullscreenHintCard}>
            <Text style={styles.hintText}>Swipe up to mark present. Swipe down to mark absent.</Text>
          </View>
        )}

        <View style={styles.rowActions}>
          <Pressable onPress={() => onUpdate(item, 'present')} style={({ pressed }) => [styles.actionButton, styles.presentButton, pressed && styles.buttonPressed]}>
            <Text style={styles.actionButtonText}>Present</Text>
          </Pressable>
          <Pressable onPress={() => onUpdate(item, 'absent')} style={({ pressed }) => [styles.actionButton, styles.absentButton, pressed && styles.buttonPressed]}>
            <Text style={styles.actionButtonText}>Absent</Text>
          </Pressable>
          <Pressable onPress={() => onUpdate(item, 'leave')} style={({ pressed }) => [styles.actionButton, styles.leaveButton, pressed && styles.buttonPressed]}>
            <Text style={styles.actionButtonText}>Leave</Text>
          </Pressable>
        </View>

        {variant === 'fullscreen' && (
          <View style={styles.fullscreenNav}>
            <Pressable onPress={onMovePrev} style={({ pressed }) => [styles.navGhostButton, pressed && styles.buttonPressed]}>
              <Text style={styles.navGhostText}>Prev</Text>
            </Pressable>
            <Pressable onPress={onMoveNext} style={({ pressed }) => [styles.navGhostButton, pressed && styles.buttonPressed]}>
              <Text style={styles.navGhostText}>Next</Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.idCardContainer,
        variant === 'fullscreen' && styles.fullscreenCard,
        cardTint
      ]}
      {...(panResponder ? panResponder.panHandlers : {})}
    >
      {IDCardContent}
    </View>
  );
}

export default React.memo(Row, (prev, next) => prev.item._key === next.item._key && prev.item.currentStatus === next.item.currentStatus && prev.variant === next.variant);

const styles = StyleSheet.create({
  /* MAIN CARD CONTAINER */
  idCardContainer: {
    borderRadius: 12, // Matches the smooth rounded corners of the ID card image
    borderWidth: 1,
    overflow: 'hidden', // Ensures the blue header stays clipped to the rounded corners
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fullscreenCard: {
    flex: 1,
    marginBottom: 0,
  },

  /* HEADER (BLUE BAND) */
  idHeader: {
    backgroundColor: PALETTE.primary, 
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  idHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6, // Matches the widely spaced S T U D E N T text
    marginLeft: 6, 
  },

  /* BODY (INFO + PHOTO) */
  idBody: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  idInfoCol: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'flex-start',
  },
  idPhotoCol: {
    justifyContent: 'flex-start',
  },

  /* TYPOGRAPHY */
  idName: {
    fontSize: 18,
    fontWeight: '900',
    color: PALETTE.textHeading,
    marginBottom: 10,
  },
  idDetailText: {
    fontSize: 13,
    color: PALETTE.textBody,
    fontWeight: '500',
    marginBottom: 4,
  },
  idStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  idStatusValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  /* PHOTO RECTANGLE */
  idPhoto: {
    width: 90,
    height: 115, // Portrait ratio exactly like the reference
    borderWidth: 1,
    borderColor: '#333', // Thin distinct border matching the vector art
    backgroundColor: PALETTE.background,
  },
  idPhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.border,
  },
  idPhotoFallbackText: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textHeading,
  },

  /* DECORATIVE BARCODE */
  barcodeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 24,
    marginTop: 14,
  },
  bar: {
    height: '100%',
    backgroundColor: '#000', // Black barcode lines
    marginRight: 1.5,
  },

  /* FOOTER / ACTIONS */
  idFooter: {
    padding: 16,
    paddingTop: 8,
  },
  monthlyButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  monthlyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  rowActions: { 
    flexDirection: 'row', 
    gap: 8,
    marginTop: 4,
  },
  actionButton: { 
    flex: 1, 
    borderRadius: 4, 
    paddingVertical: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  presentButton: { 
    backgroundColor: PALETTE.success, 
    borderColor: PALETTE.success 
  },
  absentButton: { 
    backgroundColor: PALETTE.error, 
    borderColor: PALETTE.error 
  },
  leaveButton: { 
    backgroundColor: PALETTE.warning, 
    borderColor: PALETTE.warning 
  },
  actionButtonText: { 
    color: PALETTE.surface, 
    fontWeight: '700', 
    fontSize: 13 
  },
  buttonPressed: { 
    opacity: 0.85 
  },

  /* FULLSCREEN SPECIFICS */
  fullscreenHintCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: PALETTE.textBody,
    textAlign: 'center',
  },
  fullscreenNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  navGhostButton: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: PALETTE.background,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  navGhostText: {
    fontWeight: '700',
    color: PALETTE.textHeading,
    fontSize: 14,
  },
});