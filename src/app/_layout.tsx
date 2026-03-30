import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
        <Stack.Screen name="school-register" options={{ headerShown: false }} />
        <Stack.Screen name="school-login" options={{ headerShown: false }} />
        <Stack.Screen name="school-admin-setup" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />

        <Stack.Screen name="admin" options={{ title: 'Admin' }} />
        <Stack.Screen name="students" options={{ title: 'Students' }} />
        <Stack.Screen name="subjects" options={{ title: 'Subjects' }} />
        <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
        <Stack.Screen name="staff" options={{ title: 'Staff' }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile' }} />

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
  );
}