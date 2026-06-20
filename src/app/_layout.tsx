import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect,useCallback, useRef, useState } from 'react';
import { Alert,  Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/src/constants';
import { getAllowedRolesForPath, PUBLIC_PATHS } from '@/src/constants/accessControl';
import { initializeAttendanceRuntime, startAttendanceSync } from '@/src/services/attendance';
import {  logError } from '@/src/services/logger';
import {
  addPushNotificationResponseListener,
  canUseRemotePushNotifications,
  registerForPushNotificationsAsync,
  syncPushTokenWithServer,
} from '@/src/services/pushNotifications';
import { useAuthStore } from '@/src/store/auth.store';
import { useChatStore } from '@/src/store/chat.store';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import BubbleBackground from '@/components/BubbleBackground';

const colors = {
  bg: '#F5F5F5',
  card: '#FFFFFF',
  primary: '#76ABAE',
  accent: '#FF5722',
  text: '#303841',
  border: '#E6E6E6',
  muted: '#6B7280',
};

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const pushTokenRef = useRef<string | null>(null);
  const pushPromptHandledRef = useRef<string | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const initializeChatSocket = useChatStore((state) => state.initializeSocket);
  const disconnectChatSocket = useChatStore((state) => state.disconnectSocket);

  const [pushPromptVisible, setPushPromptVisible] = useState(false);
  const [pushPromptLoading, setPushPromptLoading] = useState(false);

  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const checkBackendHealth = useCallback(async () => {
        try {
          const response = await fetch(
            'https://school-project-backend-lwzb.onrender.com/health'
          );
          const data = await response.json();
          console.log('Backend Health:', data);
        } catch (error) {
          console.error('Health Check Failed:', error);
        }
      }, []);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);


  useEffect(() => {
    void initializeAttendanceRuntime();
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      void startAttendanceSync();
    }
  }, [accessToken, isAuthenticated]);

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
    if (!isAuthenticated || !accessToken) {
      pushTokenRef.current = null;
      pushPromptHandledRef.current = null;
      setPushPromptVisible(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    let active = true;

    const evaluatePushPrompt = async () => {
      const userId = user?._id;
      if (!isAuthenticated || !accessToken || !userId) {
        return;
      }

      const promptKey = `${STORAGE_KEYS.PUSH_NOTIFICATION_PROMPT_PREFIX}:${userId}`;
      if (pushPromptHandledRef.current === promptKey) {
        return;
      }

      pushPromptHandledRef.current = promptKey;

      try {
        const storedDecision = await AsyncStorage.getItem(promptKey);
        if (!active) return;

        if (storedDecision === 'accepted') {
          setPushPromptVisible(false);

          if (canUseRemotePushNotifications()) {
            const pushToken = await registerForPushNotificationsAsync();
            if (!active || !pushToken || pushTokenRef.current === pushToken) {
              return;
            }

            await syncPushTokenWithServer(pushToken);
            pushTokenRef.current = pushToken;
          }

          return;
        }

        if (storedDecision === 'declined') {
          setPushPromptVisible(false);
          return;
        }

        if (canUseRemotePushNotifications()) {
          setPushPromptVisible(true);
        }
      } catch (error) {
        await logError(error);
        console.error('Failed to evaluate push notification prompt:', error);
      }
    };

    void evaluatePushPrompt();

    return () => {
      active = false;
    };
  }, [accessToken, isAuthenticated, user?._id]);

  const persistPushPromptDecision = async (decision: 'accepted' | 'declined') => {
    const userId = user?._id;
    if (!userId) {
      return;
    }

    const promptKey = `${STORAGE_KEYS.PUSH_NOTIFICATION_PROMPT_PREFIX}:${userId}`;
    await AsyncStorage.setItem(promptKey, decision);
  };

  const handleEnablePushNotifications = async () => {
    try {
      setPushPromptLoading(true);

      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) {
        await persistPushPromptDecision('declined');
        setPushPromptVisible(false);
        Alert.alert('Notifications unavailable', 'Push notifications could not be enabled on this device.');
        return;
      }

      if (pushTokenRef.current !== pushToken) {
        await syncPushTokenWithServer(pushToken);
        pushTokenRef.current = pushToken;
      }

      await persistPushPromptDecision('accepted');
      setPushPromptVisible(false);
    } catch (error) {
      console.error('Push notification setup failed:', error);
      await logError(error);
      Alert.alert('Notification setup failed', 'We could not register this device for notifications right now.');
    } finally {
      setPushPromptLoading(false);
    }
  };

  const handleDeclinePushNotifications = async () => {
    try {
      await persistPushPromptDecision('declined');
    } catch (error) {
      await logError(error);
      console.error('Failed to store push notification decision:', error);
    } finally {
      setPushPromptVisible(false);
    }
  };
  

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


