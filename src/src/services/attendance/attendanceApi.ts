import { apiService } from '@/api/client';
import { AttendanceSubmissionPayload } from './types';

export const uploadAttendance = async (payload: AttendanceSubmissionPayload) => {
  const response = await apiService.bulkMarkAttendance(payload);

  if (!response.success) {
    throw new Error(response.msg || 'Failed to upload attendance');
  }

  return response;
};