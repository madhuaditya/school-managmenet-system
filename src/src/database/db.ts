import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'school_app.db';

let dbPromise: Promise<any> | null = null;

export const getAttendanceDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return dbPromise;
};