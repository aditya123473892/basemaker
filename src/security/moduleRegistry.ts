export const RBAC_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

export interface PermissionNode {
  key: string;
  label: string;
  path?: string;
  isGroup?: boolean;
  children?: PermissionNode[];
}

export interface PermissionModule {
  moduleKey: string;
  moduleLabel: string;
  children: PermissionNode[];
}

export const MODULE_REGISTRY = [
  {
    moduleKey: 'dashboard',
    moduleLabel: 'Dashboard',
    children: [
      { key: 'overview', label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    moduleKey: 'users',
    moduleLabel: 'Users',
    children: [
      { key: 'user_management', label: 'User Management', path: '/dashboard/user-master' },
      { key: 'role_management', label: 'Role Management', path: '/dashboard/security' },
    ],
  },
  {
    moduleKey: 'transport',
    moduleLabel: 'Transport',
    children: [
      {
        key: 'route_group',
        label: 'Routes',
        isGroup: true,
        children: [
          { key: 'routes', label: 'Route List', path: '/dashboard/trips' },
          { key: 'trips', label: 'Trips', path: '/dashboard/trips' },
        ],
      },
      { key: 'vehicles', label: 'Vehicles', path: '/dashboard/vehicles' },
      { key: 'drivers', label: 'Drivers', path: '/dashboard/drivers' },
      { key: 'student_assignment', label: 'Student Assignment' },
    ],
  },
  {
    moduleKey: 'finance',
    moduleLabel: 'Finance',
    children: [
      { key: 'fee_collection', label: 'Fee Collection', path: '/dashboard/accounts/payments' },
      { key: 'reports', label: 'Reports', path: '/dashboard/accounts/invoices' },
    ],
  },
  {
    moduleKey: 'system',
    moduleLabel: 'System',
    children: [
      { key: 'settings', label: 'System Settings' },
      { key: 'navigation', label: 'Menu Management', path: '/dashboard/security' },
      { key: 'audit_logs', label: 'Audit Logs', path: '/dashboard/security' },
    ],
  },
] satisfies PermissionModule[];

export const DEFAULT_SYSTEM_ROLES = [
  {
    roleName: 'superadmin',
    description: 'System role with unrestricted access to every module and action.',
  },
  {
    roleName: 'admin',
    description: 'System role for company administrators.',
  },
  {
    roleName: 'accountant',
    description: 'System role for finance users.',
  },
  {
    roleName: 'user',
    description: 'System role with basic read-only access.',
  },
] as const;

export const SUPER_ADMIN_ROLE = 'superadmin';

export function permissionKey(moduleKey: string, nodeKey: string) {
  return `${moduleKey}.${nodeKey}`;
}

export function flattenPermissionRegistry() {
  const permissions: Array<{ moduleKey: string; moduleName: string; path?: string }> = [];

  const visit = (module: PermissionModule, nodes: PermissionNode[]) => {
    for (const node of nodes) {
      if (node.isGroup) {
        visit(module, node.children || []);
        continue;
      }

      permissions.push({
        moduleKey: permissionKey(module.moduleKey, node.key),
        moduleName: `${module.moduleLabel} / ${node.label}`,
        path: node.path,
      });
    }
  };

  for (const module of MODULE_REGISTRY) {
    visit(module, module.children);
  }

  return permissions;
}
