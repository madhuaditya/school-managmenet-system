import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DRAWER_FOOTER_ACTIONS, getDrawerQuickLinksForRole } from '@/src/constants/drawerMenu';
import { useAuthStore } from '@/src/store/auth.store';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Fontisto from '@expo/vector-icons/Fontisto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AVATAR_FALLBACK = 'https://e7.pngegg.com/pngimages/84/165/png-clipart-united-states-avatar-organization-information-user-avatar-service-computer-wallpaper-thumbnail.png';

const lightColors = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  primary: "#2563EB",
  text: "#111827",
  subText: "#6B7280",
  border: "#E5E7EB",
};

const darkColors = {
  bg: "#0F172A",
  card: "#1E293B",
  primary: "#3B82F6",
  text: "#E5E7EB",
  subText: "#9CA3AF",
  border: "#334155",
};

export default function TabLayout() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
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
      router.replace('/');
      return;
    }

    if (action.route) {
      navigateFromDrawer(action.route);
    }
  };

  return (
    <>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,

        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 6,
          elevation: 10,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        headerShown: true,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerShadowVisible: false,

        tabBarButton: HapticTab,

        headerLeft: () => (
          <Pressable
            onPress={openDrawer}
            style={{
              marginLeft: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.border,
            }}>
            <MaterialIcons name="menu" size={22} color={colors.text} />
          </Pressable>
        ),

        headerRight: () => (
          <Pressable
            onPress={() => router.push('/profile')}
            style={{
              marginRight: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}>
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {userInitial}
              </Text>
            )}
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Fontisto name="home" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="broadcast"
        options={{
          href: isAdmin || isTeacher || isStaff ? undefined : null,
          title: 'Broadcast',
          tabBarIcon: ({ color }) => <FontAwesome6 name="bullhorn" size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="adduser"
        options={{
          href: null,
          title: 'Add User',
          tabBarIcon: ({ color }) => <FontAwesome name="user-plus" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="notice"
        options={{
          href: null,
          title: 'Notice',
          tabBarIcon: ({ color }) => <FontAwesome6 name="notes-medical" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="book.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
        }}
      />

      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.3.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="teachers"
        options={{
          title: 'Teachers',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="admins"
        options={{
          href: null,
          title: 'Admins',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.crop.circle.badge.checkmark" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="myattendance"
        options={{
          href: isStudent || isStaff ? undefined : null,
          title: 'Attendance',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="checkmark.circle.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-salary"
        options={{
          href: isAdmin || isTeacher || isStaff ? undefined : null,
          title: 'My Salary',
          tabBarIcon: ({ color }) => <FontAwesome name="money" size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="leave-apply"
        options={{
          href: null,
          title: 'Apply Leave',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
        }}
      />

      <Tabs.Screen
        name="my-leaves"
        options={{
          href: null,
          title: 'My Leaves',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.bullet" color={color} />,
        }}
      />

      <Tabs.Screen
        name="leave-review"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Leave Review',
          tabBarIcon: ({ color }) => <MaterialIcons name="reviews" size={24} color={color}/>,
        }}
      />

      <Tabs.Screen
        name="my-alerts"
        options={{
          href: null,
          title: 'My Alerts',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="bell.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="create-alert"
        options={{
          href: isAdmin ? undefined : null,
          title: 'Create Alert',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>

    {drawerVisible ? (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
          <Animated.View
            style={[
              styles.drawerBackdrop,
              {
                opacity: overlayOpacity,
                backgroundColor: 'rgba(0,0,0,0.45)',
              },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.drawerPanel,
            {
              width: drawerWidth,
              backgroundColor: colors.card,
              transform: [{ translateX: slideX }],
            },
          ]}>
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.drawerUserRow}>
              <View style={[styles.drawerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.drawerAvatarText}>{userInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerName, { color: colors.text }]} numberOfLines={1}>
                  {user?.name || 'User'}
                </Text>
                <Text style={[styles.drawerRole, { color: colors.subText }]}>{role || 'guest'}</Text>
              </View>
            </View>
            <Pressable onPress={closeDrawer} style={styles.drawerClose}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.drawerSectionTitle, { color: colors.subText }]}>Quick Links</Text>
            {drawerLinks.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => navigateFromDrawer(item.route)}
                style={({ pressed }) => [
                  styles.drawerItem,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.border : colors.bg,
                  },
                ]}>
                <View style={[styles.drawerIconWrap, { backgroundColor: item.color }]}>
                  <MaterialIcons name={item.icon as never} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.drawerItemSubtitle, { color: colors.subText }]}>
                    Open {item.label.toLowerCase()}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.subText} />
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
            {DRAWER_FOOTER_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleDrawerAction(action)}
                style={({ pressed }) => [
                  styles.drawerFooterButton,
                  {
                    backgroundColor: action.id === 'logout' ? 'rgba(220,38,38,0.08)' : 'rgba(14,165,233,0.08)',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <MaterialIcons name={action.icon as never} size={20} color={action.color} />
                <Text style={[styles.drawerFooterButtonText, { color: action.color }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  drawerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  drawerRole: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    padding: 16,
    gap: 10,
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  drawerItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  drawerItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  drawerFooter: {
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: 10,
  },
  drawerFooterButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  drawerFooterButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
