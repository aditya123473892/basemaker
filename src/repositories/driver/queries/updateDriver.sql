UPDATE Driver
SET full_name = ISNULL(@fullName, full_name),
    phone = ISNULL(@phone, phone),
    license_number = ISNULL(@licenseNumber, license_number),
    is_active = ISNULL(@isActive, is_active),
    updated_at = SYSDATETIME()
WHERE id = @driverId AND company_id = @companyId;

SELECT id, company_id, full_name, phone, license_number, is_active, metadata, created_at, updated_at
FROM Driver
WHERE id = @driverId AND company_id = @companyId
