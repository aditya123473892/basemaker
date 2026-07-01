SELECT id, company_id, container_number, container_type, size_ft, is_active, created_at
FROM Container
WHERE company_id = @companyId
ORDER BY created_at DESC
