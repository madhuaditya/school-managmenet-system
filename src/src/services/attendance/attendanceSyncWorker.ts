import { useAuthStore } from '@/src/store/auth.store';
import { deleteSyncedItems, getPendingItems, incrementRetry, updateQueueStatus } from '@/src/database/attendanceQueueRepo';

import { uploadAttendance } from './attendanceApi';
import { getRetryDelay } from './retryPolicy';
import { notifyAttendanceRetryScheduled, notifyAttendanceSynced, notifyAttendanceSyncing } from './notifications';
import { AttendanceSubmissionPayload } from './types';
import { logError } from '../logger';

let isSyncing = false;

const parseSubmissionPayload = (payload: string) => JSON.parse(payload) as AttendanceSubmissionPayload;

export const startAttendanceSync = async () => {
  if (isSyncing) {
    return;
  }

  const { accessToken, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !accessToken) {
    return;
  }

  isSyncing = true;

  try {
    const pendingItems = await getPendingItems();

    if (!pendingItems.length) {
      return;
    }

    await notifyAttendanceSyncing();
    let hadFailure = false;

    for (const item of pendingItems) {
      try {
        await updateQueueStatus(item.id, 'SYNCING');
        await uploadAttendance(parseSubmissionPayload(item.payload));
        await updateQueueStatus(item.id, 'SYNCED');
      } catch (error) {
        hadFailure = true;
        const retryCount = Number(item.retry_count || 0) + 1;
        const nextRetryAt = Date.now() + getRetryDelay(retryCount);

        await incrementRetry(item.id, retryCount, nextRetryAt);
        await notifyAttendanceRetryScheduled();
        await logError(error);
        console.error('Attendance sync failed, will retry later:', error);
      }
    }

    await deleteSyncedItems();

    if (!hadFailure) {
      await notifyAttendanceSynced();
    }
  } finally {
    isSyncing = false;
  }
};