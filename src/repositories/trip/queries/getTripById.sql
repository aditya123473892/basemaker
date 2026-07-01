SELECT id, company_id, vehicle_id, driver_id, source, destination, start_date, end_date, status, total_distance_km, freight_amount, metadata, created_at, updated_at
FROM Trip
WHERE id = @id AND company_id = @companyId
