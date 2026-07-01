UPDATE Trip
SET vehicle_id = ISNULL(@vehicleId, vehicle_id),
    driver_id = ISNULL(@driverId, driver_id),
    source = ISNULL(@source, source),
    destination = ISNULL(@destination, destination),
    start_date = ISNULL(@startDate, start_date),
    end_date = ISNULL(@endDate, end_date),
    status = ISNULL(@status, status),
    total_distance_km = ISNULL(@totalDistanceKm, total_distance_km),
    freight_amount = ISNULL(@freightAmount, freight_amount),
    metadata = ISNULL(@metadata, metadata),
    updated_at = SYSDATETIME()
OUTPUT INSERTED.id, INSERTED.company_id, INSERTED.vehicle_id, INSERTED.driver_id, INSERTED.source, INSERTED.destination, INSERTED.start_date, INSERTED.end_date, INSERTED.status, INSERTED.total_distance_km, INSERTED.freight_amount, INSERTED.metadata, INSERTED.created_at, INSERTED.updated_at
WHERE id = @id AND company_id = @companyId
