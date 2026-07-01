INSERT INTO Container (company_id, container_number, container_type, size_ft)
OUTPUT INSERTED.id, INSERTED.company_id, INSERTED.container_number, INSERTED.container_type, INSERTED.size_ft, INSERTED.is_active, INSERTED.created_at
VALUES (@companyId, @containerNumber, @containerType, @sizeFt)
