import type { UserRole } from '@/src/types';

export interface DashboardModule {
  id: string;
  label: string;
  icon: string;
  color: string;
  route: string;
}

const MODULES: Record<string, Omit<DashboardModule, 'id'>> = {
  students: { label: 'Students', icon: 'school', color: '#00BCD4', route: '/students' },
  teachers: { label: 'Teachers', icon: 'groups', color: '#E91E63', route: '/teachers' },
  admin: { label: 'Admin', icon: 'admin-panel-settings', color: '#F44336', route: '/admins' },
  staff: { label: 'Staff', icon: 'badge', color: '#2563EB', route: '/staff' },
  adduser: { label: 'Add User', icon: 'person-add', color: '#4CAF50', route: '/adduser' },
  classes: { label: 'Classes', icon: 'menu-book', color: '#2196F3', route: '/classes' },
  subjects: { label: 'Subjects', icon: 'book', color: '#7C3AED', route: '/subjects' },
  'fee-structure': { label: 'Fee Structure', icon: 'view-list', color: '#7C3AED', route: '/fee-structure' },
  'fee-payments': { label: 'Fee Payments', icon: 'price-check', color: '#B45309', route: '/fee-payments' },
  'salary-structure': { label: 'Salary Structure', icon: 'account-tree', color: '#1D4ED8', route: '/salary-structure' },
  'salary-payments': { label: 'Salary Payments', icon: 'payments', color: '#0F766E', route: '/salary-payments' },
  'my-salary': { label: 'My Salary', icon: 'account-balance-wallet', color: '#065F46', route: '/my-salary' },
  'create-alert': { label: 'Create Alert', icon: 'send', color: '#D97706', route: '/create-alert' },
  'my-alerts': { label: 'My Alerts', icon: 'notifications-active', color: '#0F766E', route: '/my-alerts' },
  'leave-apply': { label: 'Apply Leave', icon: 'event-note', color: '#2563EB', route: '/leave-apply' },
  'my-leaves': { label: 'My Leaves', icon: 'fact-check', color: '#4F46E5', route: '/my-leaves' },
  'leave-review': { label: 'Leave Review', icon: 'task-alt', color: '#1D4ED8', route: '/leave-review' },
  attendance: { label: 'My Attendance', icon: 'check-circle', color: '#673AB7', route: '/attendance' },
  notices: { label: 'Notices', icon: 'notifications', color: '#FF9800', route: '/notice' },
  profile: { label: 'Profile', icon: 'person', color: '#0EA5E9', route: '/profile' },
  performance: { label: 'Performance', icon: 'bar-chart', color: '#9333EA', route: '/performance' },
  chat: { label: 'Chat', icon: 'chat', color: '#0EA5E9', route: '/doubts' },
};

const ROLE_MENU_ORDER: Record<UserRole, string[]> = {
  admin: [
    'students',
    'teachers',
    'admin',
    'staff',
    'adduser',
    'classes',
    'subjects',
    // 'fee-structure',
    // 'fee-payments',
    // 'salary-structure',
    // 'salary-payments',
    'my-salary',
    'create-alert',
    'my-alerts',
    // 'chat',
    'leave-apply',
    'my-leaves',
    'leave-review',
    'attendance',
    'notices',
    'profile',
  ],
  teacher: [
    'students',
    'subjects',
    'attendance',
    // 'chat',
    'leave-apply',
    'my-leaves',
    'my-salary',
    'my-alerts',
    'profile',
  ],
  student: ['attendance', 
    // 'chat', 
    // 'leave-apply',
    //  'my-leaves', 
     'performance', 'my-alerts', 'profile'],
  staff: ['attendance', 
    // 'chat', 
    'leave-apply', 'my-leaves', 'my-salary', 'my-alerts', 'profile'],
};

export const getDashboardModulesForRole = (role: UserRole | null | undefined, userId?: string): DashboardModule[] => {
  if (!role) return [];

  return ROLE_MENU_ORDER[role]
    .map((id) => {
      const item = MODULES[id];
      if (!item) return null;

      if (id === 'attendance' && (role === 'student' || role === 'staff')) {
        return { id, ...item, route: '/myattendance' };
      }

      if (id === 'performance') {
        if (!userId) return null;
        return { id, ...item, route: `/performance/${userId}` };
      }

      return { id, ...item };
    })
    .filter((entry): entry is DashboardModule => Boolean(entry));
};
