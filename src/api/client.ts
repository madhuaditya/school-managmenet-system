import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '@/src/constants/index';
import { ApiResponse, AuthResponse, Attendance, Class, Complaint, Fee, Grade, Notice, Student, Subject, Teacher, Timetable, User } from '@/src/types';
import {useAuthStore} from '@/src/store/auth.store';
type RefreshResponse = ApiResponse<{ accessToken: string }>;

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = useAuthStore.getState().accessToken;
      // console.log('Attaching token to request:', token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
        return Promise.reject(this.normalizeError(error));
      },
    );
  }

  private normalizeError(error: AxiosError): Error {
    const messageFromServer = (error.response?.data as { msg?: string; error?: string } | undefined)?.msg;
    const fallback = (error.response?.data as { msg?: string; error?: string } | undefined)?.error;
    const message = messageFromServer || fallback || error.message || 'Request failed';
    return new Error(message);
  }

  private async getAuthConfig(params?: Record<string, unknown>) {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    return {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  }

  private async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const config = await this.getAuthConfig(params);
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  private async post<T>(url: string, data?: unknown): Promise<T> {
    const config = await this.getAuthConfig();
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  private async put<T>(url: string, data?: unknown): Promise<T> {
    const config = await this.getAuthConfig();
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  private async del<T>(url: string): Promise<T> {
    const config = await this.getAuthConfig();
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Authentication APIs
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.post('/auth/login', { email, password });
  }

  async register(userData: Record<string, unknown>): Promise<ApiResponse<{ userId: string }>> {
    return this.post('/auth/register', userData);
  }

  async registerSchool(payload: {
    schoolId: string;
    email: string;
    password: string;
    schoolName: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    role: string;
  }): Promise<ApiResponse<{ schoolId: string }>> {
    return this.post('/auth/school/register', payload);
  }

  async loginSchool(email: string, password: string): Promise<
    ApiResponse<{
      school: { _id: string; email: string; schoolName: string; image?: string; role?: { _id: string; role: string } };
      token: string;
      refreshToken: string;
    }>
  > {
    return this.post('/auth/school/login', { email, password });
  }

  async registerAdminBySchool(
    token: string,
    payload: {
      name: string;
      email?: string;
      phone?: string;
      password: string;
      school: string;
      address?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      image?: string;
    },
  ): Promise<ApiResponse<{ userId: string }>> {
    const response = await this.client.post<ApiResponse<{ userId: string }>>(
      '/auth/register',
      {
        ...payload,
        role: 'admin',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    return this.post('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken: string): Promise<ApiResponse<null>> {
    return this.post('/auth/logout', { refreshToken });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    return this.post('/auth/change-password', { oldPassword, newPassword });
  }

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    return this.post('/auth/forgot-password', { email });
  }

  async forgotSchoolPassword(email: string): Promise<ApiResponse<null>> {
    return this.post('/auth/school/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<null>> {
    return this.post('/auth/reset-password', { token, password });
  }

  async changeRole(userId: string, role: string): Promise<ApiResponse<User>> {
    return this.post('/auth/change-role', { userId, role });
  }

  // User management APIs
  async updateUser(id: string, payload: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.post(`/auth/update-user/${id}`, payload);
  }

  async softDeleteUser(id: string): Promise<ApiResponse<User>> {
    return this.post(`/auth/delete-user/${id}`);
  }

  async permanentDeleteUser(id: string): Promise<ApiResponse<null>> {
    return this.post(`/auth/delete-user-permanent/${id}`);
  }

  async reinstateUser(id: string): Promise<ApiResponse<User>> {
    return this.post(`/auth/reinstate-user/${id}`);
  }

  async getAdmins(): Promise<ApiResponse<Array<{ _id: string; user?: User }>>> {
    return this.get('/auth/admin/all');
  }

  // Class APIs
  async createClass(payload: Record<string, unknown>): Promise<ApiResponse<Class>> {
    return this.post('/class/create', payload);
  }

  async assignClassTeacher(classId: string, teacherId: string): Promise<ApiResponse<null>> {
    return this.post('/class/assign-teacher', { classId, teacherId });
  }

  async assignStudentToClass(studentId: string, classId: string): Promise<ApiResponse<null>> {
    return this.post('/class/assign-student', { studentId, classId });
  }

  async removeStudentFromClass(studentId: string): Promise<ApiResponse<null>> {
    return this.post('/class/remove-student', { studentId });
  }

  async getClassById(id: string): Promise<ApiResponse<Class>> {
    return this.get(`/class/${id}`);
  }

  async getClasses(): Promise<ApiResponse<Class[]>> {
    return this.get('/class/all');
  }

  // Subject APIs
  async createSubject(payload: Record<string, unknown>): Promise<ApiResponse<Subject>> {
    return this.post('/subject/create', payload);
  }

  async getSubjectsByClass(classId: string): Promise<ApiResponse<Subject[]>> {
    return this.get(`/subject/class/${classId}`);
  }

  async getAllSubjects(): Promise<ApiResponse<Subject[]>> {
    return this.get('/subject/all');
  }

  async assignSubjectToClass(subjectId: string, classId: string): Promise<ApiResponse<{ subject: string; class: string }>> {
    return this.post('/subject/assign-to-class', { subjectId, classId });
  }

  async updateSubject(id: string, payload: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.put(`/subject/${id}`, payload);
  }

  async deleteSubject(id: string): Promise<ApiResponse<null>> {
    return this.del(`/subject/${id}`);
  }

  // Teacher APIs
  async addTeacherToSubject(teacherId: string, subjectId: string): Promise<ApiResponse<{ teacher: string; subject: string }>> {
    return this.post('/teacher/add-to-subject', { teacherId, subjectId });
  }

  async getTeacherById(id: string): Promise<ApiResponse<Teacher>> {
    return this.get(`/teacher/${id}`);
  }

  async getTeachers(): Promise<ApiResponse<Teacher[]>> {
    return this.get('/teacher/all');
  }

  // Student APIs
  async addStudentToClass(studentId: string, classId: string): Promise<ApiResponse<{ student: string; class: string }>> {
    return this.post('/student/add-to-class', { studentId, classId });
  }

  async removeStudentFromStudentClass(studentId: string): Promise<ApiResponse<null>> {
    return this.post('/student/remove-from-class', { studentId });
  }

  async getStudentById(id: string): Promise<ApiResponse<Student>> {
    return this.get(`/student/${id}`);
  }

  async updateStudentProfile(id: string, payload: Record<string, unknown>): Promise<ApiResponse<null>> {
    return this.put(`/student/update/${id}`, payload);
  }

  // Attendance APIs
  async markAttendance(payload: {
    userId: string;
    date: string;
    status: 'present' | 'absent' | 'leave';
    remarks?: string;
    classId?: string;
  }): Promise<ApiResponse<Attendance>> {
    return this.post('/attendance/mark', payload);
  }

  async getAttendance(params?: { userId?: string; month?: number; year?: number }): Promise<ApiResponse<Attendance[]>> {
    return this.get('/attendance', params);
  }

  async getClassAttendance(params: { classId: string; month?: number; year?: number }): Promise<ApiResponse<Attendance[]>> {
    return this.get('/attendance/class', params);
  }

  async getStaffAttendance(params: { staffId: string; month?: number; year?: number }): Promise<ApiResponse<Attendance[]>> {
    return this.get('/attendance/staff', params);
  }

  async getTeacherAttendance(params: { teacherId: string; month?: number; year?: number }): Promise<ApiResponse<Attendance[]>> {
    return this.get('/attendance/teacher', params);
  }

  async updateAttendance(payload: {
    userId: string;
    date: string;
    status: 'present' | 'absent' | 'leave';
    remarks?: string;
    classId?: string;
  }): Promise<ApiResponse<Attendance>> {
    return this.post('/attendance/update', payload);
  }

  async getTodayAttendance(id: string): Promise<ApiResponse<Attendance>> {
    return this.get(`/attendance/get-today/${id}`);
  }

  // Progress APIs
  async createProgress(payload: Record<string, unknown>): Promise<ApiResponse<Grade>> {
    return this.post('/progress/create', payload);
  }

  async getStudentPerformance(studentId: string): Promise<ApiResponse<Grade[]>> {
    return this.get(`/progress/student/${studentId}`);
  }

  async getPerformanceById(progressId: string): Promise<ApiResponse<Grade>> {
    return this.get(`/progress/${progressId}`);
  }

  async updateProgress(progressId: string, payload: Record<string, unknown>): Promise<ApiResponse<Grade>> {
    return this.put(`/progress/${progressId}`, payload);
  }

  async deleteProgress(progressId: string): Promise<ApiResponse<null>> {
    return this.del(`/progress/${progressId}`);
  }

  async getValidSubjectsForStudent(studentId: string): Promise<
    ApiResponse<{ student: { _id: string; name: string; class?: unknown }; subjects: Subject[] }>
  > {
    return this.get(`/progress/valid-subjects/${studentId}`);
  }

  async getClassResult(classId: string, params?: { type?: string; academicYear?: string }): Promise<ApiResponse<Grade[]>> {
    return this.get(`/progress/class/${classId}`, params);
  }

  async getSubjectPerformance(subjectId: string): Promise<ApiResponse<Grade[]>> {
    return this.get(`/progress/subject/${subjectId}`);
  }

  async getStudentResultByYear(studentId: string, academicYear?: string): Promise<ApiResponse<Grade[]>> {
    return this.get(`/progress/result/student/${studentId}`, academicYear ? { academicYear } : undefined);
  }

  async getProgressReportDownloadUrl(
    format: 'basic' | 'advanced' | 'styled' | 'cbse',
    studentId: string,
  ): Promise<string> {
    const token = useAuthStore.getState().accessToken || (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) || '';
    const tokenQuery = encodeURIComponent(token);
    if (format === 'advanced') return `${API_BASE_URL}/progress/advanced-report/${studentId}?token=${tokenQuery}`;
    if (format === 'styled') return `${API_BASE_URL}/progress/report-card/${studentId}?token=${tokenQuery}`;
    if (format === 'cbse') return `${API_BASE_URL}/progress/report-card-cbsc/${studentId}?token=${tokenQuery}`;
    return `${API_BASE_URL}/progress/report/${studentId}?token=${tokenQuery}`;
  }

  // Profile APIs
  async getProfile(): Promise<ApiResponse<User>> {
    return this.get('/profile/me');
  }

  async getSchoolOverview(): Promise<
    ApiResponse<{ totalAdmins: number; totalClasses: number; totalStudents: number }>
  > {
    return this.get('/dashboard/overview');
  }

  async updateProfile(payload: Record<string, unknown>): Promise<ApiResponse<User>> {
    return this.put('/profile/update', payload);
  }

  async uploadProfileImage(payload: {
    uri: string;
    fileName?: string;
    mimeType?: string;
  }): Promise<ApiResponse<{ image: string }>> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const formData = new FormData();

    formData.append('image', {
      uri: payload.uri,
      name: payload.fileName || `profile-${Date.now()}.jpg`,
      type: payload.mimeType || 'image/jpeg',
    } as unknown as Blob);

    const response = await this.client.post<ApiResponse<{ image: string }>>('/profile/me/avatar', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getUserProfile(id: string): Promise<ApiResponse<User>> {
    return this.get(`/profile/${id}`);
  }

  // Legacy placeholders for data compatibility
  async getNotices(): Promise<ApiResponse<Notice[]>> {
    return this.get('/notice/all');
  }

  async getComplaints(): Promise<ApiResponse<Complaint[]>> {
    return this.get('/complain/all');
  }

  async createNotice(payload: { title: string; details: string; validity: string }): Promise<ApiResponse<Notice>> {
    return this.post('/notice', payload);
  }

  async updateNotice(
    id: string,
    payload: Partial<{ title: string; details: string; validity: string }>,
  ): Promise<ApiResponse<Notice>> {
    return this.put(`/notice/${id}`, payload);
  }

  async deleteNotice(id: string): Promise<ApiResponse<null>> {
    return this.del(`/notice/${id}`);
  }

  async getValidNotices(): Promise<ApiResponse<Notice[]>> {
    return this.get('/notice/valid');
  }

  async getFees(): Promise<ApiResponse<Fee[]>> {
    return this.get('/fee/all');
  }

  async getAllTimetables(): Promise<ApiResponse<Timetable[]>> {
    return this.get('/timetable');
  }

  async getTimetableByDay(day: string, classId?: string): Promise<ApiResponse<Timetable[]>> {
    return this.get(`/timetable/day/${day}`, classId ? { classId } : undefined);
  }

  async getTimetableByClass(classId: string): Promise<ApiResponse<Timetable[]>> {
    return this.get(`/timetable/class/${classId}`);
  }

  async createTimetable(payload: {
    name: string;
    classId: string;
    day: string;
    periods: Array<{ subject: string; startTime: string; endTime: string; hour?: number }>;
  }): Promise<ApiResponse<Timetable>> {
    return this.post('/timetable', payload);
  }

  async updateTimetable(
    id: string,
    payload: Partial<{
      name: string;
      classId: string;
      day: string;
      periods: Array<{ subject: string; startTime: string; endTime: string; hour?: number }>;
    }>,
  ): Promise<ApiResponse<Timetable>> {
    return this.put(`/timetable/${id}`, payload);
  }

  async deleteTimetable(id: string): Promise<ApiResponse<null>> {
    return this.del(`/timetable/${id}`);
  }

  // Backward-compatible helper
  async getTimetable(classId: string): Promise<ApiResponse<Timetable[]>> {
    return this.getTimetableByClass(classId);
  }

  
}

export const apiService = new ApiService();
