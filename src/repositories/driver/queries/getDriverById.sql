SELECT id, company_id, full_name, phone, license_number, is_active, metadata, created_at, updated_at
FROM Driver
WHERE id = @driverId AND company_id = @companyId
