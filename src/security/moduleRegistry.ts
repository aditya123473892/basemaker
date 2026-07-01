export const RBAC_ACTIONS = [
  'VIEW',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'PRINT',
] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

export const MODULE_REGISTRY = [
  { moduleKey: 'DASHBOARD', moduleName: 'Dashboard' },
  { moduleKey: 'USERS', moduleName: 'Users' },
  { moduleKey: 'DRIVERS', moduleName: 'Drivers' },
  { moduleKey: 'VEHICLES', moduleName: 'Vehicles' },
  { moduleKey: 'TRIPS', moduleName: 'Trips' },
  { moduleKey: 'BILLINGS', moduleName: 'Billings & Reports' },
  { moduleKey: 'ACCOUNTS', moduleName: 'Accounts' },
  { moduleKey: 'TRANSPORT', moduleName: 'Transport' },
  { moduleKey: 'SECURITY', moduleName: 'Security' },
] as const;

export const DEFAULT_SYSTEM_ROLES = [
  {
    roleName: 'Super Admin',
    description: 'System role with unrestricted access to every module and action.',
  },
  {
    roleName: 'Admin',
    description: 'System role for company administrators.',
  },
  {
    roleName: 'Transporter',
    description: 'System role for transport operations users.',
  },
] as const;

export const SUPER_ADMIN_ROLE = 'Super Admin';
