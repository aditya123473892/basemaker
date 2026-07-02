import { BaseRepository } from '../repositories/base/BaseRepository';
import { EffectivePermission, RolePermissionInput, SecurityPermission, SecurityRole, UserRoleRow } from '../models/security';
import { DEFAULT_SYSTEM_ROLES, MODULE_REGISTRY, RBAC_ACTIONS, SUPER_ADMIN_ROLE, flattenPermissionRegistry } from '../security/moduleRegistry';
import { redisCacheService } from './redisCacheService';
import { emitPermissionChange, PermissionEventType } from '../events/permissionEvents';

export class SecurityService extends BaseRepository {
  private static schemaEnsured = false;
  private static seededCompanies = new Set<string>();

  async ensureSecuritySeed(companyId: string, actorUserId?: string): Promise<void> {
    if (SecurityService.seededCompanies.has(companyId)) return;

    await this.ensureSecuritySchema();
    if (await this.isSeeded(companyId)) {
      SecurityService.seededCompanies.add(companyId);
      return;
    }

    await this.seedPermissions();
    await this.seedRoles(companyId, actorUserId);
    SecurityService.seededCompanies.add(companyId);
  }

  async assignSystemRoleByName(companyId: string, userId: string, roleName: string, actorUserId?: string): Promise<void> {
    await this.ensureSecuritySeed(companyId, actorUserId);
    const role = await this.getRoleByName(companyId, roleName);
    if (!role) throw new Error('System role not found');
    await this.assignRole(companyId, userId, role.id, actorUserId);
  }

  async getModuleRegistry() {
    return { modules: MODULE_REGISTRY, actions: RBAC_ACTIONS };
  }

  async getRoles(companyId: string): Promise<SecurityRole[]> {
    await this.ensureSecuritySeed(companyId);
    return this.executeQuery<SecurityRole>(
      `SELECT id, company_id, role_name, description, is_system_role, is_active, created_by, created_at, updated_by, updated_at
       FROM Roles
       WHERE company_id = @companyId
       ORDER BY is_system_role DESC, role_name ASC`,
      { companyId }
    );
  }

  async createRole(companyId: string, actorUserId: string | undefined, data: { roleName: string; description?: string | null; isActive?: boolean }) {
    const role = await this.executeScalar<SecurityRole>(
      `INSERT INTO Roles (company_id, role_name, description, is_system_role, is_active, created_by)
       OUTPUT inserted.id, inserted.company_id, inserted.role_name, inserted.description, inserted.is_system_role,
              inserted.is_active, inserted.created_by, inserted.created_at, inserted.updated_by, inserted.updated_at
       VALUES (@companyId, @roleName, @description, 0, @isActive, @actorUserId)`,
      {
        companyId,
        roleName: data.roleName.trim(),
        description: data.description || null,
        isActive: data.isActive ?? true,
        actorUserId: actorUserId || null,
      }
    );
    await this.audit(companyId, actorUserId, 'ROLE_CREATED', 'Role', role.id, { roleName: role.role_name });
    
    // Emit event for cache invalidation
    await emitPermissionChange('role.created', companyId, {
      roleId: role.id,
      userId: actorUserId, // This is the actor who made the change
      metadata: { roleName: role.role_name },
    });
    
    return role;
  }

  async updateRole(companyId: string, roleId: string, actorUserId: string | undefined, data: { roleName?: string; description?: string | null; isActive?: boolean }) {
    const role = await this.executeScalar<SecurityRole>(
      `UPDATE Roles
       SET role_name = COALESCE(@roleName, role_name),
           description = @description,
           is_active = COALESCE(@isActive, is_active),
           updated_by = @actorUserId,
           updated_at = sysdatetime()
       OUTPUT inserted.id, inserted.company_id, inserted.role_name, inserted.description, inserted.is_system_role,
              inserted.is_active, inserted.created_by, inserted.created_at, inserted.updated_by, inserted.updated_at
       WHERE id = @roleId AND company_id = @companyId`,
      {
        roleId,
        companyId,
        roleName: data.roleName?.trim() || null,
        description: data.description ?? null,
        isActive: data.isActive ?? null,
        actorUserId: actorUserId || null,
      }
    );
    await this.audit(companyId, actorUserId, 'ROLE_UPDATED', 'Role', role.id, { roleName: role.role_name });
    
    // Emit event for cache invalidation
    await emitPermissionChange('role.updated', companyId, {
      roleId: role.id,
      userId: actorUserId, // This is the actor who made the change
      metadata: { roleName: role.role_name },
    });
    
    return role;
  }

