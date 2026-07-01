UPDATE UserAccount
SET is_active = 0,
    updated_at = SYSDATETIME()
WHERE id = @userId AND company_id = @companyId
