// import { Tabs, useRouter } from 'expo-router';
// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

// import { HapticTab } from '@/components/haptic-tab';
// import { IconSymbol } from '@/components/ui/icon-symbol';
// import { DRAWER_FOOTER_ACTIONS, getDrawerQuickLinksForRole } from '@/src/constants/drawerMenu';
// import { useAuthStore } from '@/src/store/auth.store';
// import AntDesign from '@expo/vector-icons/AntDesign';
// import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import Fontisto from '@expo/vector-icons/Fontisto';
// import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

// const lightColors = {
//   bg: "#F9FAFB",
//   card: "#d9e3f4",
//   primary: "#2563EB",
//   text: "#111827",
//   subText: "#6B7280",
//   border: "#E5E7EB",
// };

// const darkColors = {
//   bg: "#0F172A",
//   card: "#1E293B",
//   primary: "#3B82F6",
//   text: "#E5E7EB",
//   subText: "#9CA3AF",
//   border: "#334155",
// };

// const erpColors = {
//   bg: '#F5F5F5',
//   card: '#FFFFFF',

//   primary: '#303841',
//   accent: '#76ABAE',
//   cta: '#FF5722',

//   text: '#303841',
//   subText: '#5D646B',

//   border: '#E6E6E6',

//   success: '#2E7D32',
//   warning: '#F9A825',
//   error: '#D32F2F',
// };

// export default function TabLayout() {
//   const router = useRouter();
//   const colors = erpColors;
//   const screenWidth = Dimensions.get('window').width;
//   const drawerWidth = Math.min(screenWidth * 0.82, 340);
//   const slideX = useRef(new Animated.Value(-drawerWidth)).current;
//   const overlayOpacity = useRef(new Animated.Value(0)).current;
//   const [drawerVisible, setDrawerVisible] = useState(false);

//   const user = useAuthStore((state) => state.user);
//   const logout = useAuthStore((state) => state.logout);
//   const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
//   const isAdmin = role === 'admin';
//   const isTeacher = role === 'teacher';
//   const isStudent = role === 'student';
//   const isStaff = role === 'staff';

//   const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();
//   const drawerLinks = useMemo(() => getDrawerQuickLinksForRole(role, user?._id), [role, user?._id]);
//   const [exportingLogs, setExportingLogs] = useState(false);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(slideX, {
//         toValue: drawerVisible ? 0 : -drawerWidth,
//         duration: 220,
//         useNativeDriver: true,
//       }),
//       Animated.timing(overlayOpacity, {
//         toValue: drawerVisible ? 1 : 0,
//         duration: 220,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [drawerVisible, drawerWidth, overlayOpacity, slideX]);

//   const closeDrawer = () => setDrawerVisible(false);
//   const openDrawer = () => setDrawerVisible(true);

//   const navigateFromDrawer = (route: string) => {
//     closeDrawer();
//     router.push(route as never);
//   };

//   const handleDrawerAction = async (action: { action?: 'logout'; route?: string }) => {
//     if (action.action === 'logout') {
//       closeDrawer();
//       await logout();
//       router.replace('/');
//       return;
//     }

//     if (action.route) {
//       navigateFromDrawer(action.route);
//     }
//   };

//   return (
//     <>
//       <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: colors.accent,
//         tabBarInactiveTintColor: colors.subText,

//         tabBarStyle: {
//         backgroundColor: '#FFFFFF',
//         borderTopColor: '#E6E6E6',
//         borderTopWidth: 1,
//         height: 68,
//         paddingBottom: 8,
//       },

//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: '600',
//         },

//         headerShown: true,
//         headerTitleStyle: {
//           fontWeight: '700',
//           fontSize: 18,
//           letterSpacing: 0.3,
//         },
//        headerStyle: {
//         backgroundColor: '#303841',
//         elevation: 0,
//       },
//         headerTintColor: '#FFFFFF',
//         headerShadowVisible: false,

//         tabBarButton: HapticTab,

//         headerLeft: () => (
//           <Pressable
//             onPress={openDrawer}
//             style={{
//               marginLeft: 12,
//               width: 36,
//               height: 36,
//               borderRadius: 18,
//               alignItems: 'center',
//               justifyContent: 'center',
//               backgroundColor: 'rgba(255,255,255,0.15)'
//             }}>
//             <MaterialIcons name="menu" size={22} color="#FFFFFF" />
//           </Pressable>
//         ),