  async deleteRole(companyId: string, roleId: string, actorUserId?: string): Promise<void> {
    const role = await this.getRoleById(companyId, roleId);
    if (!role) throw new Error('Role not found');
    if (role.is_system_role) throw new Error('System roles cannot be deleted');

    // Get all users with this role before deletion for cache invalidation
    const usersWithRole = await this.executeQuery<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM UserRoles WHERE role_id = @roleId`,
      { roleId }
    );

    await this.executeNonQuery(`DELETE FROM UserRoles WHERE role_id = @roleId`, { roleId });
    await this.executeNonQuery(`DELETE FROM RolePermissions WHERE role_id = @roleId`, { roleId });
    await this.executeNonQuery(`DELETE FROM Roles WHERE id = @roleId AND company_id = @companyId`, { roleId, companyId });
    await this.audit(companyId, actorUserId, 'ROLE_DELETED', 'Role', roleId, { roleName: role.role_name });

    // Emit event for cache invalidation
    await emitPermissionChange('role.deleted', companyId, {
      roleId: roleId,
      userId: actorUserId,
      metadata: { roleName: role.role_name },
    });
  }

  async getPermissions(companyId: string): Promise<SecurityPermission[]> {
    await this.ensureSecuritySeed(companyId);
    return this.executeQuery<SecurityPermission>(
      `SELECT id, module_key, module_name, action, description
       FROM Permissions
       ORDER BY module_name ASC, action ASC`
    );
  }

  async getRolePermissionMatrix(companyId: string, roleId: string) {
    await this.ensureSecuritySeed(companyId);
    const role = await this.getRoleById(companyId, roleId);
    if (!role) throw new Error('Role not found');

    const rows = await this.executeQuery<any>(
      `SELECT p.id AS permission_id, p.module_key, p.module_name, p.action, p.description,
              CAST(ISNULL(rp.allowed, 0) AS bit) AS allowed
       FROM Permissions p
       LEFT JOIN RolePermissions rp ON rp.permission_id = p.id AND rp.role_id = @roleId
       ORDER BY p.module_name ASC, p.action ASC`,
      { roleId }
    );

    return { role, permissions: rows };
  }

  async setRolePermissions(companyId: string, roleId: string, actorUserId: string | undefined, permissions: RolePermissionInput[]) {
    const role = await this.getRoleById(companyId, roleId);
    if (!role) throw new Error('Role not found');

    if (permissions.length === 0) {
      return this.getRolePermissionMatrix(companyId, roleId);
    }

    // Batch update using a single MERGE statement with UNION ALL for better performance
    // This reduces N database round-trips to 1
    const unionValues = permissions
      .map((item) => `SELECT @roleId AS role_id, '${item.permissionId}' AS permission_id, ${item.allowed ? 1 : 0} AS allowed`)
      .join(' UNION ALL ');

    const batchQuery = `
      MERGE RolePermissions AS target
      USING (${unionValues}) AS source (role_id, permission_id, allowed)
      ON target.role_id = source.role_id AND target.permission_id = source.permission_id
      WHEN MATCHED THEN UPDATE SET allowed = source.allowed
      WHEN NOT MATCHED THEN INSERT (role_id, permission_id, allowed) VALUES (source.role_id, source.permission_id, source.allowed);`;

    await this.executeNonQuery(batchQuery, { roleId });

    await this.audit(companyId, actorUserId, 'PERMISSION_CHANGED', 'Role', roleId, { changes: permissions.length });

    // Emit event for cache invalidation
    await emitPermissionChange('permission.updated', companyId, {
      roleId: roleId,
      userId: actorUserId,
      metadata: { changes: permissions.length },
    });

    return this.getRolePermissionMatrix(companyId, roleId);
  }

  async getUsersWithRoles(companyId: string) {
    await this.ensureSecuritySeed(companyId);
    const users = await this.executeQuery<any>(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM UserAccount
       WHERE company_id = @companyId
       ORDER BY full_name ASC`,
      { companyId }
    );

