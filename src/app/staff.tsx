import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/src/store/auth.store';

export default function StaffScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  if (role !== 'admin') {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title">Staff</ThemedText>
        <ThemedText style={styles.subtitle}>Staff management screen.</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(123, 31, 162, 0.08)',
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.75,
  },
});
