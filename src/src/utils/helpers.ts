import { GRADE_SCALE, ATTENDANCE_THRESHOLDS } from '@/src/constants/index';

// String utilities
export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map((word) => capitalizeFirstLetter(word.toLowerCase()))
    .join(' ');
};

// Number utilities
export const calculatePercentage = (marks: number, totalMarks: number): number => {
  if (totalMarks === 0) return 0;
  return Math.round((marks / totalMarks) * 100);
};

export const getGrade = (percentage: number): string => {
  for (const [threshold, grade] of Object.entries(GRADE_SCALE)) {
    if (percentage >= parseInt(threshold)) {
      return grade;
    }
  }
  return 'F';
};

// Date utilities
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const isAM = hour < 12;
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${isAM ? 'AM' : 'PM'}`;
};

export const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

export const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Attendance utilities
export const getAttendancePercentage = (presentDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
};

export const getAttendanceStatus = (percentage: number): string => {
  if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return 'Excellent';
  if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return 'Good';
  if (percentage >= ATTENDANCE_THRESHOLDS.SATISFACTORY) return 'Satisfactory';
  if (percentage >= ATTENDANCE_THRESHOLDS.WARNING) return 'Warning';
  return 'Critical';
};

// Color utilities
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    present: '#4CAF50',
    absent: '#F44336',
    leave: '#FF9800',
    paid: '#4CAF50',
    pending: '#FF9800',
    overdue: '#F44336',
    open: '#2196F3',
    'in-progress': '#FF9800',
    resolved: '#4CAF50',
    closed: '#9E9E9E',
  };
  return colors[status.toLowerCase()] || '#757575';
};

export const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A+': '#4CAF50',
    A: '#66BB6A',
    'B+': '#81C784',
    B: '#A5D6A7',
    'C+': '#FFB74D',
    C: '#FFD54F',
    D: '#FF8A65',
    F: '#F44336',
  };
  return colors[grade] || '#757575';
};

export const getAttendanceColor = (percentage: number): string => {
  if (percentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return '#4CAF50';
  if (percentage >= ATTENDANCE_THRESHOLDS.GOOD) return '#66BB6A';
  if (percentage >= ATTENDANCE_THRESHOLDS.SATISFACTORY) return '#FFB74D';
  if (percentage >= ATTENDANCE_THRESHOLDS.WARNING) return '#FF8A65';
  return '#F44336';
};

// Error message utilities
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
};

// Array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T>(
  array: T[],
  key: keyof T,
): Record<string, T[]> => {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
};

// Debounce utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};
