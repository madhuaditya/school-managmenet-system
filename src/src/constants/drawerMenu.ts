import type { UserRole } from '@/src/types';

import { getDashboardModulesForRole, type DashboardModule } from './dashboardMenu';

export type DrawerQuickLink = DashboardModule;

export const DRAWER_PUBLIC_LINKS: Array<DashboardModule & { route: string }> = [
  {
    id: 'about',
    label: 'About',
    icon: 'info-outline',
    color: '#0F766E',
    route: '/about',
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'contact-mail',
    color: '#2563EB',
    route: '/contact',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: 'feedback',
    color: '#7C3AED',
    route: '/feedback',
  },
  {
    id: 'logs',
    label: 'App Logs',
    icon: 'file-download',
    color: '#64748B',
    route: '/logs',
  },
];

export type DrawerFooterAction =
  | {
      id: 'profile';
      label: string;
      icon: string;
      color: string;
      route: string;
    }
  | {
      id: 'logout';
      label: string;
      icon: string;
      color: string;
      action: 'logout';
    };

export const getDrawerQuickLinksForRole = (role: UserRole | null | undefined, userId?: string) => {
  const roleLinks = getDashboardModulesForRole(role, userId).filter((item) => item.id !== 'profile');
  return [...roleLinks, ...DRAWER_PUBLIC_LINKS];
};

export const DRAWER_FOOTER_ACTIONS: DrawerFooterAction[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'person',
    color: '#0EA5E9',
    route: '/profile',
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: 'logout',
    color: '#DC2626',
    action: 'logout',
  },
];