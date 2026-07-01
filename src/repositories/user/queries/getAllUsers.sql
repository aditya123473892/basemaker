SELECT id, company_id, email, full_name, role, is_active, last_login_at, created_at, updated_at
FROM UserAccount
WHERE company_id = @companyId AND is_active = 1
ORDER BY created_at DESC
