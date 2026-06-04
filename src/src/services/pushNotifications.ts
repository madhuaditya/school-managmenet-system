import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { apiService } from '@/api/client';

const getProjectId = () =>
   '48f61c07-10ce-4385-93d3-930696c3524f';

const isExpoGo = () =>
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

export const canUseRemotePushNotifications = () => Device.isDevice && !isExpoGo();

const loadNotificationsModule = async () => import('expo-notifications');

const configureNotificationHandler = async () => {
  const Notifications = await loadNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!canUseRemotePushNotifications()) {
    return null;
  }

  await configureNotificationHandler();
  const Notifications = await loadNotificationsModule();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  const existingPermissions = (await Notifications.getPermissionsAsync()) as {
    granted?: boolean;
    status?: string;
  };
  let finalGranted = existingPermissions.granted ?? existingPermissions.status === 'granted';
  // console.log('Existing notification permissions:', existingPermissions);

  if (!finalGranted) {
    const requestedPermissions = (await Notifications.requestPermissionsAsync()) as {
      granted?: boolean;
      status?: string;
    };
    finalGranted = requestedPermissions.granted ?? requestedPermissions.status === 'granted';
  }

  if (!finalGranted) {
    return null;
  }

  const projectId = '48f61c07-10ce-4385-93d3-930696c3524f';

  try {
  console.log('Project ID:', projectId);

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log('Expo Push Token Response:', tokenResponse);

  return tokenResponse.data;
} catch (error) {
  console.error('Failed to get Expo push token:', error);
  return null;
}
};

export const syncPushTokenWithServer = async (pushToken: string | null | undefined): Promise<void> => {
  if (!pushToken) return;

  try {
    await apiService.registerPushToken(pushToken);
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
};

export const addPushNotificationResponseListener = async (
  listener: (response: { notification: { request: { content: { data?: { screen?: string; type?: string } } } } }) => void,
) => {
  if (!canUseRemotePushNotifications()) {
    return { remove: () => undefined };
  }

  const Notifications = await loadNotificationsModule();
  return Notifications.addNotificationResponseReceivedListener(listener as never);
};