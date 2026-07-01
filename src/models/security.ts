export interface SecurityRole {
  id: string;
  company_id: string;
  role_name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date | null;
}

export interface SecurityPermission {
  id: string;
  module_key: string;
  module_name: string;
  action: string;
  description: string | null;
}

export interface RolePermissionInput {
  permissionId: string;
  allowed: boolean;
}

export interface EffectivePermission {
  moduleKey: string;
  moduleName: string;
  action: string;
  allowed: boolean;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  is_system_role: boolean;
}

export interface SecurityAuditLog {
  id: string;
  company_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: string | null;
  created_at: Date;
}
