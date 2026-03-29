import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import DashboardScreen from '@/src/screens/DashboardScreen';
import { useAuthStore } from '@/src/store/auth.store';

export default function DashboardRoute() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <DashboardScreen />;
}
