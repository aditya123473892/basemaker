import { SidebarMenuItem, SidebarMenuRow } from '../models/navigation';
import { BaseRepository } from '../repositories/base/BaseRepository';
import { SecurityService } from './securityService';

export class NavigationService extends BaseRepository {
  private static sidebarSchemaEnsured = false;
  private static sidebarSeedChecked = false;
  private securityService = new SecurityService();

  async getSidebarMenus(companyId: string, userId: string, legacyRole?: string): Promise<SidebarMenuItem[]> {
    await this.ensureSidebarSchema();
    await this.seedDefaultMenus();

    const rows = await this.executeQuery<SidebarMenuRow>(
      `SELECT id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order, is_active
       FROM SidebarMenus
       WHERE is_active = 1
       ORDER BY parent_id, sort_order, label`
    );

    const permissions = await this.securityService.getEffectivePermissions(companyId, userId);
    const allowedSet = new Set(
      permissions
        .filter((permission) => permission.allowed)
        .map((permission) => `${permission.moduleKey}:${permission.action}`)
    );

    const visibleRows: SidebarMenuRow[] = [];
    for (const row of rows) {
      if (!row.permission_module_key || !row.permission_action) {
        visibleRows.push(row);
        continue;
      }

      if (allowedSet.has(`${row.permission_module_key}:${row.permission_action}`)) visibleRows.push(row);
    }

    return this.buildTree(visibleRows);
  }

  private buildTree(rows: SidebarMenuRow[]): SidebarMenuItem[] {
    const byId = new Map<string, SidebarMenuItem>();
    const roots: SidebarMenuItem[] = [];

    for (const row of rows) {
      byId.set(row.id, {
        id: row.id,
        label: row.label,
        path: row.path,
        iconKey: row.icon_key,
        moduleKey: row.permission_module_key,
        action: row.permission_action,
        children: [],
      });
    }

    for (const row of rows) {
      const item = byId.get(row.id);
      if (!item) continue;

      if (row.parent_id && byId.has(row.parent_id)) {
        byId.get(row.parent_id)?.children.push(item);
      } else {
        roots.push(item);
      }
    }

    return roots.filter((item) => item.path || item.children.length > 0);
  }

  private async ensureSidebarSchema(): Promise<void> {
    if (NavigationService.sidebarSchemaEnsured) return;

    await this.executeNonQuery(`
IF OBJECT_ID('SidebarMenus', 'U') IS NULL
CREATE TABLE SidebarMenus (
  id uniqueidentifier NOT NULL CONSTRAINT DF_SidebarMenus_id DEFAULT newid(),
  parent_id uniqueidentifier NULL,
  label nvarchar(150) NOT NULL,
  path nvarchar(300) NULL,
  icon_key nvarchar(80) NULL,
  permission_module_key nvarchar(100) NULL,
  permission_action nvarchar(50) NULL,
  sort_order int NOT NULL CONSTRAINT DF_SidebarMenus_sort_order DEFAULT 0,
  is_active bit NOT NULL CONSTRAINT DF_SidebarMenus_is_active DEFAULT 1,
  created_at datetime2 NOT NULL CONSTRAINT DF_SidebarMenus_created_at DEFAULT sysdatetime(),
  updated_at datetime2 NULL,
  CONSTRAINT PK_SidebarMenus PRIMARY KEY (id),
  CONSTRAINT FK_SidebarMenus_Parent FOREIGN KEY (parent_id) REFERENCES SidebarMenus(id)
)`);
    NavigationService.sidebarSchemaEnsured = true;
  }

  async getAllMenus(companyId: string): Promise<SidebarMenuRow[]> {
    await this.ensureSidebarSchema();
    return this.executeQuery<SidebarMenuRow>(
      `SELECT id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order, is_active
       FROM SidebarMenus
       ORDER BY parent_id, sort_order, label`
    );
  }

  async createMenu(companyId: string, data: {
    label: string;
    path?: string | null;
    iconKey?: string | null;
    permissionModuleKey?: string | null;
    permissionAction?: string | null;
    parentId?: string | null;
    sortOrder?: number;
  }): Promise<SidebarMenuRow> {
    await this.ensureSidebarSchema();

    const id = await this.executeScalar<string>(
      `INSERT INTO SidebarMenus (label, path, icon_key, permission_module_key, permission_action, parent_id, sort_order)
       OUTPUT inserted.id
       VALUES (@label, @path, @iconKey, @permissionModuleKey, @permissionAction, @parentId, @sortOrder)`,
      {
        label: data.label,
        path: data.path ?? null,
        iconKey: data.iconKey ?? null,
        permissionModuleKey: data.permissionModuleKey ?? null,
        permissionAction: data.permissionAction ?? null,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
      }
    );

    const row = await this.executeQuery<SidebarMenuRow>(
      `SELECT id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order, is_active
       FROM SidebarMenus
       WHERE id = @id`,
      { id }
    );
    return row[0];
  }

