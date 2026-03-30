import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, useColorScheme } from 'react-native';
import LoginScreen from '@/src/screens/LoginScreen';
import { useAuthStore } from '@/src/store/auth.store';

const lightColors = {
  bg: "#F9FAFB",
  primary: "#2563EB",
};

const darkColors = {
  bg: "#0F172A",
  primary: "#3B82F6",
};

export default function IndexRoute() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const willExpire = useAuthStore((state) => state.willExpire);
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    if (isAuthenticated && Date.now() < (willExpire ?? 0)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, willExpire, router]);

  if (isAuthenticated && willExpire && Date.now() < willExpire) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return <LoginScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});