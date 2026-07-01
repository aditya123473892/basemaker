SELECT id, company_id, container_number, container_type, size_ft, is_active, created_at
FROM Container
WHERE container_number = @containerNumber AND company_id = @companyId
