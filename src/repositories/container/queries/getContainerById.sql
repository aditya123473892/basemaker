SELECT id, company_id, container_number, container_type, size_ft, is_active, created_at
FROM Container
WHERE id = @id AND company_id = @companyId