//         headerRight: () => (
//           <Pressable
//             onPress={() => router.push('/profile')}
//             style={{
//               marginRight: 12,
//               width: 36,
//               height: 36,
//               borderRadius: 18,
//               overflow: 'hidden',
//               alignItems: 'center',
//               justifyContent: 'center',
//               backgroundColor: '#76ABAE',
//             }}>
//             {user?.image ? (
//               <Image
//                 source={{ uri: user.image }}
//                 style={{ width: 36, height: 36 }}
//               />
//             ) : (
//               <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
//                 {userInitial}
//               </Text>
//             )}
//           </Pressable>
//         ),
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color }) => <Fontisto name="home" size={22} color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="broadcast"
//         options={{
//           href: isAdmin || isTeacher || isStaff ? undefined : null,
//           title: 'Broadcast',
//           tabBarIcon: ({ color }) => <FontAwesome6 name="bullhorn" size={20} color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="adduser"
//         options={{
//           href: null,
//           title: 'Add User',
//           tabBarIcon: ({ color }) => <FontAwesome name="user-plus" size={24} color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="notice"
//         options={{
//           href: null,
//           title: 'Notice',
//           tabBarIcon: ({ color }) => <FontAwesome6 name="notes-medical" size={24} color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="classes"
//         options={{
//           title: 'Classes',
//           href: null,
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="book.fill" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="timetable"
//         options={{
//           title: 'Timetable',
//           href: null,
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="students"
//         options={{
//           title: 'Students',
//           href: null,
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.3.fill" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="teachers"
//         options={{
//           title: 'Teachers',
//           href: null,
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="admins"
//         options={{
//           href: null,
//           title: 'Admins',
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={24} name="person.crop.circle.badge.checkmark" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="myattendance"
//         options={{
//           href: isStudent || isStaff ? undefined : null,
//           title: 'Attendance',
//           tabBarIcon: ({ color }) => (
//             <IconSymbol size={24} name="checkmark.circle.fill" color={color} />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="my-salary"
//         options={{
//           href: isAdmin || isTeacher || isStaff ? undefined : null,
//           title: 'My Salary',
//           tabBarIcon: ({ color }) => <FontAwesome name="money" size={22} color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="leave-apply"
//         options={{
//           href: null,
//           title: 'Apply Leave',
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="my-leaves"
//         options={{
//           href: null,
//           title: 'My Leaves',
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.bullet" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="leave-review"
//         options={{
//           href: isAdmin ? undefined : null,
//           title: 'Leave Review',
//           tabBarIcon: ({ color }) => <MaterialIcons name="reviews" size={24} color={color}/>,
//         }}
//       />

//       <Tabs.Screen
//         name="my-alerts"
//         options={{
//           href: null,
//           title: 'My Alerts',
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="bell.fill" color={color} />,
//         }}
//       />

//       <Tabs.Screen
//         name="create-alert"
//         options={{
//           href: isAdmin ? undefined : null,
//           title: 'Create Alert',
//           tabBarIcon: ({ color }) => <IconSymbol size={24} name="paperplane.fill" color={color} />,
//         }}
//       />
//     </Tabs>

//     {drawerVisible ? (
//       <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
//         <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
//           <Animated.View
//             style={[
//               styles.drawerBackdrop,
//               {
//                 opacity: overlayOpacity,
//                 backgroundColor: 'rgba(0,0,0,0.45)',
//               },
//             ]}
//           />
//         </Pressable>

//         <Animated.View
//           style={[
//             styles.drawerPanel,
//             {
//               width: drawerWidth,
//               backgroundColor: '#FFFFFF',
//               transform: [{ translateX: slideX }],
//             },
//           ]}>
//           <View style={[
//     styles.drawerHeader,
//     {
//       backgroundColor: '#303841',
//       borderBottomColor: '#404A54',
//     },
//   ]}>
//             <View style={styles.drawerUserRow}>
//               <View style={[styles.drawerAvatar, { backgroundColor: '#76ABAE'}]}>
//                 <Text style={styles.drawerAvatarText}>{userInitial}</Text>
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={[styles.drawerName, { color: '#FFFFFF' }]} numberOfLines={1}>
//                   {user?.name || 'User'}
//                 </Text>
//                 <Text style={[styles.drawerRole, { color: 'rgba(255,255,255,0.7)' }]}>{role || 'guest'}</Text>
//               </View>
//             </View>
//             <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
//               <Pressable onPress={closeDrawer} style={styles.drawerClose}>
//                 <MaterialIcons name="close" size={22} color={colors.text} />
//               </Pressable>
//             </View>
//           </View>