    const roles = await this.executeQuery<UserRoleRow>(
      `SELECT ur.id, ur.user_id, ur.role_id, r.role_name, r.is_system_role
       FROM UserRoles ur
       INNER JOIN Roles r ON r.id = ur.role_id
       WHERE r.company_id = @companyId`,
      { companyId }
    );

    return users.map((user) => ({
      ...user,
      roles: roles.filter((role) => role.user_id === user.id),
    }));
  }

  async assignRole(companyId: string, userId: string, roleId: string, actorUserId?: string) {
    await this.assertUserInCompany(companyId, userId);
    const role = await this.getRoleById(companyId, roleId);
    if (!role) throw new Error('Role not found');

    await this.executeNonQuery(
      `MERGE UserRoles AS target
       USING (SELECT @userId AS user_id, @roleId AS role_id) AS source
       ON target.user_id = source.user_id AND target.role_id = source.role_id
       WHEN NOT MATCHED THEN INSERT (user_id, role_id) VALUES (@userId, @roleId);`,
      { userId, roleId }
    );
    await this.audit(companyId, actorUserId, 'USER_ASSIGNED', 'UserRole', userId, { roleName: role.role_name });
    return this.getUserRoles(companyId, userId);
  }

  async setUserRoles(companyId: string, userId: string, roleIds: string[], actorUserId?: string) {
    await this.ensureSecuritySeed(companyId, actorUserId);
    await this.assertUserInCompany(companyId, userId);

    const currentRoles = await this.getUserRoles(companyId, userId);
    const superAdmin = await this.getRoleByName(companyId, SUPER_ADMIN_ROLE);
    if (
      actorUserId === userId &&
      superAdmin &&
      currentRoles.some((role) => role.role_id === superAdmin.id) &&
      !roleIds.includes(superAdmin.id)
    ) {
      throw new Error('You cannot remove your own Super Admin access');
    }

    await this.executeNonQuery(`DELETE FROM UserRoles WHERE user_id = @userId`, { userId });

    for (const roleId of Array.from(new Set(roleIds))) {
      const role = await this.getRoleById(companyId, roleId);
      if (!role) throw new Error('Role not found');
      await this.assignRole(companyId, userId, roleId, actorUserId);
    }

    await this.audit(companyId, actorUserId, 'USER_ROLES_UPDATED', 'User', userId, { roleCount: roleIds.length });

    // Emit event for cache invalidation
    await emitPermissionChange('user.role.assigned', companyId, {
      userId: userId,
      actorUserId: actorUserId,
      metadata: { roleCount: roleIds.length },
    });

    return this.getUserRoles(companyId, userId);
  }

  async removeRole(companyId: string, userId: string, roleId: string, actorUserId?: string) {
    const role = await this.getRoleById(companyId, roleId);
    if (!role) throw new Error('Role not found');
    if (actorUserId === userId && role.role_name === SUPER_ADMIN_ROLE) {
      throw new Error('You cannot remove your own Super Admin access');
    }

    await this.executeNonQuery(`DELETE FROM UserRoles WHERE user_id = @userId AND role_id = @roleId`, { userId, roleId });
    await this.audit(companyId, actorUserId, 'USER_REMOVED', 'UserRole', userId, { roleName: role.role_name });
    
    // Emit event for cache invalidation
    await emitPermissionChange('user.role.removed', companyId, {
      userId: userId,
      actorUserId: actorUserId,
      metadata: { roleName: role.role_name },
    });
    
    return this.getUserRoles(companyId, userId);
  }

  async getUserRoles(companyId: string, userId: string): Promise<UserRoleRow[]> {
    return this.executeQuery<UserRoleRow>(
      `SELECT ur.id, ur.user_id, ur.role_id, r.role_name, r.is_system_role
       FROM UserRoles ur
       INNER JOIN Roles r ON r.id = ur.role_id
       WHERE ur.user_id = @userId AND r.company_id = @companyId
       ORDER BY r.role_name ASC`,
      { userId, companyId }
    );
  }

  async getEffectivePermissions(companyId: string, userId: string): Promise<EffectivePermission[]> {
    await this.ensureSecuritySeed(companyId);

    // Check Redis cache first
    const cacheKey = `permissions:${companyId}:${userId}`;
    const cached = await redisCacheService.get<EffectivePermission[]>(cacheKey);
    if (cached) return cached;

    // Single optimized query that gets all permissions with their allowed status
    // This eliminates the N+1 query problem
    const rows = await this.executeQuery<any>(
      `SELECT p.module_key, p.module_name, p.action,
              CAST(CASE WHEN EXISTS (
                SELECT 1 FROM UserRoles ur
                INNER JOIN Roles r ON r.id = ur.role_id AND r.is_active = 1
                INNER JOIN RolePermissions rp ON rp.role_id = r.id AND rp.allowed = 1 AND rp.permission_id = p.id
                WHERE ur.user_id = @userId AND r.company_id = @companyId
              ) THEN 1 ELSE 0 END AS bit) AS allowed
       FROM Permissions p
       ORDER BY p.module_name ASC, p.action ASC`,
      { userId, companyId }
    );

    const permissions = rows.map((row) => ({
      moduleKey: row.module_key,
      moduleName: row.module_name,
      action: row.action,
      allowed: row.allowed,
    }));

    // Cache the result for 5 minutes in Redis
    await redisCacheService.set(cacheKey, permissions, 5 * 60);

    return permissions;
  }

  async hasPermission(companyId: string, userId: string, _legacyRole: string | undefined, moduleKey: string, action: string): Promise<boolean> {
    await this.ensureSecuritySeed(companyId, userId);

    const rows = await this.executeQuery<{ allowed: boolean }>(
      `SELECT TOP 1 CAST(1 AS bit) AS allowed
       FROM UserRoles ur
       INNER JOIN Roles r ON r.id = ur.role_id AND r.company_id = @companyId AND r.is_active = 1
       INNER JOIN RolePermissions rp ON rp.role_id = r.id AND rp.allowed = 1
       INNER JOIN Permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = @userId AND p.module_key = @moduleKey AND p.action = @action`,
      { companyId, userId, moduleKey, action }
    );
    
    return rows.length > 0;
  }

  async getAuditLogs(companyId: string) {
    return this.executeQuery(
      `SELECT TOP 200 al.id, al.company_id, al.actor_user_id, u.full_name AS actor_name,
              al.action, al.entity_type, al.entity_id, al.metadata, al.created_at
       FROM SecurityAuditLogs al
       LEFT JOIN UserAccount u ON u.id = al.actor_user_id
       WHERE al.company_id = @companyId
       ORDER BY al.created_at DESC`,
      { companyId }
    );
  }

  /**
   * Clear permission cache for a specific company/user
   * Call this after permission changes
   */
  async clearPermissionCache(companyId: string, userId?: string): Promise<void> {
    if (userId) {
      await redisCacheService.invalidate(`permissions:${companyId}:${userId}`);
    } else {
      await redisCacheService.invalidate(`permissions:${companyId}:*`);
    }
  }

  private async ensureSecuritySchema(): Promise<void> {
    if (SecurityService.schemaEnsured) return;

    const statements = [
      `
IF OBJECT_ID('Roles', 'U') IS NULL
CREATE TABLE Roles (
  id uniqueidentifier NOT NULL CONSTRAINT DF_Roles_id DEFAULT newid(),
  company_id uniqueidentifier NOT NULL,
  role_name nvarchar(100) NOT NULL,
  description nvarchar(500) NULL,
  is_system_role bit NOT NULL CONSTRAINT DF_Roles_is_system_role DEFAULT 0,
  is_active bit NOT NULL CONSTRAINT DF_Roles_is_active DEFAULT 1,
  created_by uniqueidentifier NULL,
  created_at datetime2 NOT NULL CONSTRAINT DF_Roles_created_at DEFAULT sysdatetime(),
  updated_by uniqueidentifier NULL,
  updated_at datetime2 NULL,
  CONSTRAINT PK_Roles PRIMARY KEY (id),
  CONSTRAINT FK_Roles_Company FOREIGN KEY (company_id) REFERENCES Company(id),
  CONSTRAINT UQ_Roles_company_role UNIQUE (company_id, role_name)
)`,
      `
IF OBJECT_ID('Permissions', 'U') IS NULL
CREATE TABLE Permissions (
  id uniqueidentifier NOT NULL CONSTRAINT DF_Permissions_id DEFAULT newid(),
  module_key nvarchar(100) NOT NULL,
  module_name nvarchar(150) NOT NULL,
  action nvarchar(50) NOT NULL,
  description nvarchar(500) NULL,
  CONSTRAINT PK_Permissions PRIMARY KEY (id),
  CONSTRAINT UQ_Permissions_module_action UNIQUE (module_key, action)
)`,
      `
IF OBJECT_ID('RolePermissions', 'U') IS NULL
CREATE TABLE RolePermissions (
  id uniqueidentifier NOT NULL CONSTRAINT DF_RolePermissions_id DEFAULT newid(),
  role_id uniqueidentifier NOT NULL,
  permission_id uniqueidentifier NOT NULL,
  allowed bit NOT NULL CONSTRAINT DF_RolePermissions_allowed DEFAULT 0,
  CONSTRAINT PK_RolePermissions PRIMARY KEY (id),
  CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
  CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE,
  CONSTRAINT UQ_RolePermissions_role_permission UNIQUE (role_id, permission_id)
)`,
      `
IF OBJECT_ID('UserRoles', 'U') IS NULL
CREATE TABLE UserRoles (
  id uniqueidentifier NOT NULL CONSTRAINT DF_UserRoles_id DEFAULT newid(),
  user_id uniqueidentifier NOT NULL,
  role_id uniqueidentifier NOT NULL,
  CONSTRAINT PK_UserRoles PRIMARY KEY (id),
  CONSTRAINT FK_UserRoles_UserAccount FOREIGN KEY (user_id) REFERENCES UserAccount(id) ON DELETE CASCADE,
  CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
  CONSTRAINT UQ_UserRoles_user_role UNIQUE (user_id, role_id)
)`,
      `
IF OBJECT_ID('SecurityAuditLogs', 'U') IS NULL
CREATE TABLE SecurityAuditLogs (
  id uniqueidentifier NOT NULL CONSTRAINT DF_SecurityAuditLogs_id DEFAULT newid(),
  company_id uniqueidentifier NOT NULL,
  actor_user_id uniqueidentifier NULL,
  action nvarchar(100) NOT NULL,
  entity_type nvarchar(100) NOT NULL,
  entity_id uniqueidentifier NULL,
  metadata nvarchar(max) NULL,
  created_at datetime2 NOT NULL CONSTRAINT DF_SecurityAuditLogs_created_at DEFAULT sysdatetime(),
  CONSTRAINT PK_SecurityAuditLogs PRIMARY KEY (id),
  CONSTRAINT FK_SecurityAuditLogs_Company FOREIGN KEY (company_id) REFERENCES Company(id),
  CONSTRAINT FK_SecurityAuditLogs_UserAccount FOREIGN KEY (actor_user_id) REFERENCES UserAccount(id)
)`,
      `
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_SecurityAuditLogs_company_created_at'
    AND object_id = OBJECT_ID('SecurityAuditLogs')
)
CREATE INDEX IX_SecurityAuditLogs_company_created_at ON SecurityAuditLogs(company_id, created_at)`,
    ];

    for (const statement of statements) {
      await this.executeNonQuery(statement);
    }

    // Add critical performance indexes
    const indexStatements = [
      `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserRoles_user_id' AND object_id = OBJECT_ID('UserRoles'))
       CREATE INDEX IX_UserRoles_user_id ON UserRoles(user_id)`,
      `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RolePermissions_role_id' AND object_id = OBJECT_ID('RolePermissions'))
       CREATE INDEX IX_RolePermissions_role_id ON RolePermissions(role_id)`,
      `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Permissions_module_key_action' AND object_id = OBJECT_ID('Permissions'))
       CREATE INDEX IX_Permissions_module_key_action ON Permissions(module_key, action)`,
      `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Roles_company_id_is_active' AND object_id = OBJECT_ID('Roles'))
       CREATE INDEX IX_Roles_company_id_is_active ON Roles(company_id, is_active)`,
    ];

    for (const statement of indexStatements) {
      try {
        await this.executeNonQuery(statement);
      } catch (error) {
        // Ignore index creation errors (may already exist)
        console.warn('Index creation warning:', error);
      }
    }

    SecurityService.schemaEnsured = true;
  }

  private async isSeeded(companyId: string): Promise<boolean> {
    const expectedPermissionCount = flattenPermissionRegistry().length * RBAC_ACTIONS.length;
    const rows = await this.executeQuery<{ permission_count: number; role_count: number }>(
      `SELECT
         (SELECT COUNT(1) FROM Permissions) AS permission_count,
         (SELECT COUNT(1) FROM Roles WHERE company_id = @companyId AND role_name IN ('superadmin', 'admin', 'accountant', 'user')) AS role_count`,
      { companyId }
    );

    const row = rows[0];
    if (!row || row.permission_count < expectedPermissionCount || row.role_count < DEFAULT_SYSTEM_ROLES.length) return false;

    await this.seedLegacyUserRoleAssignments(companyId);
    return true;
  }

  private async seedPermissions(): Promise<void> {
    for (const module of flattenPermissionRegistry()) {
      for (const action of RBAC_ACTIONS) {
        await this.executeNonQuery(
          `MERGE Permissions AS target
           USING (SELECT @moduleKey AS module_key, @action AS action) AS source
           ON target.module_key = source.module_key AND target.action = source.action
           WHEN MATCHED THEN UPDATE SET module_name = @moduleName, description = @description
           WHEN NOT MATCHED THEN INSERT (module_key, module_name, action, description)
             VALUES (@moduleKey, @moduleName, @action, @description);`,
          {
            moduleKey: module.moduleKey,
            moduleName: module.moduleName,
            action,
            description: `${module.moduleName} ${action.toLowerCase()} access`,
          }
        );
      }
    }
  }

  private async seedRoles(companyId: string, actorUserId?: string): Promise<void> {
    for (const role of DEFAULT_SYSTEM_ROLES) {
      await this.executeNonQuery(
        `MERGE Roles AS target
         USING (SELECT @companyId AS company_id, @roleName AS role_name) AS source
         ON target.company_id = source.company_id AND target.role_name = source.role_name
         WHEN MATCHED THEN UPDATE SET description = @description, is_system_role = 1, is_active = 1
         WHEN NOT MATCHED THEN INSERT (company_id, role_name, description, is_system_role, is_active, created_by)
           VALUES (@companyId, @roleName, @description, 1, 1, @actorUserId);`,
        { companyId, roleName: role.roleName, description: role.description, actorUserId: actorUserId || null }
      );
    }

    await this.seedDefaultRolePermissions(companyId);
    await this.seedLegacyUserRoleAssignments(companyId);
  }

  private async seedDefaultRolePermissions(companyId: string): Promise<void> {
    const roles = await this.getRolesWithoutSeed(companyId);
    const permissions = await this.executeQuery<SecurityPermission>(`SELECT id, module_key, module_name, action, description FROM Permissions`);

    const rolePermissionRules: Record<string, (permission: SecurityPermission) => boolean> = {
      [SUPER_ADMIN_ROLE]: () => true,
      admin: (permission) => !permission.module_key.startsWith('system.settings'),
      accountant: (permission) => permission.module_key.startsWith('finance.') || (
        permission.action === 'read' && ['dashboard.overview', 'users.user_management'].includes(permission.module_key)
      ),
      user: (permission) => permission.action === 'read' && ['dashboard.overview'].includes(permission.module_key),
    };

    for (const role of roles) {
      const allow = rolePermissionRules[role.role_name];
      if (!allow) continue;
      for (const permission of permissions) {
        await this.executeNonQuery(
          `IF NOT EXISTS (SELECT 1 FROM RolePermissions WHERE role_id = @roleId AND permission_id = @permissionId)
           INSERT INTO RolePermissions (role_id, permission_id, allowed) VALUES (@roleId, @permissionId, @allowed)`,
          { roleId: role.id, permissionId: permission.id, allowed: allow(permission) }
        );
      }
    }
  }

  private async seedLegacyUserRoleAssignments(companyId: string): Promise<void> {
    const roles = await this.getRolesWithoutSeed(companyId);
    const roleByName = new Map(roles.map((role) => [role.role_name, role]));
    const users = await this.executeQuery<{ id: string; role: string }>(
      `SELECT id, role FROM UserAccount WHERE company_id = @companyId`,
      { companyId }
    );

    for (const user of users) {
      const existingDefaultRole = await this.executeQuery<{ count: number }>(
        `SELECT COUNT(1) AS count
         FROM UserRoles ur
         INNER JOIN Roles r ON r.id = ur.role_id
         WHERE ur.user_id = @userId
           AND r.company_id = @companyId
           AND r.role_name IN ('superadmin', 'admin', 'accountant', 'user')`,
        { userId: user.id, companyId }
      );
      if ((existingDefaultRole[0]?.count || 0) > 0) continue;

      const existingRoles = await this.executeQuery<{ role_name: string }>(
        `SELECT r.role_name
         FROM UserRoles ur
         INNER JOIN Roles r ON r.id = ur.role_id
         WHERE ur.user_id = @userId AND r.company_id = @companyId`,
        { userId: user.id, companyId }
      );
      const roleSource = existingRoles[0]?.role_name || user.role;

      const mappedRole = this.normalizeLegacyRole(roleSource);
      const role = roleByName.get(mappedRole);
      if (!role) continue;

      await this.executeNonQuery(
        `MERGE UserRoles AS target
         USING (SELECT @userId AS user_id, @roleId AS role_id) AS source
         ON target.user_id = source.user_id AND target.role_id = source.role_id
         WHEN NOT MATCHED THEN INSERT (user_id, role_id) VALUES (@userId, @roleId);`,
        { userId: user.id, roleId: role.id }
      );
    }
  }

  private normalizeLegacyRole(role?: string | null): string {
    const normalized = (role || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (['owner', 'superadmin', 'superadministrator'].includes(normalized)) return 'superadmin';
    if (['admin', 'administrator', 'manager', 'transporter', 'transportmanager'].includes(normalized)) return 'admin';
    if (['accountant', 'accounts', 'finance'].includes(normalized)) return 'accountant';
    return 'user';
  }

  private async getRolesWithoutSeed(companyId: string): Promise<SecurityRole[]> {
    return this.executeQuery<SecurityRole>(
      `SELECT id, company_id, role_name, description, is_system_role, is_active, created_by, created_at, updated_by, updated_at
       FROM Roles
       WHERE company_id = @companyId`,
      { companyId }
    );
  }

  private async getRoleById(companyId: string, roleId: string): Promise<SecurityRole | null> {
    const rows = await this.executeQuery<SecurityRole>(
      `SELECT id, company_id, role_name, description, is_system_role, is_active, created_by, created_at, updated_by, updated_at
       FROM Roles
       WHERE id = @roleId AND company_id = @companyId`,
      { roleId, companyId }
    );
    return rows[0] || null;
  }

  private async getRoleByName(companyId: string, roleName: string): Promise<SecurityRole | null> {
    const rows = await this.executeQuery<SecurityRole>(
      `SELECT id, company_id, role_name, description, is_system_role, is_active, created_by, created_at, updated_by, updated_at
       FROM Roles
       WHERE role_name = @roleName AND company_id = @companyId`,
      { roleName, companyId }
    );
    return rows[0] || null;
  }

  private async assertUserInCompany(companyId: string, userId: string): Promise<void> {
    const rows = await this.executeQuery(`SELECT id FROM UserAccount WHERE id = @userId AND company_id = @companyId`, { userId, companyId });
    if (rows.length === 0) throw new Error('User not found');
  }

  private async audit(companyId: string, actorUserId: string | undefined, action: string, entityType: string, entityId: string | null, metadata?: any) {
    await this.executeNonQuery(
      `INSERT INTO SecurityAuditLogs (company_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES (@companyId, @actorUserId, @action, @entityType, @entityId, @metadata)`,
      {
        companyId,
        actorUserId: actorUserId || null,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    );
  }
}