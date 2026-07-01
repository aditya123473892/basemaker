SELECT id, company_id, email, full_name, password_hash, role, is_active
FROM UserAccount
WHERE email = @email AND is_active = 1
