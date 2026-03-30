import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Fontisto from '@expo/vector-icons/Fontisto';

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const headerBackgroundColor = colorScheme === 'dark' ? '#1d2125' : '#f3f6fa';
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher' || role === 'admin';
  const isStudent = role === 'student';
  const isStaff = role === 'staff';
  const userInitial = (user?.name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        headerShown: true,
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerStyle: {
          backgroundColor: headerBackgroundColor,
        },
        headerShadowVisible: false,
        tabBarButton: HapticTab,
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/profile')}
            style={{
              marginRight: 12,
              width: 34,
              height: 34,
              borderRadius: 17,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.tint,
            }}>
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 34, height: 34 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 34,
                  height: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.tint,
                }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{userInitial}</Text>
              </View>
            )}
          </Pressable>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Fontisto name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="doubts"
        options={{
          title: 'Doubts',
          href: undefined,
          tabBarIcon: ({ color }) => <AntDesign name="message" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="adduser"
        options={{
          href: null,  // isAdmin ? undefined : null,
          title: 'Add User',
          tabBarIcon: ({ color }) => <FontAwesome name="user-plus" size={28} color={color}/>,
        }}
      />
      <Tabs.Screen
        name="notice"
        options={{
          href: null,  // isAdmin ? undefined : null,
          title: 'Notice',
          tabBarIcon: ({ color }) => <FontAwesome6 name="notes-medical" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          href: null,  // isTeacher ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
          href: null,  // isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          href: null,  // isTeacher ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          title: 'Teachers',
          href: null,  // isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="admins"
        options={{
          href: null,  // isAdmin ? undefined : null,
          title: 'Admins',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle.badge.checkmark" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="myattendance"
        options={{
          href: isStudent || isStaff ? undefined : null,
          title: 'Attendance',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle.badge.checkmark" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
