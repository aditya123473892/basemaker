INSERT INTO Trip (company_id, vehicle_id, driver_id, source, destination, start_date, end_date, status, total_distance_km, freight_amount, metadata)
OUTPUT INSERTED.id, INSERTED.company_id, INSERTED.vehicle_id, INSERTED.driver_id, INSERTED.source, INSERTED.destination, INSERTED.start_date, INSERTED.end_date, INSERTED.status, INSERTED.total_distance_km, INSERTED.freight_amount, INSERTED.metadata, INSERTED.created_at, INSERTED.updated_at
VALUES (@companyId, @vehicleId, @driverId, @source, @destination, @startDate, @endDate, @status, @totalDistanceKm, @freightAmount, @metadata)
