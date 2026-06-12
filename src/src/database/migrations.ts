import { getAttendanceDb } from './db';

export const runAttendanceMigrations = async () => {
  const db = await getAttendanceDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS attendance_queue (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      attendance_date TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      retry_count INTEGER NOT NULL DEFAULT 0,
      next_retry_at INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_queue_status_retry
      ON attendance_queue(status, next_retry_at, created_at);

    CREATE INDEX IF NOT EXISTS idx_attendance_queue_class_date
      ON attendance_queue(class_id, attendance_date, updated_at);
  `);
};