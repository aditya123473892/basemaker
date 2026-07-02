# RBAC Database Migration Guide

This guide explains how to transition from runtime schema creation to a proper migration-based workflow using Prisma Migrate.

## Why Migrate?

The current implementation creates tables and indexes at runtime via `ensureSecuritySchema()`. While this works for development, it's not ideal for production because:

- **No version control** for database changes
- **Difficult rollbacks** if something goes wrong
- **Race conditions** in multi-server deployments
- **No audit trail** of schema changes
- **Harder to review** changes before deployment

## Prerequisites

1. Install Prisma CLI (if not already installed):

   ```bash
   npm install -g prisma
   ```

2. Ensure your `DATABASE_URL` is set in `.env`:
   ```env
   DATABASE_URL="sqlserver://localhost:1433;database=your_db;user=sa;password=your_password;trustServerCertificate=true"
   ```

## Step 1: Create Initial Migration

Generate the SQL Server schema from existing tables:

```bash
cd backend
npx prisma migrate diff --from-url "" --to-schema-datamodel ./prisma/schema.prisma --script > ./prisma/migrations/001_initial_schema.sql
```

## Step 2: Convert Runtime Schema to Migrations

Create a migration file `002_rbac_schema.sql` in `prisma/migrations/`:

```sql
-- CreateRolesTable
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
);

-- CreatePermissionsTable
CREATE TABLE Permissions (
  id uniqueidentifier NOT NULL CONSTRAINT DF_Permissions_id DEFAULT newid(),
  module_key nvarchar(100) NOT NULL,
  module_name nvarchar(150) NOT NULL,
  action nvarchar(50) NOT NULL,
  description nvarchar(500) NULL,
  CONSTRAINT PK_Permissions PRIMARY KEY (id),
  CONSTRAINT UQ_Permissions_module_action UNIQUE (module_key, action)
);

-- CreateRolePermissionsTable
CREATE TABLE RolePermissions (
  id uniqueidentifier NOT NULL CONSTRAINT DF_RolePermissions_id DEFAULT newid(),
  role_id uniqueidentifier NOT NULL,
  permission_id uniqueidentifier NOT NULL,
  allowed bit NOT NULL CONSTRAINT DF_RolePermissions_allowed DEFAULT 0,
  CONSTRAINT PK_RolePermissions PRIMARY KEY (id),
  CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
  CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE,
  CONSTRAINT UQ_RolePermissions_role_permission UNIQUE (role_id, permission_id)
);

-- CreateUserRolesTable
CREATE TABLE UserRoles (
  id uniqueidentifier NOT NULL CONSTRAINT DF_UserRoles_id DEFAULT newid(),
  user_id uniqueidentifier NOT NULL,
  role_id uniqueidentifier NOT NULL,
  CONSTRAINT PK_UserRoles PRIMARY KEY (id),
  CONSTRAINT FK_UserRoles_UserAccount FOREIGN KEY (user_id) REFERENCES UserAccount(id) ON DELETE CASCADE,
  CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE,
  CONSTRAINT UQ_UserRoles_user_role UNIQUE (user_id, role_id)
);

-- CreateSecurityAuditLogsTable
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
);
```

## Step 3: Add Indexes Migration

Create `003_rbac_indexes.sql`:

```sql
-- Performance indexes for RBAC queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserRoles_user_id' AND object_id = OBJECT_ID('UserRoles'))
  CREATE INDEX IX_UserRoles_user_id ON UserRoles(user_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RolePermissions_role_id' AND object_id = OBJECT_ID('RolePermissions'))
  CREATE INDEX IX_RolePermissions_role_id ON RolePermissions(role_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Permissions_module_key_action' AND object_id = OBJECT_ID('Permissions'))
  CREATE INDEX IX_Permissions_module_key_action ON Permissions(module_key, action);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Roles_company_id_is_active' AND object_id = OBJECT_ID('Roles'))
  CREATE INDEX IX_Roles_company_id_is_active ON Roles(company_id, is_active);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityAuditLogs_company_created_at' AND object_id = OBJECT_ID('SecurityAuditLogs'))
  CREATE INDEX IX_SecurityAuditLogs_company_created_at ON SecurityAuditLogs(company_id, created_at);
```

## Step 4: Seed Data Migration

Create `004_rbac_seed_data.sql` for initial permission data:

