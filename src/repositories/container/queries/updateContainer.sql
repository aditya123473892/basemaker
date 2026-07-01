UPDATE Container
SET container_number = ISNULL(@containerNumber, container_number),
    container_type = ISNULL(@containerType, container_type),
    size_ft = ISNULL(@sizeFt, size_ft),
    is_active = ISNULL(@isActive, is_active),
    updated_at = SYSDATETIME()
OUTPUT INSERTED.id, INSERTED.company_id, INSERTED.container_number, INSERTED.container_type, INSERTED.size_ft, INSERTED.is_active, INSERTED.created_at
WHERE id = @id AND company_id = @companyId