//           <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
//             <Text style={[styles.drawerSectionTitle, { color: colors.subText }]}>Quick Links</Text>
//             {drawerLinks.map((item) => (
//               <Pressable
//                 key={item.id}
//                 onPress={() => navigateFromDrawer(item.route)}
//                 style={({ pressed }) => [
//                   styles.drawerItem,
//                   {
//                     borderColor: colors.border,
//                    backgroundColor: pressed
//                   ? 'rgba(118,171,174,0.08)'
//                   : '#FFFFFF'
//                   },
//                 ]}>
//                 <View style={[styles.drawerIconWrap, { backgroundColor: item.color }]}>
//                   <MaterialIcons name={item.icon as never} size={20} color="#fff" />
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={[styles.drawerItemTitle, { color: colors.text }]}>{item.label}</Text>
//                   <Text style={[styles.drawerItemSubtitle, { color: colors.subText }]}>
//                     Open {item.label.toLowerCase()}
//                   </Text>
//                 </View>
//                 <MaterialIcons name="chevron-right" size={20} color={colors.subText} />
//               </Pressable>
//             ))}
//           </ScrollView>

//           <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
//             {DRAWER_FOOTER_ACTIONS.map((action) => (
//               <Pressable
//                 key={action.id}
//                 onPress={() => handleDrawerAction(action)}
//                 style={({ pressed }) => [
//                   styles.drawerFooterButton,
//                   {
//                     backgroundColor: action.id === 'logout' ? 'rgba(211,47,47,0.10)' : 'rgba(118,171,174,0.12)',
//                     opacity: pressed ? 0.7 : 1,
//                   },
//                 ]}>
//                 <MaterialIcons name={action.icon as never} size={20} color={action.color} />
//                 <Text style={[styles.drawerFooterButtonText, { color: action.color }]}>{action.label}</Text>
//               </Pressable>
//             ))}
//           </View>
//         </Animated.View>
//       </View>
//       ) : null}
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   drawerBackdrop: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   drawerPanel: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     bottom: 1,
//     shadowColor: '#000',
//     shadowOpacity: 0.18,
//     shadowRadius: 12,
//     elevation: 12,
//   },
//   drawerHeader: {
//     paddingHorizontal: 16,
//     paddingTop: 52,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   drawerUserRow: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   drawerAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   drawerAvatarText: {
//     color: '#fff',
//     fontWeight: '800',
//     fontSize: 16,
//   },
//   drawerName: {
//     fontSize: 16,
//     fontWeight: '800',
//   },
//   drawerRole: {
//     fontSize: 12,
//     textTransform: 'capitalize',
//     marginTop: 2,
//   },
//   drawerClose: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   drawerContent: {
//     padding: 16,
//     gap: 10,
//   },
//   drawerSectionTitle: {
//     fontSize: 12,
//     fontWeight: '800',
//     textTransform: 'uppercase',
//     letterSpacing: 0.8,
//     marginBottom: 2,
//   },
//   drawerItem: {
//     borderWidth: 1,
//     borderRadius: 16,
//     padding: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   drawerIconWrap: {
//     width: 38,
//     height: 38,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   drawerItemTitle: {
//     fontSize: 14,
//     fontWeight: '800',
//   },
//   drawerItemSubtitle: {
//     fontSize: 12,
//     marginTop: 2,
//   },
//   drawerFooter: {
//     padding: 16,
//     paddingBottom: 10,
//     borderTopWidth: 1,
//     gap: 10,
//   },
//   drawerFooterButton: {
//     minHeight: 44,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     gap: 10,
//   },
//   drawerFooterButtonText: {
//     fontSize: 14,
//     fontWeight: '800',
//   },
// });

import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet,  Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DRAWER_FOOTER_ACTIONS, getDrawerQuickLinksForRole } from '@/src/constants/drawerMenu';
import { useAuthStore } from '@/src/store/auth.store';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import BubbleBackground from '@/components/BubbleBackground';

const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

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

