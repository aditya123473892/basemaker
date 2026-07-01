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

async function main() {
  const pool = await sql.connect(config);
  for (const statement of statements) {
    await pool.request().query(statement);
  }

  const result = await pool.request().query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME IN ('Roles', 'Permissions', 'RolePermissions', 'UserRoles', 'SecurityAuditLogs')
    ORDER BY TABLE_NAME
  `);

  console.log('RBAC tables ready:');
  for (const row of result.recordset) {
    console.log(`- ${row.TABLE_NAME}`);
  }

  await pool.close();
}

main().catch(async (error) => {
  console.error(error.message || error);
  process.exit(1);
});
