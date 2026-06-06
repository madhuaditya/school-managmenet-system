import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '@/src/constants/index';
import {
  ApiResponse,
  AuthResponse,
  Attendance,
  ChatMessage,
  ChatReply,
  Class,
  Complaint,
  Fee,
  Grade,
  Notice,
  PaginatedItems,
  Student,
  Subject,
  Teacher,
  Timetable,
  User,
  SalaryStructure,
  SalaryRecord,
  SalaryPayment,
  BroadcastAudiencePayload,
  BroadcastDelivery,
  BroadcastHistoryItem,
  BroadcastPreviewResponse,
  BroadcastSendPayload,
  FeeStructure,
  FeeRecord,
  FeePayment,
  AppAlert,
  LeaveRequest,
  MessagingAttachment,
  MessagingContact,
  MessagingConversation,
  MessagingMessagesPage,
  MessagingMessage,
} from '@/src/types';
// import { useAuthStore } from '@/src/store/auth.store';
import { forceLogoutAndRedirect } from '../src/services/sessionManager';
type RefreshResponse = ApiResponse<{ accessToken: string }>;
type SalaryHistoryPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type SalaryHistoryResponse = ApiResponse<{
  staffId: string;
  totalPayments: number;
  records: SalaryPayment[];
  pagination: SalaryHistoryPagination;
}>;

class ApiService {
  private client: AxiosInstance;

