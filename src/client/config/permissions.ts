import { UserRole } from '../types';

export type Permission =
  // Orders
  | 'orders:view'
  | 'orders:create'
  | 'orders:edit'
  | 'orders:dispatch'
  | 'orders:delete'
  // Deliveries
  | 'deliveries:view'
  | 'deliveries:create'
  | 'deliveries:assign'
  | 'deliveries:update_status'
  | 'deliveries:delete'
  // Vehicles
  | 'vehicles:view'
  | 'vehicles:create'
  | 'vehicles:update_status'
  | 'vehicles:delete'
  // Drivers
  | 'drivers:view'
  | 'drivers:create'
  | 'drivers:update_status'
  | 'drivers:delete'
  // Tracking
  | 'tracking:view'
  | 'tracking:simulate'
  // Maintenance
  | 'maintenance:view'
  | 'maintenance:create'
  | 'maintenance:complete'
  | 'maintenance:delete'
  // Issues
  | 'issues:view'
  | 'issues:report'
  | 'issues:resolve'
  // Reports
  | 'reports:view'
  | 'reports:export'
  // Settings & System
  | 'settings:view'
  | 'settings:manage'
  // Admin & Users
  | 'users:manage'
  | 'audit:view'
  | 'diagnostics:view'
  // Driver Console
  | 'driver:console';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:dispatch',
    'orders:delete',
    'deliveries:view',
    'deliveries:create',
    'deliveries:assign',
    'deliveries:update_status',
    'deliveries:delete',
    'vehicles:view',
    'vehicles:create',
    'vehicles:update_status',
    'vehicles:delete',
    'drivers:view',
    'drivers:create',
    'drivers:update_status',
    'drivers:delete',
    'tracking:view',
    'tracking:simulate',
    'maintenance:view',
    'maintenance:create',
    'maintenance:complete',
    'maintenance:delete',
    'issues:view',
    'issues:report',
    'issues:resolve',
    'reports:view',
    'reports:export',
    'settings:view',
    'settings:manage',
    'users:manage',
    'audit:view',
    'diagnostics:view',
  ],
  DISPATCHER: [
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:dispatch',
    'deliveries:view',
    'deliveries:create',
    'deliveries:assign',
    'deliveries:update_status',
    'vehicles:view',
    'vehicles:update_status',
    'drivers:view',
    'drivers:update_status',
    'tracking:view',
    'tracking:simulate',
    'maintenance:view',
    'maintenance:create',
    'maintenance:complete',
    'issues:view',
    'issues:report',
    'issues:resolve',
    'reports:view',
    'reports:export',
  ],
  DRIVER: [
    'driver:console',
    'issues:report',
  ],
  VIEWER: [
    'orders:view',
    'deliveries:view',
    'vehicles:view',
    'drivers:view',
    'tracking:view',
    'maintenance:view',
    'issues:view',
    'reports:view',
  ],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const hasRole = (currentRole: UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
};
