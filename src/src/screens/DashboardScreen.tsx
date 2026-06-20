import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  useColorScheme,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { User } from '@/src/types';
import { useAuthStore } from '@/src/store/auth.store';

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

const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) as User | null;
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await logout();
    router.replace('/feedback');
  };

  const roleLabel =
    typeof user?.role === 'string' ? user.role.toUpperCase() : user?.role?.role?.toUpperCase() || 'USER';

  const currentRole =
    typeof user?.role === 'string' ? user.role : user?.role?.role || 'teacher';

  const quickActions = [
    { title: 'Home', icon: 'home-variant', route: '/dashboard', roles: ['admin'] },
    { title: 'Admin', icon: 'shield-account', route: '/admin', roles: ['admin'] },
    { title: 'Teacher', icon: 'account-tie', route: '/teachers', roles: ['admin'] },
    { title: 'Student', icon: 'account-school', route: '/students', roles: ['admin', 'teacher'] },
    { title: 'Class', icon: 'google-classroom', route: '/classes', roles: ['admin', 'teacher'] },
    { title: 'Subject', icon: 'book-open-page-variant', route: '/subjects', roles: ['admin', 'teacher'] },
    { title: 'Attendance', icon: 'clipboard-check', route: '/attendance', roles: ['admin', 'teacher'] },
    { title: 'Staff', icon: 'account-hard-hat', route: '/staff', roles: ['admin'] },
  ];

  const visibleActions = quickActions.filter((a) =>
    a.roles.includes(currentRole as 'admin' | 'teacher')
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
        <Text style={styles.role}>{roleLabel}</Text>
      </View>

      {/* ACTIONS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

        <View style={styles.grid}>
          {visibleActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              onPress={() => router.push(action.route as never)}
              style={[styles.card, { backgroundColor: colors.card }]}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={26}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* NOTICE */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Notices</Text>

        <View style={[styles.noticeCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.noticeTitle, { color: colors.text }]}>
            School Notice
          </Text>
          <Text style={[styles.noticeText, { color: colors.subText }]}>
            Check back for recent announcements
          </Text>
          <Text style={[styles.noticeDate, { color: colors.subText }]}>
            Today
          </Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: '#EF4444' }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.subText }]}>
          School Management System v1.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },

  role: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 4,
  },

  iconBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  noticeCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },

  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  noticeText: {
    fontSize: 14,
    marginBottom: 6,
  },

  noticeDate: {
    fontSize: 12,
  },

  logoutButton: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },

  footerText: {
    fontSize: 12,
  },
});

export default DashboardScreen;