const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F5',
    card: '#FFFFFF',
    primary: '#76ABAE',
    text: '#303841',
    border: '#E6E6E6',
  },
};

  // return (
  //   <SafeAreaProvider initialMetrics={initialWindowMetrics}>
  //       <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom', 'left', 'right']}>
  //         <ThemeProvider value={customTheme}>
  //           <Stack
  //             screenOptions={{
  //               headerStyle: {
  //                 backgroundColor: colors.card,
  //               },
  //               headerTintColor: colors.text,
  //               headerTitleStyle: {
  //                 fontSize: 18,
  //                 fontWeight: '600',
  //               },
  //               headerShadowVisible: false,
  //               contentStyle: {
  //                 backgroundColor: colors.bg,
  //               },
  //             }}
  //           >
  //             <Stack.Screen name="index" options={{ headerShown: false }} />
  //             <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  //             <Stack.Screen name="school-admin-setup" options={{ headerShown: false }} />
  //             <Stack.Screen name="dashboard" options={{ headerShown: false }} />
  //             <Stack.Screen name="about" options={{ title: 'About' }} />
  //             <Stack.Screen name="contact" options={{ title: 'Contact' }} />
  //             <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
  //             <Stack.Screen name="chat/[conversationId]" options={{ title: 'Chat' }} />
  //             <Stack.Screen name="chat/contacts" options={{ title: 'New Chat' }} />
  //             <Stack.Screen name="chat/new-group" options={{ title: 'New Group' }} />

  //             <Stack.Screen name="admin" options={{ title: 'Admin' }} />
  //             <Stack.Screen name="students" options={{ title: 'Students' }} />
  //             <Stack.Screen name="subjects" options={{ title: 'Subjects' }} />
  //             <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
  //             <Stack.Screen name="staff" options={{ title: 'Staff' }} />
  //             <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
  //             <Stack.Screen name="salary-structure" options={{ title: 'Salary Structure' }} />
  //             <Stack.Screen name="salary-records" options={{ title: 'Salary Records' }} />
  //             <Stack.Screen name="salary-payments" options={{ title: 'Salary Payments' }} />
  //             <Stack.Screen name="my-salary" options={{ title: 'My Salary' }} />
  //             <Stack.Screen name="fee-structure" options={{ title: 'Fee Structure' }} />
  //             <Stack.Screen name="fee-records" options={{ title: 'Fee Records' }} />
  //             <Stack.Screen name="fee-payments" options={{ title: 'Fee Payments' }} />
  //             <Stack.Screen name="my-fee" options={{ title: 'My Fee' }} />

  //             <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />

  //             <Stack.Screen name="class-details/[id]" options={{ title: 'Class Details' }} />
  //             <Stack.Screen name="student-details/[id]" options={{ title: 'Student Details' }} />
  //             <Stack.Screen name="attdence-detail/[id]" options={{ title: 'Attendance Details' }} />
  //             <Stack.Screen name="performance/[id]" options={{ title: 'Performance' }} />
  //             <Stack.Screen name="performance/add/[id]" options={{ title: 'Add Performance' }} />
  //             <Stack.Screen name="performance/edit/[progressId]" options={{ title: 'Update Performance' }} />
  //           </Stack>

  //          <StatusBar style="dark" />

  //           <Modal
  //             transparent
  //             visible={pushPromptVisible}
  //             animationType="fade"
  //             onRequestClose={handleDeclinePushNotifications}
  //           >
  //             <View style={styles.modalBackdrop}>
  //               <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
  //                 <Text style={[styles.modalTitle, { color: colors.text }]}>Enable notifications?</Text>
  //                 <Text style={[styles.modalBody, { color: colors.text }]}>Allow this app to register your device for attendance and school updates.</Text>

  //                 <View style={styles.modalActions}>
  //                   <Pressable
  //                     onPress={handleDeclinePushNotifications}
  //                     style={({ pressed }) => [styles.modalSecondaryButton, { borderColor: colors.border }, pressed && styles.modalPressed]}
  //                   >
  //                     <Text style={[styles.modalSecondaryText, { color: colors.text }]}>Not now</Text>
  //                   </Pressable>

  //                   <Pressable
  //                     onPress={handleEnablePushNotifications}
  //                     disabled={pushPromptLoading}
  //                     style={({ pressed }) => [styles.modalPrimaryButton, pressed && styles.modalPressed, pushPromptLoading && styles.modalDisabled]}
  //                   >
  //                     <Text style={styles.modalPrimaryText}>{pushPromptLoading ? 'Enabling...' : 'Allow'}</Text>
  //                   </Pressable>
  //                 </View>
  //               </View>
  //             </View>
  //           </Modal>
  //         </ThemeProvider>
  //       </SafeAreaView>
  //   </SafeAreaProvider>
  // );

  return (
  <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <SafeAreaView
      style={styles.container}
      edges={['bottom', 'left', 'right']}
    >
      <ThemeProvider value={customTheme}>
        <>
  <View style={{ flex: 1 }}>
    <BubbleBackground />

        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#303841',
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#F5F5F5',
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="school-admin-setup"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="dashboard"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="about"
            options={{ title: 'About' }}
          />

          <Stack.Screen
            name="contact"
            options={{ title: 'Contact' }}
          />

          <Stack.Screen
            name="feedback"
            options={{ title: 'Feedback' }}
          />

          <Stack.Screen
            name="chat/[conversationId]"
            options={{ title: 'Chat' }}
          />

          <Stack.Screen
            name="chat/contacts"
            options={{ title: 'New Chat' }}
          />

          <Stack.Screen
            name="chat/new-group"
            options={{ title: 'New Group' }}
          />

          <Stack.Screen
            name="admin"
            options={{ title: 'Admin' }}
          />

          <Stack.Screen
            name="students"
            options={{ title: 'Students' }}
          />

          <Stack.Screen
            name="subjects"
            options={{ title: 'Subjects' }}
          />
          <Stack.Screen
            name="subjects/updateMarks"
            options={{ title: 'Performance' }}
          />

          <Stack.Screen
            name="attendance"
            options={{ title: 'Attendance' }}
          />

          <Stack.Screen
            name="staff"
            options={{ title: 'Staff' }}
          />

          <Stack.Screen
            name="profile"
            options={{ title: 'My Profile' }}
          />

          <Stack.Screen
            name="salary-structure"
            options={{ title: 'Salary Structure' }}
          />

          <Stack.Screen
            name="salary-records"
            options={{ title: 'Salary Records' }}
          />

          <Stack.Screen
            name="salary-payments"
            options={{ title: 'Salary Payments' }}
          />

          <Stack.Screen
            name="my-salary"
            options={{ title: 'My Salary' }}
          />

          <Stack.Screen
            name="fee-structure"
            options={{ title: 'Fee Structure' }}
          />

          <Stack.Screen
            name="fee-records"
            options={{ title: 'Fee Records' }}
          />

          <Stack.Screen
            name="fee-payments"
            options={{ title: 'Fee Payments' }}
          />

          <Stack.Screen
            name="my-fee"
            options={{ title: 'My Fee' }}
          />

          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
            }}
          />

          <Stack.Screen
            name="class-details/[id]"
            options={{
              title: 'Class Details',
            }}
          />

          <Stack.Screen
            name="student-details/[id]"
            options={{
              title: 'Student Details',
            }}
          />

          <Stack.Screen
            name="attdence-detail/[id]"
            options={{
              title: 'Attendance Details',
            }}
          />

          <Stack.Screen
            name="performance/[id]"
            options={{
              title: 'Performance',
            }}
          />

          <Stack.Screen
            name="performance/add/[id]"
            options={{
              title: 'Add Performance',
            }}
          />

          <Stack.Screen
            name="performance/edit/[progressId]"
            options={{
              title: 'Update Performance',
            }}
          />
        </Stack>
  </View>
