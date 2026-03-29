// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole | { _id: string; role: UserRole };
  image?: string;
  school?: string | { _id: string; schoolName: string };
  createdAt?: string;
  updatedAt?: string;
  willExpire?: number | null;
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'staff';

// Student Types
export interface Student extends User {
  studentId?: string;
  sclassId?: string;
  section?: string;
  rollNumber?: number;
  fatherName?: string;
  motherName?: string;
  parentContact?: string;
  dateOfAdmission?: string;
  dateOfBirth?: string;
}

// Teacher Types
export interface Teacher extends User {
  teacherId?: string;
  subjects?: Array<{ _id: string; name: string; code: string }>;
}

// Class Types
export interface Class {
  _id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  room?: string;
  students?: Student[];
  classTeacher?: Teacher;
  subjects?: Subject[];
  school?: string;
}

// Subject Types
export interface Subject {
  _id: string;
  name: string;
  code: string;
  class?: string | { _id: string; name: string };
  teacher?: string | { _id: string; name: string };
  maxMarks?: number;
  school?: string;
}

// Attendance Types
export interface Attendance {
  _id: string;
  userId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  classId?: string;
}

export interface AttendanceRecord {
  studentId: string;
  month: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  percentage: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave';

// Grade/Result Types
export interface Grade {
  _id: string;
  studentId: string;
  subjectId: string;
  type: ProgressType;
  title: string;
  marksObtained: number;
  totalMarks: number;
  academicYear?: string;
  grade?: string;
  date?: string;
}

// Notice Types
export interface Notice {
  _id: string;
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  type?: NoticeType;
  createdAt?: string;
  updatedAt?: string;
}

// Complaint Types
export interface Complaint {
  _id: string;
  title: string;
  description: string;
  complainerName?: string;
  complainerId?: string;
  complainerType?: UserRole;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  response?: string;
}

// Fee Types
export interface Fee {
  _id: string;
  studentId: string;
  studentName?: string;
  month?: string;
  amount: number;
  status?: FeeStatus;
  dueDate?: string;
  paidDate?: string;
}

// Timetable Types
export interface TimeSlot {
  _id?: string;
  startTime: string;
  endTime: string;
  hour?: number;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  subject?: string | { _id: string; name?: string; code?: string };
  roomNumber?: string;
}

export interface Timetable {
  _id: string;
  name?: string;
  school?: string;
  classId?: string;
  class?: string | { _id: string; name?: string; grade?: string | number; section?: string };
  dayOfWeek?: string;
  day?: string;
  slots?: TimeSlot[];
  periods?: TimeSlot[];
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  _id: string;
  refreshToken: string;
  user: User;
  name: string;
  email: string;
  role?: { _id: string; role: UserRole };
  school?: { _id: string; schoolName: string };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Progress Types
export type ProgressType = 'exam' | 'assignment' | 'quiz' | 'project';

// Enum-like types
export type NoticeType = 'general' | 'important' | 'event' | 'announcement';
export type ComplaintStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high';
export type FeeStatus = 'pending' | 'paid' | 'overdue';
