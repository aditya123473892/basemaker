SELECT id, company_id, full_name, phone, license_number, is_active, metadata, created_at, updated_at
FROM Driver
WHERE company_id = @companyId
ORDER BY created_at DESC