</>


        <StatusBar style="dark" />

        {/* <Modal
          transparent
          visible={pushPromptVisible}
          animationType="fade"
          onRequestClose={handleDeclinePushNotifications}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Enable Notifications
              </Text>

              <Text style={styles.modalBody}>
                Stay updated with attendance alerts,
                announcements, salary updates, fee reminders,
                and important school notifications.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={handleDeclinePushNotifications}
                  style={({ pressed }) => [
                    styles.modalSecondaryButton,
                    pressed && styles.modalPressed,
                  ]}
                >
                  <Text style={styles.modalSecondaryText}>
                    Not Now
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleEnablePushNotifications}
                  disabled={pushPromptLoading}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    pressed && styles.modalPressed,
                    pushPromptLoading &&
                      styles.modalDisabled,
                  ]}
                >
                  <Text style={styles.modalPrimaryText}>
                    {pushPromptLoading
                      ? 'Enabling...'
                      : 'Allow'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal> */}
        <Modal
          transparent
          visible={pushPromptVisible}
          animationType="fade"
          onRequestClose={handleDeclinePushNotifications}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>

              <View style={styles.modalIconWrapper}>
                <Text
                  style={{
                    fontSize: 24,
                    color: '#76ABAE',
                  }}
                >
                  🔔
                </Text>
              </View>

              <Text style={styles.modalTitle}>
                Enable Notifications
              </Text>

              <Text style={styles.modalBody}>
                Receive attendance alerts, fee reminders,
                salary updates, announcements and important
                school notifications instantly on your device.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={handleDeclinePushNotifications}
                  style={({ pressed }) => [
                    styles.modalSecondaryButton,
                    pressed && styles.modalPressed,
                  ]}
                >
                  <Text style={styles.modalSecondaryText}>
                    Not Now
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleEnablePushNotifications}
                  disabled={pushPromptLoading}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    pressed && styles.modalPressed,
                    pushPromptLoading && styles.modalDisabled,
                  ]}
                >
                  <Text style={styles.modalPrimaryText}>
                    {pushPromptLoading
                      ? 'Enabling...'
                      : 'Allow'}
                  </Text>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>
      </ThemeProvider>
    </SafeAreaView>
  </SafeAreaProvider>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  flex: {
    flex: 1,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(48,56,65,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 400,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E6E6E6',

    borderRadius: 8,

    paddingVertical: 24,
    paddingHorizontal: 22,

    shadowColor: '#303841',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.12,
    shadowRadius: 30,

    elevation: 10,
  },

  modalIconWrapper: {
    width: 56,
    height: 56,

    backgroundColor: 'rgba(118,171,174,0.12)',

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 8,

    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#303841',
    marginBottom: 10,
  },

  modalBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#303841',
    opacity: 0.82,
    marginBottom: 24,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },

  modalSecondaryButton: {
    flex: 1,

    backgroundColor: '#F5F5F5',

    borderWidth: 1,
    borderColor: '#E6E6E6',

    borderRadius: 6,

    paddingVertical: 13,

    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSecondaryText: {
    color: '#303841',
    fontSize: 14,
    fontWeight: '600',
  },

  modalPrimaryButton: {
    flex: 1,

    backgroundColor: '#FF5722',

    borderRadius: 6,

    paddingVertical: 13,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#FF5722',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,

    elevation: 5,
  },

  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  modalPressed: {
    opacity: 0.88,
  },

  modalDisabled: {
    opacity: 0.5,
  },
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   flex: {
//     flex: 1,
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(15,23,42,0.58)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   modalCard: {
//     width: '100%',
//     maxWidth: 360,
//     borderRadius: 20,
//     borderWidth: 1,
//     padding: 20,
//     gap: 14,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '800',
//   },
//   modalBody: {
//     fontSize: 14,
//     lineHeight: 20,
//     opacity: 0.9,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     gap: 12,
//     justifyContent: 'flex-end',
//   },
//   modalSecondaryButton: {
//     borderWidth: 1,
//     borderRadius: 14,
//     paddingHorizontal: 16,
//     paddingVertical: 11,
//     minWidth: 96,
//     alignItems: 'center',
//   },
//   modalSecondaryText: {
//     fontWeight: '700',
//   },
//   modalPrimaryButton: {
//     borderRadius: 14,
//     paddingHorizontal: 16,
//     paddingVertical: 11,
//     minWidth: 96,
//     alignItems: 'center',
//     backgroundColor: '#2563EB',
//   },
//   modalPrimaryText: {
//     color: '#fff',
//     fontWeight: '800',
//   },
//   modalPressed: {
//     opacity: 0.88,
//   },
//   modalDisabled: {
//     opacity: 0.6,
//   },
// });