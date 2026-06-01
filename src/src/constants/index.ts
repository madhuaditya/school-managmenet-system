// API Configuration
export const API_BASE_URL = 'http://192.168.0.105:5000/api'  // 'https://school-project-backend-lwzb.onrender.com/api' // process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:5000/api';
export const SOCKET_BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '');
export const API_TIMEOUT = 30000;

// Role-based Navigation
export const ROLE_SCREENS: Record<string, string[]> = {
  admin: ['AdminDashboard', 'ManageStudents', 'ManageTeachers', 'ManageClasses', 'Reports'],
  teacher: ['TeacherDashboard', 'MyClasses', 'Attendance', 'Grades', 'Notices'],
  student: ['StudentDashboard', 'ClassSchedule', 'Attendance', 'Grades', 'Notices', 'Fees'],
  staff: ['StaffDashboard', 'Attendance', 'Notices', 'Profile'],
};

// Status Constants
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LEAVE: 'leave',
} as const;

export const FEE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export const COMPLAINT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// Exam Types
export const EXAM_TYPES = [
  'midterm',
  'final',
  'quiz',
  'assignment',
] as const;

// Notice Types
export const NOTICE_TYPES = [
  'general',
  'important',
  'event',
  'announcement',
] as const;

// Days of Week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

// Grade Scale
export const GRADE_SCALE: Record<number, string> = {
  90: 'A+',
  80: 'A',
  70: 'B+',
  60: 'B',
  50: 'C+',
  40: 'C',
  33: 'D',
  0: 'F',
};

// Attendance Percentage Thresholds
export const ATTENDANCE_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85,
  SATISFACTORY: 75,
  WARNING: 65,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  LAST_LOGIN: 'last_login',
  ONBOARDING_SEEN: 'onboarding_seen',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You do not have permission to access this resource.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  CREATE_SUCCESS: 'Created successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
} as const;
