import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from '@/src/screens/LoginScreen';
import { useAuthStore } from '@/src/store/auth.store';

export default function IndexRoute() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const willExpire = useAuthStore((state) => state.willExpire);

  useEffect(() => {
    // console.log('Checking authentication status on app launch...');
    // console.log('isAuthenticated:', isAuthenticated);
    // console.log('willExpire:', willExpire);
    if (isAuthenticated && Date.now() < (willExpire??0)) {
      // console.log('User is authenticated, navigating to dashboard...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, willExpire, router]);

  if (isAuthenticated && willExpire && Date.now() < willExpire) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return <LoginScreen />;
}
