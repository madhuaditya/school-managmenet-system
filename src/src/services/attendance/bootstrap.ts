import { resetInterruptedSyncItems } from '@/src/database/attendanceQueueRepo';
import { runAttendanceMigrations } from '@/src/database/migrations';

import { configureAttendanceBackgroundSync } from './backgroundSync';
import { configureAttendanceNetworkListener } from './networkManager';
import { startAttendanceSync } from './attendanceSyncWorker';

let initialized = false;

export const initializeAttendanceRuntime = async () => {
  if (initialized) {
    return;
  }

  initialized = true;

  await runAttendanceMigrations();
  await resetInterruptedSyncItems();
  configureAttendanceNetworkListener();
  void configureAttendanceBackgroundSync();
  void startAttendanceSync();
};