  private async getZustandState(): Promise<{ accessToken?: string | null; refreshToken?: string | null; user?: any } | null> {
    try {
      const obj = await AsyncStorage.getItem('school-mis-auth-store');
      const parsed = obj ? JSON.parse(obj) : null;
      return parsed?.state || null;
    } catch (e) {
      return null;
    }
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const state = await this.getZustandState();
      const token = state?.accessToken || null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 || error.response?.status === 444) {
          // Clear persisted zustand store and legacy keys on unauthorized/forced logout.
          await forceLogoutAndRedirect();
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
    const state = await this.getZustandState();
    const token = state?.accessToken || null;
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

  private async patch<T>(url: string, data?: unknown): Promise<T> {
    const config = await this.getAuthConfig();
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  private async del<T>(url: string): Promise<T> {
    const config = await this.getAuthConfig();
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  private async postMultipart<T>(url: string, formData: FormData): Promise<T> {
    const state = await this.getZustandState();
    const token = state?.accessToken || null;
    const response = await this.client.post<T>(url, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Authentication APIs
  async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.post('/auth/login', { username, password });
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

  async forgotPassword(payload: { username: string; email: string }): Promise<ApiResponse<null>> {
    return this.post('/auth/forgot-password', payload);
  }

  async forgotSchoolPassword(email: string): Promise<ApiResponse<null>> {
    return this.post('/auth/school/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<null>> {
    return this.post('/auth/reset-password', { token, password });
  }

  async submitPublicContact(payload: {
    name: string;
    email: string;
    phone: string;
    message: string;
    type?: 'contact';
  }): Promise<ApiResponse<unknown>> {
    return this.post('/feedback/public/contact', payload);
  }

  async submitPublicFeedback(payload: {
    name: string;
    email: string;
    rating: string;
    message: string;
    type?: 'feedback';
  }): Promise<ApiResponse<unknown>> {
    return this.post('/feedback/public/review', payload);
  }

  // OTP verification (mobile/web two-step login)
  async verifyOtp(token: string, code: string): Promise<ApiResponse<AuthResponse>> {
    return this.post('/auth/verify-otp', { token, code });
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

  async getStaff(): Promise<ApiResponse<Array<{ _id: string; user?: User }>>> {
    return this.get('/auth/staff/all');
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

  async getClassStudents(classId: string): Promise<ApiResponse<Array<Student & { user?: User }>>> {
    return this.get(`/class/${classId}/students`);
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

  async generateUsername(payload: { name: string; role?: 'admin' | 'teacher' | 'student' | 'staff' }): Promise<ApiResponse<{ username: string }>> {
    return this.post('/auth/generate/username', payload);
  }

  async generateStudentId(payload?: { year?: number }): Promise<ApiResponse<{ studentId: string }>> {
    return this.post('/auth/generate/student-id', payload || {});
  }

  async generateRollNumber(payload: { classId: string }): Promise<ApiResponse<{ rollNumber: string }>> {
    return this.post('/auth/generate/roll-number', payload);
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

  async getTodayClassAttendance(classId: string): Promise<
    ApiResponse<{
      classInfo: { _id: string; name: string; grade?: number | string; section?: string };
      date: string;
      attendance: Array<{
        studentId: string;
        userId: string;
        name: string;
        email?: string;
        phone?: string;
        rollNumber?: string;
        studentIdCode?: string;
        fatherName?: string;
        motherName?: string;
        status: 'present' | 'absent' | 'leave' | 'not-marked';
        remarks?: string | null;
      }>;
      summary?: { total: number; present: number; absent: number; leave: number; notMarked?: number };
    }>
  > {
    return this.get(`/attendance/today/class/${classId}`);
  }

  async getTodayAttendanceByRole(role: 'admin' | 'teacher' | 'staff'): Promise<
    ApiResponse<{
      role: string;
      date: string;
      attendance: Array<{
        _id: string;
        userId?: string;
        name?: string;
        email?: string;
        phone?: string;
        status: 'present' | 'absent' | 'leave' | 'not-marked';
        remarks?: string | null;
      }>;
      summary?: { total: number; present: number; absent: number; leave: number; notMarked?: number };
    }>
  > {
    return this.get(`/attendance/today/role/${role}`);
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

  async bulkMarkAttendance(payload: {
    classId?: string;
    date?: string;
    requestId?: string;
    records: Array<{
      userId: string;
      status: 'present' | 'absent' | 'leave';
      remarks?: string;
      classId?: string;
    }>;
  }): Promise<ApiResponse<{ updated: number; inserted: number; records?: Attendance[] }>> {
    return this.post('/attendance/bulk-mark', payload);
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

  // Subject dashboard/details + bulk progress APIs (web parity)
  async getSubjectDashboard(): Promise<ApiResponse<any>> {
    return this.get('/subject/dashboard');
  }

  async getSubjectDetails(subjectId: string, academicYear?: string): Promise<ApiResponse<any>> {
    return this.get(`/subject/${subjectId}/details`, academicYear ? { academicYear } : undefined);
  }

  async getExamProgressTemplate(examId: string, academicYear?: string): Promise<ApiResponse<any>> {
    return this.get(`/progress/exam/${examId}/template`, academicYear ? { academicYear } : undefined);
  }

  async bulkCreateProgress(payload: Record<string, unknown>): Promise<ApiResponse<any>> {
    return this.post('/progress/bulk-create', payload);
  }

  async bulkUpdateProgress(payload: Record<string, unknown>): Promise<ApiResponse<any>> {
    return this.put('/progress/bulk-update', payload);
  }

  async getSubjectRanking(subjectId: string): Promise<ApiResponse<any>> {
    return this.get(`/progress/subject/${subjectId}/ranking`);
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

    // prefer zustand persisted store as single source of truth
    const state = await this.getZustandState();
    const token = state?.accessToken || '';
     
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

  async getSchoolInfo(id: string): Promise<
    ApiResponse<{
      _id: string;
      schoolId?: string;
      schoolName: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      image?: string;
    }>
  > {
    return this.get(`/auth/school/${id}`);
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
    const state = await this.getZustandState();
    const token = state?.accessToken || null;
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

  async searchSchoolUsers(params: {
    q: string;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    image?: string;
    role?: string;
  }>>> {
    return this.get('/profile/search/users', params);
  }

  async searchMessagingUsers(params: { q: string; limit?: number }): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    image?: string;
    role?: string;
  }>>> {
    // Messaging search endpoint (school-scoped contacts)
    return this.get('/messaging/contacts', params);
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

  // Leave APIs
  async applyLeave(payload: {
    userId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<ApiResponse<LeaveRequest>> {
    return this.post('/leave/apply', payload);
  }

  async getMyLeaves(params?: {
    month?: number;
    year?: number;
    status?: 'pending' | 'approved' | 'declined';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ leaves?: LeaveRequest[]; data?: LeaveRequest[] }>> {
    return this.get('/leave/my', params);
  }

  async deleteMyLeave(leaveId: string): Promise<ApiResponse<null>> {
    return this.del(`/leave/my/${leaveId}`);
  }

  async getAdminLeaves(params?: {
    month?: number;
    year?: number;
    status?: 'pending' | 'approved' | 'declined';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ leaves?: LeaveRequest[]; data?: LeaveRequest[] }>> {
    return this.get('/leave/admin', params);
  }

  async reviewLeave(
    leaveId: string,
    payload: { action: 'approve' | 'decline'; reviewRemark?: string },
  ): Promise<ApiResponse<LeaveRequest>> {
    return this.patch(`/leave/admin/${leaveId}/review`, payload);
  }

  // Alert APIs
  async createAlert(payload: { userId?: string; title?: string; message: string }): Promise<ApiResponse<AppAlert>> {
    return this.post('/alert/create', payload);
  }

  async getUnviewedAlerts(): Promise<ApiResponse<AppAlert[]>> {
    return this.get('/alert/unviewed');
  }

  async markAlertAsViewed(alertId: string): Promise<ApiResponse<AppAlert>> {
    return this.put(`/alert/${alertId}/mark-viewed`);
  }

  async registerPushToken(pushToken: string): Promise<ApiResponse<null>> {
    return this.put('/profile/push-token', { pushToken });
  }

  async getFees(): Promise<ApiResponse<Fee[]>> {
    return this.get('/fee/all');
  }

  // Salary structure APIs
  async createSalaryStructure(payload: {
    role: 'TEACHER' | 'ACCOUNTANT' | 'DRIVER' | 'ADMIN' | 'OTHER';
    components: { basic: number; hra: number; da: number; bonus: number };
    deductions: { pf: number; tax: number; other: number };
  }): Promise<ApiResponse<SalaryStructure>> {
    return this.post('/salary-structure/create', payload);
  }

  async getAllSalaryStructures(): Promise<ApiResponse<SalaryStructure[]>> {
    return this.get('/salary-structure/all');
  }

  async getSalaryStructureByRole(role: 'ADMIN' | 'TEACHER' | 'STAFF' | 'ACCOUNTANT' | 'DRIVER' | 'OTHER'): Promise<ApiResponse<SalaryStructure>> {
    return this.get(`/salary-structure/role/${role}`);
  }

  async updateSalaryStructure(id: string, payload: Partial<{
    role: 'TEACHER' | 'ACCOUNTANT' | 'DRIVER' | 'ADMIN' | 'OTHER';
    components: { basic: number; hra: number; da: number; bonus: number };
    deductions: { pf: number; tax: number; other: number };
  }>): Promise<ApiResponse<SalaryStructure>> {
    return this.put(`/salary-structure/${id}`, payload);
  }

  async deleteSalaryStructure(id: string): Promise<ApiResponse<null>> {
    return this.del(`/salary-structure/${id}`);
  }

  // Salary record APIs
  async createSalaryRecord(payload: {
    staffId: string;
    month: number;
    year: number;
    baseSalary: number;
    earnings: { basic: number; hra: number; da: number; bonus: number };
    deductions: { pf: number; tax: number; other: number; leaveDeduction: number };
    remarks?: string;
  }): Promise<ApiResponse<SalaryRecord>> {
    return this.post('/salary-management/record/create', payload);
  }

  async updateSalaryRecord(id: string, payload: Partial<{
    baseSalary: number;
    earnings: { basic: number; hra: number; da: number; bonus: number };
    deductions: { pf: number; tax: number; other: number; leaveDeduction: number };
    status: 'UNPAID' | 'PARTIAL' | 'PAID';
    remarks: string;
    paymentDate: string | null;
  }>): Promise<ApiResponse<SalaryRecord>> {
    return this.put(`/salary-management/record/${id}`, payload);
  }

  async deleteSalaryRecord(id: string): Promise<ApiResponse<null>> {
    return this.del(`/salary-management/record/${id}`);
  }

  async getStaffAllSalaries(params: {
    staffId: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ records: SalaryRecord[]; pagination: Record<string, unknown> }>> {
    const { staffId, ...rest } = params;
    return this.get(`/salary-management/summary/staff/${staffId}/history`, rest);
  }

  async getStaffSalaryByMonth(params: {
    staffId: string;
    month: number;
    year: number;
  }): Promise<ApiResponse<SalaryRecord & { expectedAmount?: number; dueAmount?: number; paymentCount?: number; payments?: SalaryPayment[]; salaryStructureId?: string }>> {
    const { staffId, month, year } = params;
    return this.get(`/salary-management/summary/staff/${staffId}/month/${month}/${year}`);
  }

  // Salary payment APIs
  async recordSalaryPayment(payload: {
    staffId: string;
    salaryStructureId: string;
    month: number;
    year: number;
    amount: number;
    method: 'BANK' | 'UPI' | 'CASH';
    transactionId?: string;
    remarks?: string;
  }): Promise<ApiResponse<SalaryPayment>> {
    return this.post('/salary-management/payment/create', payload);
  }

  async getSalaryPaymentsByRecord(params: {
    salaryRecordId: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ records: SalaryPayment[]; pagination: Record<string, unknown> }>> {
    const { salaryRecordId, ...rest } = params;
    return this.get(`/salary-management/payment/${salaryRecordId}`, rest);
  }

  async getStaffSalaryPaymentHistory(params: {
    staffId: string;
    page?: number;
    limit?: number;
  }): Promise<SalaryHistoryResponse> {
    const { staffId, ...rest } = params;
    return this.get(`/salary-management/summary/staff/${staffId}/history`, rest);
  }

  // Fee structure APIs
  async createFeeStructure(payload: {
    classId: string;
    components: {
      tuition: number;
      exam: number;
      transport: number;
      hostel: number;
      activity: number;
      development: number;
    };
  }): Promise<ApiResponse<FeeStructure>> {
    return this.post('/fee-structure/create', payload);
  }

  async getAllFeeStructures(): Promise<ApiResponse<FeeStructure[]>> {
    return this.get('/fee-structure/all');
  }

  async getFeeStructureByClass(classId: string): Promise<ApiResponse<FeeStructure>> {
    return this.get(`/fee-structure/class/${classId}`);
  }

  async updateFeeStructure(id: string, payload: Partial<{
    classId: string;
    components: {
      tuition: number;
      exam: number;
      transport: number;
      hostel: number;
      activity: number;
      development: number;
    };
  }>): Promise<ApiResponse<FeeStructure>> {
    return this.put(`/fee-structure/${id}`, payload);
  }

  async deleteFeeStructure(id: string): Promise<ApiResponse<null>> {
    return this.del(`/fee-structure/${id}`);
  }

  // Fee record APIs
  async createFeeRecord(payload: {
    userId: string;
    month: number;
    year: number;
    totalFee: number;
    dueAmount: number;
    discount?: number;
    fine?: number;
    dueDate?: string | null;
    notes?: string;
    status?: 'PENDING' | 'PARTIAL' | 'PAID';
  }): Promise<ApiResponse<FeeRecord>> {
    return this.post('/fee-management/record/create', payload);
  }

  async updateFeeRecord(id: string, payload: Partial<{
    totalFee: number;
    dueAmount: number;
    discount: number;
    fine: number;
    dueDate: string | null;
    notes: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID';
  }>): Promise<ApiResponse<FeeRecord>> {
    return this.put(`/fee-management/record/${id}`, payload);
  }

  async deleteFeeRecord(id: string): Promise<ApiResponse<null>> {
    return this.del(`/fee-management/record/${id}`);
  }

  async getStudentAllFeeRecords(params: {
    studentId: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ records: FeeRecord[]; pagination: Record<string, unknown> }>> {
    const { studentId, ...rest } = params;
    return this.get(`/fee-management/record/student/${studentId}/all`, rest);
  }

  async getStudentFeeByMonth(params: {
    studentId: string;
    month: number;
    year: number;
  }): Promise<ApiResponse<FeeRecord & { expectedAmount?: number; dueAmount?: number; paymentCount?: number; payments?: FeePayment[]; feeStructureId?: string }>> {
    const { studentId, month, year } = params;
    return this.get(`/fee-management/summary/student/${studentId}/month/${month}/${year}`);
  }

  // Fee payment APIs
  async createFeePayment(payload: {
    studentId: string;
    feeStructureId: string;
    month: number;
    year: number;
    amount: number;
    lateFee?: number;
    method: 'UPI' | 'CARD' | 'NETBANKING' | 'CASH' | 'BANK';
    transactionId?: string;
    remarks?: string;
  }): Promise<ApiResponse<FeePayment>> {
    return this.post('/fee-management/payment/create', payload);
  }

  async getFeePaymentsByRecord(params: {
    feeRecordId: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ records: FeePayment[]; pagination: Record<string, unknown> }>> {
    return this.get(`/fee-management/payment/${params.feeRecordId}`, {
      page: params.page,
      limit: params.limit,
    });
  }

  async getStudentFeePaymentHistory(params: {
    studentId: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ records: FeePayment[]; pagination: Record<string, unknown> }>> {
    const { studentId, ...rest } = params;
    return this.get(`/fee-management/payment/student/${studentId}/history`, rest);
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

  // Doubts/Chat APIs
  async createChat(msg: string): Promise<ApiResponse<ChatMessage>> {
    return this.post('/chat/create', { msg });
  }

  async deleteChat(id: string): Promise<ApiResponse<null>> {
    return this.del(`/chat/${id}`);
  }

  async getMyChats(): Promise<ApiResponse<ChatMessage[]>> {
    return this.get('/chat/my');
  }

  async getSchoolChats(params?: { page?: number; size?: number }): Promise<ApiResponse<PaginatedItems<ChatMessage>>> {
    return this.get('/chat', params);
  }

  async createReply(chatId: string, msg: string): Promise<ApiResponse<ChatReply>> {
    return this.post('/reply/create', { chatId, msg });
  }

  async deleteReply(id: string): Promise<ApiResponse<null>> {
    return this.del(`/reply/${id}`);
  }

  async getMyReplies(): Promise<ApiResponse<ChatReply[]>> {
    return this.get('/reply/my');
  }

  async getRepliesByChat(chatId: string, params?: { page?: number; size?: number }): Promise<ApiResponse<PaginatedItems<ChatReply>>> {
    return this.get(`/reply/chat/${chatId}`, params);
  }

  // Messaging APIs
  async getMessagingContacts(params?: { q?: string; roles?: string[] }): Promise<ApiResponse<MessagingContact[]>> {
    return this.get('/messaging/contacts', {
      q: params?.q,
      roles: params?.roles?.join(','),
    });
  }

  async createDirectConversation(targetUserId: string): Promise<ApiResponse<MessagingConversation>> {
    return this.post('/messaging/conversations/direct', { targetUserId });
  }

  async createMessagingGroup(payload: {
    name: string;
    description?: string;
    memberIds: string[];
  }): Promise<ApiResponse<MessagingConversation>> {
    return this.post('/messaging/conversations/groups', payload);
  }

  async getMessagingConversations(): Promise<ApiResponse<MessagingConversation[]>> {
    return this.get('/messaging/conversations');
  }

  async getBroadcastConversation(): Promise<ApiResponse<MessagingConversation>> {
    return this.get('/messaging/broadcast');
  }

  async previewBroadcastRecipients(payload: BroadcastAudiencePayload): Promise<ApiResponse<BroadcastPreviewResponse>> {
    return this.post('/broadcast/preview-recipients', payload);
  }

  async sendBroadcast(payload: BroadcastSendPayload): Promise<ApiResponse<BroadcastHistoryItem>> {
    return this.post('/broadcast/send', payload);
  }

  async getBroadcastHistory(): Promise<ApiResponse<BroadcastHistoryItem[]>> {
    return this.get('/broadcast/history');
  }

  async getBroadcastById(broadcastId: string): Promise<ApiResponse<BroadcastHistoryItem>> {
    return this.get(`/broadcast/${broadcastId}`);
  }

  async getBroadcastDeliveries(broadcastId: string): Promise<ApiResponse<BroadcastDelivery[]>> {
    return this.get(`/broadcast/${broadcastId}/deliveries`);
  }

  async getMessagingMessages(
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<MessagingMessagesPage>> {
    return this.get(`/messaging/conversations/${conversationId}/messages`, params);
  }

  async uploadMessagingAsset(payload: {
    uri: string;
    fileName?: string;
    mimeType?: string;
  }): Promise<ApiResponse<MessagingAttachment>> {
    const formData = new FormData();
    formData.append('file', {
      uri: payload.uri,
      name: payload.fileName || `attachment-${Date.now()}`,
      type: payload.mimeType || 'application/octet-stream',
    } as unknown as Blob);

    return this.postMultipart('/messaging/uploads', formData);
  }

  async sendMessagingMessage(
    conversationId: string,
    payload: {
      type?: string;
      bodyPlain?: string;
      bodyMarkdown?: string;
      attachments?: MessagingAttachment[];
      replyToMessageId?: string;
    },
  ): Promise<ApiResponse<MessagingMessage>> {
    return this.post(`/messaging/conversations/${conversationId}/messages`, payload);
  }

  async markMessagingConversationRead(
    conversationId: string,
    messageId?: string,
  ): Promise<ApiResponse<{ conversationId: string; lastReadMessage?: string | null; lastReadAt?: string | null; unreadCount: number }>> {
    return this.post(`/messaging/conversations/${conversationId}/read`, messageId ? { messageId } : {});
  }

  
}

export const apiService = new ApiService();
