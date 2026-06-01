import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllowedRolesForPath, PUBLIC_PATHS } from '@/src/constants/accessControl';
import { useAuthStore } from '@/src/store/auth.store';
import { useChatStore } from '@/src/store/chat.store';
import {
  addPushNotificationResponseListener,
  canUseRemotePushNotifications,
  registerForPushNotificationsAsync,
  syncPushTokenWithServer,
} from '@/src/services/pushNotifications';

const lightColors = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  primary: "#2563EB",
  text: "#111827",
  border: "#E5E7EB"
};

const darkColors = {
  bg: "#0F172A",
  card: "#1E293B",
  primary: "#3B82F6",
  text: "#E5E7EB",
  border: "#334155"
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const pushTokenRef = useRef<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const initializeChatSocket = useChatStore((state) => state.initializeSocket);
  const disconnectChatSocket = useChatStore((state) => state.disconnectSocket);

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  useEffect(() => {
    const allowedRoles = getAllowedRolesForPath(pathname);
    if (!allowedRoles) return;

    if (!isAuthenticated && !PUBLIC_PATHS.has(pathname)) {
      router.replace('/');
      return;
    }

    if (!role || !allowedRoles.includes(role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, pathname, role, router]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initializeChatSocket(accessToken);
      return;
    }
    disconnectChatSocket();
  }, [accessToken, disconnectChatSocket, initializeChatSocket, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !canUseRemotePushNotifications()) {
      pushTokenRef.current = null;
      return;
    }

    let active = true;

    const registerPushToken = async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (!active || !pushToken || pushTokenRef.current === pushToken) {
          return;
        }

        await syncPushTokenWithServer(pushToken);
        pushTokenRef.current = pushToken;
      } catch (error) {
        console.warn('Push notification setup failed:', error);
      }
    };

    void registerPushToken();

    return () => {
      active = false;
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    void addPushNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === 'my-alerts' || data?.type === 'alert') {
        router.push('/my-alerts');
      }
    }).then((nextSubscription) => {
      subscription = nextSubscription;
    });

    return () => {
      subscription?.remove();
    };
  }, [router]);

  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const CustomTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.card,
      primary: colors.primary,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <ThemeProvider value={CustomTheme}>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.card,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                fontSize: 18,
                fontWeight: '600',
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: colors.bg,
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="school-admin-setup" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ title: 'About' }} />
            <Stack.Screen name="contact" options={{ title: 'Contact' }} />
            <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
            <Stack.Screen name="chat/[conversationId]" options={{ title: 'Chat' }} />
            <Stack.Screen name="chat/contacts" options={{ title: 'New Chat' }} />
            <Stack.Screen name="chat/new-group" options={{ title: 'New Group' }} />

            <Stack.Screen name="admin" options={{ title: 'Admin' }} />
            <Stack.Screen name="students" options={{ title: 'Students' }} />
            <Stack.Screen name="subjects" options={{ title: 'Subjects' }} />
            <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
            <Stack.Screen name="staff" options={{ title: 'Staff' }} />
            <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
            <Stack.Screen name="salary-structure" options={{ title: 'Salary Structure' }} />
            <Stack.Screen name="salary-records" options={{ title: 'Salary Records' }} />
            <Stack.Screen name="salary-payments" options={{ title: 'Salary Payments' }} />
            <Stack.Screen name="my-salary" options={{ title: 'My Salary' }} />
            <Stack.Screen name="fee-structure" options={{ title: 'Fee Structure' }} />
            <Stack.Screen name="fee-records" options={{ title: 'Fee Records' }} />
            <Stack.Screen name="fee-payments" options={{ title: 'Fee Payments' }} />
            <Stack.Screen name="my-fee" options={{ title: 'My Fee' }} />

            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />

            <Stack.Screen
              name="class-details/[id]"
              options={{ title: 'Class Details' }}
            />
            <Stack.Screen
              name="student-details/[id]"
              options={{ title: 'Student Details' }}
            />
            <Stack.Screen
              name="attdence-detail/[id]"
              options={{ title: 'Attendance Details' }}
            />
            <Stack.Screen
              name="performance/[id]"
              options={{ title: 'Performance' }}
            />
            <Stack.Screen
              name="performance/add/[id]"
              options={{ title: 'Add Performance' }}
            />
            <Stack.Screen
              name="performance/edit/[progressId]"
              options={{ title: 'Update Performance' }}
            />
          </Stack>

          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    // Ensures button stays safely above the device's bottom notch/gesture bar
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});