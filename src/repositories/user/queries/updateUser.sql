UPDATE UserAccount
SET full_name = ISNULL(@fullName, full_name),
    role = ISNULL(@role, role),
    is_active = ISNULL(@isActive, is_active),
    updated_at = SYSDATETIME()
WHERE id = @userId AND company_id = @companyId;

SELECT id, company_id, email, full_name, role, is_active, last_login_at, created_at, updated_at
FROM UserAccount
WHERE id = @userId AND company_id = @companyId
