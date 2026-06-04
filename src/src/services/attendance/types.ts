export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface AttendanceRecord {
  userId: string;
  status: AttendanceStatus;
  remarks?: string;
  classId?: string;
}

export interface AttendanceSubmissionPayload {
  requestId: string;
  classId: string;
  date: string;
  records: AttendanceRecord[];
}

export const normalizeAttendanceDate = (date?: string | null) => {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }

  return String(date).split('T')[0];
};