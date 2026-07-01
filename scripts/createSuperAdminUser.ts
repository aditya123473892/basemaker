import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as sql from 'mssql';
import { SecurityService } from '../src/services/securityService';
import { connectDB } from '../src/config/database';

dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.env.SUPERADMIN_EMAIL || 'superadmin@fleet.local';
const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';
const fullName = process.env.SUPERADMIN_NAME || 'Super Admin';

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

async function main() {
  const pool = await sql.connect(config);
  const companyResult = await pool.request().query(`
    SELECT TOP 1 id
    FROM Company
    WHERE ISNULL(is_active, 1) = 1
    ORDER BY created_at ASC
  `);

  const companyId = companyResult.recordset[0]?.id;
  if (!companyId) {
    throw new Error('No active company found. Create/signup a company first.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userResult = await pool.request()
    .input('companyId', sql.UniqueIdentifier, companyId)
    .input('email', sql.NVarChar, email)
    .input('fullName', sql.NVarChar, fullName)
    .input('passwordHash', sql.NVarChar, passwordHash)
    .query(`
      MERGE UserAccount AS target
      USING (SELECT @companyId AS company_id, @email AS email) AS source
      ON target.company_id = source.company_id AND target.email = source.email
      WHEN MATCHED THEN
        UPDATE SET full_name = @fullName,
                   password_hash = @passwordHash,
                   role = 'OWNER',
                   is_active = 1,
                   updated_at = sysdatetime()
      WHEN NOT MATCHED THEN
        INSERT (company_id, email, full_name, password_hash, role, is_active)
        VALUES (@companyId, @email, @fullName, @passwordHash, 'OWNER', 1)
      OUTPUT inserted.id;
    `);

  const userId = userResult.recordset[0].id;
  await connectDB();
  const securityService = new SecurityService();
  await securityService.ensureSecuritySeed(companyId, userId);
  await securityService.assignSystemRoleByName(companyId, userId, 'Super Admin', userId);

  console.log('Super Admin user ready');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  await pool.close();
}

main().catch(async (error) => {
  console.error(error.message || error);
  process.exit(1);
});
