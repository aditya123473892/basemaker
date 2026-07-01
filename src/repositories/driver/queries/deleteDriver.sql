UPDATE Driver
SET is_active = 0,
    updated_at = SYSDATETIME()
WHERE id = @driverId AND company_id = @companyId
