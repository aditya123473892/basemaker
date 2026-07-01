INSERT INTO Driver (company_id, full_name, phone, license_number)
OUTPUT INSERTED.id, INSERTED.company_id, INSERTED.full_name, INSERTED.phone, INSERTED.license_number, INSERTED.is_active, INSERTED.metadata, INSERTED.created_at, INSERTED.updated_at
VALUES (@companyId, @fullName, @phone, @licenseNumber)
