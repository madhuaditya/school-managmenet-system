import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View, useColorScheme } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/src/store/auth.store';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Fontisto from '@expo/vector-icons/Fontisto';

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

  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const isStudent = role === 'student';
  const isStaff = role === 'staff';

  const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
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
        name="doubts"
        options={{
          title: 'Doubts',
          href: undefined,
          tabBarIcon: ({ color }) => <AntDesign name={"wechat" as any} size={22} color={color} />,
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
    </Tabs>
  );
}