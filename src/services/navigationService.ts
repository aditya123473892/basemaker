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

  private async seedDefaultMenus(): Promise<void> {
    if (NavigationService.sidebarSeedChecked) return;

    const existing = await this.executeQuery<{ count: number }>(`SELECT COUNT(1) AS count FROM SidebarMenus`);
    if (existing[0]?.count > 0) {
      NavigationService.sidebarSeedChecked = true;
      return;
    }

    await this.executeNonQuery(`
INSERT INTO SidebarMenus (label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES
('Dashboard', '/dashboard', 'BarChart3', NULL, NULL, 10),
('Security', '/dashboard/security', 'Shield', 'SECURITY', 'VIEW', 20)`);

    await this.executeNonQuery(`
DECLARE @accountsId uniqueidentifier = newid();
INSERT INTO SidebarMenus (id, label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES (@accountsId, 'Accounts', NULL, 'Wallet', 'ACCOUNTS', 'VIEW', 30);

INSERT INTO SidebarMenus (parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order)
VALUES
(@accountsId, 'Invoices', '/dashboard/accounts/invoices', 'FileText', 'ACCOUNTS', 'VIEW', 10),
(@accountsId, 'Payments', '/dashboard/accounts/payments', 'CreditCard', 'ACCOUNTS', 'VIEW', 20)`);
    NavigationService.sidebarSeedChecked = true;
  }
}
