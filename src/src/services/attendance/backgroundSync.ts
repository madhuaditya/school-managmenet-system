import { Platform } from 'react-native';

import { startAttendanceSync } from './attendanceSyncWorker';
import { logError } from '../logger';

const TASK_NAME = 'attendance-background-sync';

let backgroundSyncConfigured = false;

export const configureAttendanceBackgroundSync = async () => {
  if (backgroundSyncConfigured || Platform.OS === 'web') {
    return;
  }

  try {
    const TaskManager = await import('expo-task-manager');
    const BackgroundFetch = await import('expo-background-fetch');

    if (!TaskManager.isTaskDefined(TASK_NAME)) {
      TaskManager.defineTask(TASK_NAME, async () => {
        try {
          await startAttendanceSync();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          await logError(error);
          console.error('Background attendance sync failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    backgroundSyncConfigured = true;
  } catch (error) {
    await logError(error);
    console.error('Background attendance sync unavailable:', error);
  }
};