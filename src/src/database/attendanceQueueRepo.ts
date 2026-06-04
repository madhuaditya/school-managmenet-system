import { getAttendanceDb } from './db';
import { AttendanceSubmissionPayload, normalizeAttendanceDate } from '@/src/services/attendance/types';

export interface AttendanceQueueRow {
  id: string;
  request_id: string;
  class_id: string;
  attendance_date: string;
  payload: string;
  status: string;
  retry_count: number;
  next_retry_at: number;
  created_at: number;
  updated_at: number;
}

export interface AttendanceQueueInsertItem {
  id: string;
  requestId: string;
  classId: string;
  date: string;
  payload: AttendanceSubmissionPayload;
}

const parsePayload = (payload: string) => {
  try {
    return JSON.parse(payload) as AttendanceSubmissionPayload;
  } catch {
    return null;
  }
};

export const addQueueItem = async (item: AttendanceQueueInsertItem) => {
  const db = await getAttendanceDb();
  const now = Date.now();

  await db.runAsync(
    `
      INSERT OR REPLACE INTO attendance_queue (
        id,
        request_id,
        class_id,
        attendance_date,
        payload,
        status,
        retry_count,
        next_retry_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      item.id,
      item.requestId,
      item.classId,
      normalizeAttendanceDate(item.date),
      JSON.stringify(item.payload),
      'PENDING',
      0,
      0,
      now,
      now,
    ],
  );
};

export const getPendingItems = async (limit = 10): Promise<AttendanceQueueRow[]> => {
  const db = await getAttendanceDb();
  return (await db.getAllAsync(
    `
      SELECT *
      FROM attendance_queue
      WHERE status IN ('PENDING', 'FAILED')
        AND next_retry_at <= ?
      ORDER BY created_at ASC
      LIMIT ?
    `,
    [Date.now(), limit],
  )) as AttendanceQueueRow[];
};

export const updateQueueStatus = async (id: string, status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED') => {
  const db = await getAttendanceDb();

  await db.runAsync(
    `
      UPDATE attendance_queue
      SET status = ?,
          updated_at = ?
      WHERE id = ?
    `,
    [status, Date.now(), id],
  );
};

export const incrementRetry = async (id: string, retryCount: number, nextRetryAt: number) => {
  const db = await getAttendanceDb();

  await db.runAsync(
    `
      UPDATE attendance_queue
      SET retry_count = ?,
          next_retry_at = ?,
          status = 'FAILED',
          updated_at = ?
      WHERE id = ?
    `,
    [retryCount, nextRetryAt, Date.now(), id],
  );
};

export const deleteSyncedItems = async () => {
  const db = await getAttendanceDb();

  await db.runAsync(
    `
      DELETE FROM attendance_queue
      WHERE status = 'SYNCED'
    `,
  );
};

export const resetInterruptedSyncItems = async () => {
  const db = await getAttendanceDb();

  await db.runAsync(
    `
      UPDATE attendance_queue
      SET status = 'PENDING',
          updated_at = ?
      WHERE status = 'SYNCING'
    `,
    [Date.now()],
  );
};

export const getLatestQueuedAttendanceSnapshot = async (classId: string, date: string) => {
  const db = await getAttendanceDb();
  const rows = (await db.getAllAsync(
    `
      SELECT payload
      FROM attendance_queue
      WHERE class_id = ?
        AND attendance_date = ?
        AND status IN ('PENDING', 'FAILED', 'SYNCING')
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `,
    [classId, normalizeAttendanceDate(date)],
  )) as Array<{ payload: string }>;

  if (!rows.length) {
    return null;
  }

  return parsePayload(rows[0].payload);
};