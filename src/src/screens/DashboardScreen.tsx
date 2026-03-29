import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { User } from '@/src/types';
import { useAuthStore } from '@/src/store/auth.store';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) as User | null;
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await logout();
    router.replace('/');
  };

  const roleLabel =
    typeof user?.role === 'string' ? user.role.toUpperCase() : user?.role?.role?.toUpperCase() || 'USER';

  const currentRole =
    typeof user?.role === 'string' ? user.role : user?.role?.role || 'teacher';

  const quickActions: Array<{
    title: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    route:
      | '/dashboard'
      | '/admin'
      | '/teachers'
      | '/students'
      | '/classes'
      | '/subjects'
      | '/attendance'
      | '/staff';
    roles: Array<'admin' | 'teacher'>;
  }> = [
    { title: 'Home', icon: 'home-variant', route: '/dashboard', roles: ['admin'] },
    { title: 'Admin', icon: 'shield-account', route: '/admin', roles: ['admin'] },
    { title: 'Teacher', icon: 'account-tie', route: '/teachers', roles: ['admin'] },
    { title: 'Student', icon: 'account-school', route: '/students', roles: ['admin', 'teacher'] },
    { title: 'Class', icon: 'google-classroom', route: '/classes', roles: ['admin', 'teacher'] },
    { title: 'Subject', icon: 'book-open-page-variant', route: '/subjects', roles: ['admin', 'teacher'] },
    { title: 'Attendance', icon: 'clipboard-check', route: '/attendance', roles: ['admin', 'teacher'] },
    { title: 'Staff', icon: 'account-hard-hat', route: '/staff', roles: ['admin'] },
  ];

  const visibleActions = quickActions.filter((action) => action.roles.includes(currentRole as 'admin' | 'teacher'));

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
        <Text style={styles.role}>{roleLabel}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {visibleActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              onPress={() => router.push(action.route as never)}
              style={styles.card}>
              <MaterialCommunityIcons name={action.icon} size={30} color="#1976d2" />
              <Text style={styles.cardTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Notices</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>School Notice</Text>
          <Text style={styles.noticeText}>Check back for recent announcements</Text>
          <Text style={styles.noticeDate}>Today</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>School Management System v1.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  header: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
  },
  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noticeDate: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default DashboardScreen;
