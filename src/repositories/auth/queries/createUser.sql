INSERT INTO UserAccount (company_id, email, full_name, password_hash, role, is_active)
OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.company_id
VALUES (@company_id, @email, @full_name, @password_hash, @role, 1)
