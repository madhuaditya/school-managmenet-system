import { addQueueItem, getLatestQueuedAttendanceSnapshot } from '@/src/database/attendanceQueueRepo';

import { startAttendanceSync } from './attendanceSyncWorker';
import { AttendanceRecord, AttendanceSubmissionPayload, normalizeAttendanceDate } from './types';

const createRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const submitAttendance = async (records: AttendanceRecord[], classId: string, date?: string | null) => {
  const requestId = createRequestId();
  const resolvedDate = normalizeAttendanceDate(date);

  const payload: AttendanceSubmissionPayload = {
    requestId,
    classId,
    date: resolvedDate,
    records,
  };

  await addQueueItem({
    id: requestId,
    requestId,
    classId,
    date: resolvedDate,
    payload,
  });

  void startAttendanceSync();

  return payload;
};

export const getQueuedAttendanceSnapshot = async (classId: string, date?: string | null) => {
  if (!date) {
    return null;
  }

  return getLatestQueuedAttendanceSnapshot(classId, normalizeAttendanceDate(date));
};