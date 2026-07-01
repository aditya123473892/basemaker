INSERT INTO UserAccount (company_id, email, full_name, password_hash, role)
OUTPUT INSERTED.id, INSERTED.company_id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.is_active, INSERTED.last_login_at, INSERTED.created_at, INSERTED.updated_at
VALUES (@companyId, @email, @fullName, @passwordHash, @role)