export default function TabLayout() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = Math.min(screenWidth * 0.82, 340);
  const slideX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [drawerVisible, setDrawerVisible] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const isStaff = role === 'staff';

  const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();
  const drawerLinks = useMemo(() => getDrawerQuickLinksForRole(role, user?._id), [role, user?._id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: drawerVisible ? 0 : -drawerWidth,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: drawerVisible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerVisible, drawerWidth, overlayOpacity, slideX]);

  const closeDrawer = () => setDrawerVisible(false);
  const openDrawer = () => setDrawerVisible(true);

  const navigateFromDrawer = (route: string) => {
    closeDrawer();
    router.push(route as never);
  };

  const handleDrawerAction = async (action: { action?: 'logout'; route?: string }) => {
    if (action.action === 'logout') {
      closeDrawer();
      await logout();
      router.replace('/feedback');
      return;
    }

    if (action.route) {
      navigateFromDrawer(action.route);
    }
  };

  return (
    <>
<>
  <View style={{ flex: 1 }}>
    <BubbleBackground />

       <Tabs
        screenOptions={{
          tabBarActiveTintColor: PALETTE.accent,
          tabBarInactiveTintColor: PALETTE.textBody,

          tabBarStyle: {
            backgroundColor: PALETTE.surface,
            borderTopColor: PALETTE.border,
            borderTopWidth: 1,
            height: 68,
            paddingBottom: 8,
          },

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },

          headerShown: true,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            letterSpacing: 0.3,
          },
          headerStyle: {
            backgroundColor: PALETTE.primary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: PALETTE.surface,
          headerShadowVisible: false,

          tabBarButton: HapticTab,

          headerLeft: () => (
            <Pressable
              onPress={openDrawer}
              style={({ pressed }) => [
                styles.headerIconWrap,
                pressed && styles.buttonPressed,
                { marginLeft: 16 }
              ]}>
              <MaterialIcons name="menu" size={24} color={PALETTE.surface} />
            </Pressable>
          ),

          headerRight: () => (
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [
                styles.headerAvatarWrap,
                pressed && styles.buttonPressed,
                { marginRight: 16 }
              ]}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.headerAvatarImage}
                />
              ) : (
                <Text style={styles.headerAvatarFallback}>
                  {userInitial}
                </Text>
              )}
            </Pressable>
          ),
        }}
      >
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: -40,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(99,102,241,0.12)', // Indigo
        }}
      />

  <View
    style={{
      position: 'absolute',
      bottom: 20,
      right: -20,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(16,185,129,0.10)', // Green
    }}
  />
      </View>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Fontisto name="home" size={20} color={color} />,
          }}
        />

        <Tabs.Screen
          name="broadcast"
          options={{
            href: isAdmin || isTeacher || isStaff ? undefined : null,
            title: 'Broadcast',
            tabBarIcon: ({ color }) => <FontAwesome6 name="bullhorn" size={18} color={color} />,
          }}
        />

        <Tabs.Screen
          name="adduser"
          options={{
            href: null,
            title: 'Add User',
            tabBarIcon: ({ color }) => <FontAwesome name="user-plus" size={20} color={color} />,
          }}
        />

        <Tabs.Screen
          name="notice"
          options={{
            href: null,
            title: 'Notice',
            tabBarIcon: ({ color }) => <FontAwesome6 name="notes-medical" size={20} color={color} />,
          }}
        />

        <Tabs.Screen
          name="classes"
          options={{
            title: 'Classes',
            href: null,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="book.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="timetable"
          options={{
            title: 'Timetable',
            href: null,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="calendar-month" color={color} />,
          }}
        />

        <Tabs.Screen
          name="students"
          options={{
            title: 'Students',
            href: null,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.3.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="teachers"
          options={{
            title: 'Teachers',
            href: null,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.2.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="admins"
          options={{
            href: null,
            title: 'Admins',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={22} name="person.crop.circle.badge.checkmark" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="myattendance"
          options={{
            href: isStudent || isStaff ? undefined : null,
            title: 'Attendance',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={22} name="checkmark.circle.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="my-salary"
          options={{
            href: isAdmin || isTeacher || isStaff ? undefined : null,
            title: 'My Salary',
            tabBarIcon: ({ color }) => <FontAwesome name="money" size={20} color={color} />,
          }}
        />

        <Tabs.Screen
          name="leave-apply"
          options={{
            href: null,
            title: 'Apply Leave',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="calendar-month" color={color} />,
          }}
        />

        <Tabs.Screen
          name="my-leaves"
          options={{
            href: null,
            title: 'My Leaves',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="list.bullet" color={color} />,
          }}
        />

         {/* <Tabs.Screen
          name="timetable"
          options={{
            href: null,
            title: 'Timetable',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="calendar" color={color} />,
          }}
        /> */}

        <Tabs.Screen
          name="leave-review"
          options={{
            href: isAdmin ? undefined : null,
            title: 'Leave Review',
            tabBarIcon: ({ color }) => <MaterialIcons name="reviews" size={22} color={color}/>,
          }}
        />

        <Tabs.Screen
          name="my-alerts"
          options={{
            href: null,
            title: 'My Alerts',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="bell.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="create-alert"
          options={{
            href: isAdmin ? undefined : null,
            title: 'Create Alert',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="paperplane.fill" color={color} />,
          }}
        />
      </Tabs>
  </View>
</>
  

      {drawerVisible ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
            <Animated.View
              style={[
                styles.drawerBackdrop,
                {
                  opacity: overlayOpacity,
                  backgroundColor: 'rgba(48, 56, 65, 0.6)', // Using primary color for overlay
                },
              ]}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.drawerPanel,
              {
                width: drawerWidth,
                backgroundColor: PALETTE.background,
                transform: [{ translateX: slideX }],
              },
            ]}>
            
            <View style={styles.drawerHeader}>
              <View style={styles.drawerUserRow}>
                <View style={styles.drawerAvatar}>
                  {user?.image ? (
                    <Image source={{ uri: user.image }} style={styles.drawerAvatarImage} />
                  ) : (
                    <Text style={styles.drawerAvatarText}>{userInitial}</Text>
                  )}
                </View>
                <View style={styles.drawerUserInfo}>
                  <Text style={styles.drawerName} numberOfLines={1}>
                    {user?.name || 'User'}
                  </Text>
                  <Text style={styles.drawerRole}>{role || 'Guest'}</Text>
                </View>
              </View>
              <Pressable onPress={closeDrawer} style={({ pressed }) => [styles.drawerClose, pressed && styles.buttonPressed]}>
                <MaterialIcons name="close" size={24} color={PALETTE.surface} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.drawerSectionTitle}>Quick Links</Text>
              
              {drawerLinks.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => navigateFromDrawer(item.route)}
                  style={({ pressed }) => [
                    styles.drawerItem,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={[styles.drawerIconWrap, { backgroundColor: item.color || PALETTE.primary }]}>
                    <MaterialIcons name={item.icon as never} size={20} color={PALETTE.surface} />
                  </View>
                  <View style={styles.drawerItemTextContainer}>
                    <Text style={styles.drawerItemTitle}>{item.label}</Text>
                    <Text style={styles.drawerItemSubtitle}>Open {item.label.toLowerCase()}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={PALETTE.textBody} />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.drawerFooter}>
              {DRAWER_FOOTER_ACTIONS.map((action) => {
                const isLogout = action.id === 'logout';
                return (
                  <Pressable
                    key={action.id}
                    onPress={() => handleDrawerAction(action)}
                    style={({ pressed }) => [
                      styles.drawerFooterButton,
                      {
                        backgroundColor: isLogout ? 'rgba(211, 47, 47, 0.05)' : PALETTE.surface,
                        borderColor: isLogout ? 'rgba(211, 47, 47, 0.2)' : PALETTE.border,
                      },
                      pressed && styles.buttonPressed,
                    ]}>
                    <MaterialIcons 
                      name={action.icon as never} 
                      size={20} 
                      color={isLogout ? PALETTE.error : PALETTE.textHeading} 
                    />
                    <Text 
                      style={[
                        styles.drawerFooterButtonText, 
                        { color: isLogout ? PALETTE.error : PALETTE.textHeading }
                      ]}>
                      {action.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.7,
  },
  
  /* HEADER BUTTONS */
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.accent,
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    color: PALETTE.surface,
    fontWeight: '700',
    fontSize: 14,
  },

  /* DRAWER BACKDROP & PANEL */
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    elevation: 4, // Subtle shadow instead of heavy
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 2, height: 0 },
  },

  /* DRAWER HEADER */
  drawerHeader: {
    paddingHorizontal: 16,
    paddingTop: 52, // Accounts for status bar
    paddingBottom: 20,
    backgroundColor: PALETTE.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerUserRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: PALETTE.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  drawerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  drawerAvatarText: {
    color: PALETTE.surface,
    fontWeight: '700',
    fontSize: 18,
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerName: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.surface,
  },
  drawerRole: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  drawerClose: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  /* DRAWER CONTENT (LINKS) */
  drawerContent: {
    padding: 16,
    gap: 8,
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textBody,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 2,
  },
  drawerItem: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    borderRadius: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemTextContainer: {
    flex: 1,
  },
  drawerItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  drawerItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: PALETTE.textBody,
  },

  /* DRAWER FOOTER */
  drawerFooter: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    gap: 8,
  },
  drawerFooterButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  drawerFooterButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});