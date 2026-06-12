import { Platform } from 'react-native';

const CHANNEL_ID = 'attendance-sync';

let notificationsConfigured = false;

const loadNotificationsModule = async () => import('expo-notifications');

const ensureNotificationsConfigured = async () => {
  if (notificationsConfigured) {
    return;
  }

  const Notifications = await loadNotificationsModule();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Attendance Sync',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  notificationsConfigured = true;
};

export const notifyAttendanceSyncing = async () => {
  try {
    await ensureNotificationsConfigured();
    const Notifications = await loadNotificationsModule();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Attendance Sync',
        body: 'Syncing attendance...',
        sound: false,
        channelId: CHANNEL_ID,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Attendance syncing notification failed:', error);
  }
};

export const notifyAttendanceSynced = async () => {
  try {
    await ensureNotificationsConfigured();
    const Notifications = await loadNotificationsModule();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Attendance Synced',
        body: 'All attendance uploaded',
        sound: false,
        channelId: CHANNEL_ID,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Attendance synced notification failed:', error);
  }
};

export const notifyAttendanceRetryScheduled = async () => {
  try {
    await ensureNotificationsConfigured();
    const Notifications = await loadNotificationsModule();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sync Delayed',
        body: 'Retrying automatically',
        sound: false,
        channelId: CHANNEL_ID,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Attendance retry notification failed:', error);
  }
};