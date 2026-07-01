import { BaseRepository } from '../base/BaseRepository';
import { ITripRepository } from './interfaces/ITripRepository';
import { Trip, CreateTripData, UpdateTripData } from '../../models/trip';
import * as fs from 'fs';
import * as path from 'path';

export class TripRepository extends BaseRepository implements ITripRepository {
  private getAllTripsQuery: string;
  private getTripByIdQuery: string;
  private createTripQuery: string;
  private updateTripQuery: string;
  private deleteTripQuery: string;

  constructor() {
    super();
    this.getAllTripsQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getAllTrips.sql'),
      'utf8'
    );
    this.getTripByIdQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getTripById.sql'),
      'utf8'
    );
    this.createTripQuery = fs.readFileSync(
      path.join(__dirname, 'queries/createTrip.sql'),
      'utf8'
    );
    this.updateTripQuery = fs.readFileSync(
      path.join(__dirname, 'queries/updateTrip.sql'),
      'utf8'
    );
    this.deleteTripQuery = fs.readFileSync(
      path.join(__dirname, 'queries/deleteTrip.sql'),
      'utf8'
    );
  }

  async getAllTrips(companyId: string): Promise<Trip[]> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getAllTripsQuery);
      return result.recordset;
    } catch (error) {
      console.error('Error in getAllTrips:', error);
      throw new Error('Failed to fetch trips');
    }
  }

  async getTripById(id: string, companyId: string): Promise<Trip | null> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('id', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getTripByIdQuery);
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error in getTripById:', error);
      throw new Error('Failed to fetch trip');
    }
  }

  async createTrip(tripData: CreateTripData, companyId: string): Promise<Trip> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('companyId', sql.UniqueIdentifier, companyId);
      request.input('vehicleId', sql.UniqueIdentifier, tripData.vehicle_id);
      request.input('driverId', sql.UniqueIdentifier, tripData.driver_id);
      request.input('source', sql.NVarChar, tripData.source);
      request.input('destination', sql.NVarChar, tripData.destination);
      request.input('startDate', sql.Date, tripData.start_date);
      request.input('endDate', sql.Date, tripData.end_date || null);
      request.input('status', sql.NVarChar, tripData.status);
      request.input('totalDistanceKm', sql.Decimal(8, 2), tripData.total_distance_km || null);
      request.input('freightAmount', sql.Decimal(10, 2), tripData.freight_amount || null);
      request.input('metadata', sql.NVarChar, tripData.metadata || null);

      const result = await request.query(this.createTripQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in createTrip:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }

  async updateTrip(id: string, updateData: UpdateTripData, companyId: string): Promise<Trip> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('id', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);
      request.input('vehicleId', sql.UniqueIdentifier, updateData.vehicle_id);
      request.input('driverId', sql.UniqueIdentifier, updateData.driver_id);
      request.input('source', sql.NVarChar, updateData.source);
      request.input('destination', sql.NVarChar, updateData.destination);
      request.input('startDate', sql.Date, updateData.start_date);
      request.input('endDate', sql.Date, updateData.end_date);
      request.input('status', sql.NVarChar, updateData.status);
      request.input('totalDistanceKm', sql.Decimal(8, 2), updateData.total_distance_km);
      request.input('freightAmount', sql.Decimal(10, 2), updateData.freight_amount);
      request.input('metadata', sql.NVarChar, updateData.metadata);

      const result = await request.query(this.updateTripQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in updateTrip:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }

  async deleteTrip(id: string, companyId: string): Promise<void> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('id', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      await request.query(this.deleteTripQuery);
    } catch (error) {
      console.error('Error in deleteTrip:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }
}
