import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="school-register" options={{ headerShown: false }} />
        <Stack.Screen name="school-login" options={{ headerShown: false }} />
        <Stack.Screen name="school-admin-setup" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ title: 'Admin', headerShown: true }} />
        <Stack.Screen name="students" options={{ title: 'Students', headerShown: true }} />
        <Stack.Screen name="subjects" options={{ title: 'Subjects', headerShown: true }} />
        <Stack.Screen name="attendance" options={{ title: 'Attendance', headerShown: true }} />
        <Stack.Screen name="staff" options={{ title: 'Staff', headerShown: true }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile', headerShown: true }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="class-details/[id]"
          options={{
            title: 'Class Details',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="student-details/[id]"
          options={{
            title: 'Student Details',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="attdence-detail/[id]"
          options={{
            title: 'Attendance Details',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="performance/[id]"
          options={{
            title: 'Performance',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="performance/add/[id]"
          options={{
            title: 'Add Performance',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="performance/edit/[progressId]"
          options={{
            title: 'Update Performance',
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