  async updateMenu(companyId: string, id: string, data: {
    label?: string;
    path?: string | null;
    iconKey?: string | null;
    permissionModuleKey?: string | null;
    permissionAction?: string | null;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<SidebarMenuRow> {
    await this.ensureSidebarSchema();

    const row = await this.executeQuery<SidebarMenuRow>(
      `SELECT id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order, is_active
       FROM SidebarMenus
       WHERE id = @id`,
      { id }
    );
    if (!row[0]) throw new Error('Menu not found');

    await this.executeNonQuery(
      `UPDATE SidebarMenus
       SET label = COALESCE(@label, label),
           path = @path,
           icon_key = @iconKey,
           permission_module_key = @permissionModuleKey,
           permission_action = @permissionAction,
           parent_id = @parentId,
           sort_order = COALESCE(@sortOrder, sort_order),
           is_active = COALESCE(@isActive, is_active),
           updated_at = sysdatetime()
       WHERE id = @id`,
      {
        id,
        label: data.label ?? null,
        path: data.path ?? null,
        iconKey: data.iconKey ?? null,
        permissionModuleKey: data.permissionModuleKey ?? null,
        permissionAction: data.permissionAction ?? null,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }
    );

    const updated = await this.executeQuery<SidebarMenuRow>(
      `SELECT id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order, is_active
       FROM SidebarMenus
       WHERE id = @id`,
      { id }
    );
    return updated[0];
  }

  async deleteMenu(companyId: string, id: string): Promise<void> {
    await this.ensureSidebarSchema();
    await this.executeNonQuery(`DELETE FROM SidebarMenus WHERE id = @id`, { id });
  }

  private async seedDefaultMenus(): Promise<void> {
    if (NavigationService.sidebarSeedChecked) return;

    const existing = await this.executeQuery<{ count: number }>(`SELECT COUNT(1) AS count FROM SidebarMenus`);
    if (existing[0]?.count > 0) {
      await this.executeNonQuery(`
UPDATE SidebarMenus SET permission_module_key = 'dashboard.overview', permission_action = 'read' WHERE path = '/dashboard';
UPDATE SidebarMenus SET permission_module_key = 'users.role_management', permission_action = 'read' WHERE path = '/dashboard/security';
UPDATE SidebarMenus SET path = '/dashboard/user-master', permission_module_key = 'users.user_management', permission_action = 'read' WHERE path IN ('/dashboard/users', '/dashboard/user-master');
UPDATE SidebarMenus SET permission_module_key = 'transport.drivers', permission_action = 'read' WHERE path = '/dashboard/drivers';
UPDATE SidebarMenus SET permission_module_key = 'transport.vehicles', permission_action = 'read' WHERE path = '/dashboard/vehicles';
UPDATE SidebarMenus SET permission_module_key = 'transport.trips', permission_action = 'read' WHERE path = '/dashboard/trips';
UPDATE SidebarMenus SET permission_module_key = 'finance.reports', permission_action = 'read' WHERE path = '/dashboard/accounts/invoices';
UPDATE SidebarMenus SET permission_module_key = 'finance.fee_collection', permission_action = 'read' WHERE path = '/dashboard/accounts/payments';`);
      NavigationService.sidebarSeedChecked = true;
      return;
    }

    await this.executeNonQuery(`
DECLARE @userManagementId uniqueidentifier = newid();
DECLARE @transportId uniqueidentifier = newid();
DECLARE @routeGroupId uniqueidentifier = newid();
DECLARE @financeId uniqueidentifier = newid();

INSERT INTO SidebarMenus (label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES
('Dashboard', '/dashboard', 'BarChart3', 'dashboard.overview', 'read', 5);

INSERT INTO SidebarMenus (id, label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES
(@userManagementId, 'Users', NULL, 'Users', NULL, NULL, 10),
(@transportId, 'Transport', NULL, 'Truck', NULL, NULL, 20),
(@financeId, 'Finance', NULL, 'Wallet', NULL, NULL, 30);

INSERT INTO SidebarMenus (id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES
(@routeGroupId, @transportId, 'Routes', NULL, 'Route', NULL, NULL, 10);

INSERT INTO SidebarMenus (parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES
(@userManagementId, 'User Management', '/dashboard/user-master', 'User', 'users.user_management', 'read', 10),
(@userManagementId, 'Role Management', '/dashboard/security', 'Shield', 'users.role_management', 'read', 20),
(@routeGroupId, 'Trips', '/dashboard/trips', 'Route', 'transport.trips', 'read', 10),
(@transportId, 'Vehicles', '/dashboard/vehicles', 'Truck', 'transport.vehicles', 'read', 20),
(@transportId, 'Drivers', '/dashboard/drivers', 'User', 'transport.drivers', 'read', 30),
(@financeId, 'Fee Collection', '/dashboard/accounts/payments', 'CreditCard', 'finance.fee_collection', 'read', 10),
(@financeId, 'Reports', '/dashboard/accounts/invoices', 'FileText', 'finance.reports', 'read', 20)`);
    NavigationService.sidebarSeedChecked = true;
  }
}