```sql
-- Seed permissions from module registry
-- Note: This is a simplified example. Run the seed scripts instead.
DECLARE @moduleKey nvarchar(100);
DECLARE @moduleName nvarchar(150);
DECLARE @action nvarchar(50);
DECLARE @description nvarchar(500);

-- Dashboard permissions
INSERT INTO Permissions (module_key, module_name, action, description) VALUES
('dashboard.overview', 'Dashboard / Dashboard', 'read', 'Dashboard overview read access'),
('dashboard.overview', 'Dashboard / Dashboard', 'create', 'Dashboard overview create access'),
('dashboard.overview', 'Dashboard / Dashboard', 'update', 'Dashboard overview update access'),
('dashboard.overview', 'Dashboard / Dashboard', 'delete', 'Dashboard overview delete access');

-- User management permissions
INSERT INTO Permissions (module_key, module_name, action, description) VALUES
('users.user_management', 'Users / User Management', 'read', 'User management read access'),
('users.user_management', 'Users / User Management', 'create', 'User management create access'),
('users.user_management', 'Users / User Management', 'update', 'User management update access'),
('users.user_management', 'Users / User Management', 'delete', 'User management delete access');

-- Role management permissions
INSERT INTO Permissions (module_key, module_name, action, description) VALUES
('users.role_management', 'Users / Role Management', 'read', 'Role management read access'),
('users.role_management', 'Users / Role Management', 'create', 'Role management create access'),
('users.role_management', 'Users / Role Management', 'update', 'Role management update access'),
('users.role_management', 'Users / Role Management', 'delete', 'Role management delete access');

-- Add all other permissions from MODULE_REGISTRY...
```

## Step 5: Seed Default Roles

Create `005_rbac_default_roles.sql`:

```sql
-- Seed system roles
-- This should be run per-company, not globally
-- Use the existing seed scripts: npm run db:rbac

-- Default role permissions for 'superadmin' role (all permissions)
-- This query will be executed per company during seeding
DECLARE @companyId uniqueidentifier = 'your-company-id-here';
DECLARE @superAdminRoleId uniqueidentifier;

SELECT @superAdminRoleId = id FROM Roles
WHERE company_id = @companyId AND role_name = 'superadmin';

INSERT INTO RolePermissions (role_id, permission_id, allowed)
SELECT @superAdminRoleId, p.id, 1
FROM Permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM RolePermissions rp
  WHERE rp.role_id = @superAdminRoleId AND rp.permission_id = p.id
);
```

## Step 6: Update SecurityService

Modify `securityService.ts` to check if migrations have been run:

```typescript
private async ensureSecuritySchema(): Promise<void> {
  // Skip if migrations have been applied
  if (SecurityService.schemaEnsured) return;

  // In production with migrations, set a flag
  if (process.env.NODE_ENV === 'production') {
    // Assume migrations handled schema
    SecurityService.schemaEnsured = true;
    return;
  }

  // Development: keep runtime schema creation as fallback
  // ... existing code ...
}
```

## Step 7: Update Package Scripts

Add new scripts to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "ts-node scripts/seedRbacData.ts",
    "db:reset": "prisma migrate reset && npm run db:seed"
  }
}
```

## Step 8: Workflow for Schema Changes

When you need to modify the RBAC schema:

1. **Modify Prisma schema** (`prisma/schema.prisma`)
2. **Generate migration**:
   ```bash
   npx prisma migrate dev --name description_of_change
   ```
3. **Update seed scripts** if needed
4. **Deploy**:
   ```bash
   npx prisma migrate deploy
   ```

## Step 9: Rollback Procedure

To rollback a migration:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back "migration_name"

# Or manually in database
-- Note: SQL Server doesn't support DROP TABLE IF EXISTS in older versions
IF OBJECT_ID('TableName', 'U') IS NOT NULL
  ALTER TABLE TableName NOCHECK CONSTRAINT ALL;
  DROP TABLE TableName;
```

## Best Practices

1. **Never modify runtime schema code** after migrating to migrations
2. **Always test migrations** on staging first
3. **Backup database** before applying migrations in production
4. **Use migrations for ALL schema changes**, including indexes
5. **Keep migrations idempotent** where possible
6. **Document breaking changes** in migration comments

## Migration Checklist

- [ ] Backup database
- [ ] Test migrations locally
- [ ] Verify seed scripts work
- [ ] Test rollback procedure
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Update documentation
- [ ] Deploy to production during maintenance window

## Environment Variables

Add to `.env`:

```env
# Database
DATABASE_URL="sqlserver://localhost:1433;database=fleet_management;user=sa;password=YourPassword;trustServerCertificate=true"

# Migration control
RUN_RBAC_MIGRATIONS=true  # Set to false to skip runtime schema creation in production
```

## Common Issues

### Issue: "Object already exists"

This means the table was created at runtime before migrations ran. Solution:

```sql
-- Check if table exists
IF OBJECT_ID('TableName', 'U') IS NOT NULL
  PRINT 'Table exists'
ELSE
  CREATE TABLE ...
```

### Issue: Migration out of sync

Reset migrations (WARNING: data loss):

```bash
npx prisma migrate reset
```

## Support

For Prisma SQL Server issues, see:

- https://www.prisma.io/docs/reference/database-reference/sql-server
