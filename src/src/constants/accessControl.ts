import type { UserRole } from '@/src/types';

export interface RouteAccessRule {
  pattern: RegExp;
  roles: UserRole[];
}

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { pattern: /^\/adduser$/, roles: ['admin'] },
  { pattern: /^\/notice$/, roles: ['admin'] },
  { pattern: /^\/classes$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/timetable$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/students$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/teachers$/, roles: ['admin'] },
  { pattern: /^\/admins$/, roles: ['admin'] },
  { pattern: /^\/myattendance$/, roles: ['student', 'staff'] },
  { pattern: /^\/broadcast$/, roles: ['admin', 'teacher', 'staff'] },
  { pattern: /^\/leave-apply$/, roles: ['admin', 'teacher', 'student', 'staff'] },
  { pattern: /^\/my-leaves$/, roles: ['admin', 'teacher', 'student', 'staff'] },
  { pattern: /^\/leave-review$/, roles: ['admin'] },
  { pattern: /^\/my-alerts$/, roles: ['admin', 'teacher', 'student', 'staff'] },
  { pattern: /^\/create-alert$/, roles: ['admin'] },
  { pattern: /^\/admin$/, roles: ['admin'] },
  { pattern: /^\/staff$/, roles: ['admin'] },
  { pattern: /^\/subjects$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/attendance$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/salary-structure$/, roles: ['admin'] },
  { pattern: /^\/salary-records$/, roles: ['admin'] },
  { pattern: /^\/salary-payments$/, roles: ['admin'] },
  { pattern: /^\/fee-structure$/, roles: ['admin'] },
  { pattern: /^\/fee-records$/, roles: ['admin'] },
  { pattern: /^\/fee-payments$/, roles: ['admin'] },
  { pattern: /^\/my-salary$/, roles: ['admin', 'teacher', 'staff'] },
  { pattern: /^\/my-fee$/, roles: ['student'] },
  { pattern: /^\/profile$/, roles: ['admin', 'teacher', 'student', 'staff'] },
  { pattern: /^\/performance\/[^/]+$/, roles: ['admin', 'teacher', 'student'] },
  { pattern: /^\/performance\/add\/[^/]+$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/performance\/edit\/[^/]+$/, roles: ['admin', 'teacher'] },
  { pattern: /^\/chat\/[^/]+$/, roles: ['admin', 'teacher', 'student', 'staff'] },
  { pattern: /^\/chat\/contacts$/, roles: ['admin', 'teacher', 'student', 'staff'] },
  { pattern: /^\/chat\/new-group$/, roles: ['admin', 'teacher', 'student', 'staff'] },
];

export const PUBLIC_PATHS = new Set<string>(['/', '/school-admin-setup', '/about', '/contact', '/feedback']);

export const getAllowedRolesForPath = (pathname: string): UserRole[] | null => {
  const matched = ROUTE_ACCESS_RULES.find((rule) => rule.pattern.test(pathname));
  return matched ? matched.roles : null;
};
