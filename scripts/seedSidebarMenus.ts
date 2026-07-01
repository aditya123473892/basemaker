import * as dotenv from 'dotenv';
import * as path from 'path';
import * as sql from 'mssql';

dotenv.config({ path: path.join(__dirname, '../.env') });

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

interface MenuSeed {
  label: string;
  path: string | null;
  iconKey: string;
  moduleKey: string | null;
  action: string | null;
  sortOrder: number;
  children?: MenuSeed[];
}

const menus: MenuSeed[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    iconKey: 'BarChart3',
    moduleKey: null,
    action: null,
    sortOrder: 10,
  },
  {
    label: 'Security',
    path: '/dashboard/security',
    iconKey: 'Shield',
    moduleKey: 'SECURITY',
    action: 'VIEW',
    sortOrder: 20,
  },
  {
    label: 'User Master',
    path: '/dashboard/user-master',
    iconKey: 'Users',
    moduleKey: 'USERS',
    action: 'VIEW',
    sortOrder: 25,
  },
  {
    label: 'Accounts',
    path: null,
    iconKey: 'Wallet',
    moduleKey: 'ACCOUNTS',
    action: 'VIEW',
    sortOrder: 30,
    children: [
      {
        label: 'Invoices',
        path: '/dashboard/accounts/invoices',
        iconKey: 'FileText',
        moduleKey: 'ACCOUNTS',
        action: 'VIEW',
        sortOrder: 10,
      },
      {
        label: 'Payments',
        path: '/dashboard/accounts/payments',
        iconKey: 'CreditCard',
        moduleKey: 'ACCOUNTS',
        action: 'VIEW',
        sortOrder: 20,
      },
    ],
  },
];

async function ensureSidebarSchema(pool: sql.ConnectionPool) {
  await pool.request().query(`
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
}

async function upsertMenu(pool: sql.ConnectionPool, menu: MenuSeed, parentId: string | null): Promise<string> {
  const result = await pool.request()
    .input('parentId', sql.UniqueIdentifier, parentId)
    .input('label', sql.NVarChar, menu.label)
    .input('path', sql.NVarChar, menu.path)
    .input('iconKey', sql.NVarChar, menu.iconKey)
    .input('moduleKey', sql.NVarChar, menu.moduleKey)
    .input('action', sql.NVarChar, menu.action)
    .input('sortOrder', sql.Int, menu.sortOrder)
    .query(`
DECLARE @menuId uniqueidentifier;

SELECT TOP 1 @menuId = id
FROM SidebarMenus
WHERE label = @label
  AND ((@parentId IS NULL AND parent_id IS NULL) OR parent_id = @parentId);

IF @menuId IS NULL
BEGIN
  SET @menuId = newid();
  INSERT INTO SidebarMenus (
    id, parent_id, label, path, icon_key, permission_module_key, permission_action, sort_order, is_active
  )
  VALUES (
    @menuId, @parentId, @label, @path, @iconKey, @moduleKey, @action, @sortOrder, 1
  );
END
ELSE
BEGIN
  UPDATE SidebarMenus
  SET path = @path,
      icon_key = @iconKey,
      permission_module_key = @moduleKey,
      permission_action = @action,
      sort_order = @sortOrder,
      is_active = 1,
      updated_at = sysdatetime()
  WHERE id = @menuId;
END

SELECT @menuId AS id;
`);

  const menuId = result.recordset[0].id;
  for (const child of menu.children || []) {
    await upsertMenu(pool, child, menuId);
  }

  return menuId;
}

async function main() {
  const pool = await sql.connect(config);
  await ensureSidebarSchema(pool);

  for (const menu of menus) {
    await upsertMenu(pool, menu, null);
  }

  const result = await pool.request().query(`
SELECT
  parent.label AS parent_label,
  child.label,
  child.path,
  child.icon_key,
  child.permission_module_key,
  child.permission_action,
  child.sort_order
FROM SidebarMenus child
LEFT JOIN SidebarMenus parent ON parent.id = child.parent_id
WHERE child.is_active = 1
ORDER BY ISNULL(parent.sort_order, child.sort_order), parent.label, child.sort_order, child.label
`);

  console.log('Sidebar menus seeded:');
  for (const row of result.recordset) {
    const prefix = row.parent_label ? `  ${row.parent_label} > ` : '';
    console.log(`- ${prefix}${row.label} (${row.path || 'group'})`);
  }

  await pool.close();
}

main().catch(async (error) => {
  console.error(error.message || error);
  process.exit(1);
});
