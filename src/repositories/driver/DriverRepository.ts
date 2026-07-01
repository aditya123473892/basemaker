import { BaseRepository } from '../base/BaseRepository';
import { IDriverRepository } from './interfaces/IDriverRepository';
import { Driver, CreateDriverData, UpdateDriverData } from '../../models/driver';
import * as fs from 'fs';
import * as path from 'path';

export class DriverRepository extends BaseRepository implements IDriverRepository {
  private getAllDriversQuery: string;
  private getDriverByIdQuery: string;
  private createDriverQuery: string;
  private updateDriverQuery: string;
  private deleteDriverQuery: string;

  constructor() {
    super();
    this.getAllDriversQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getAllDrivers.sql'),
      'utf8'
    );
    this.getDriverByIdQuery = fs.readFileSync(
      path.join(__dirname, 'queries/getDriverById.sql'),
      'utf8'
    );
    this.createDriverQuery = fs.readFileSync(
      path.join(__dirname, 'queries/createDriver.sql'),
      'utf8'
    );
    this.updateDriverQuery = fs.readFileSync(
      path.join(__dirname, 'queries/updateDriver.sql'),
      'utf8'
    );
    this.deleteDriverQuery = fs.readFileSync(
      path.join(__dirname, 'queries/deleteDriver.sql'),
      'utf8'
    );
  }

  async getAllDrivers(companyId: string): Promise<Driver[]> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getAllDriversQuery);
      return result.recordset;
    } catch (error) {
      console.error('Error in getAllDrivers:', error);
      throw new Error('Failed to fetch drivers');
    }
  }

  async getDriverById(id: string, companyId: string): Promise<Driver | null> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('driverId', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      const result = await request.query(this.getDriverByIdQuery);
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error in getDriverById:', error);
      throw new Error('Failed to fetch driver');
    }
  }

  async createDriver(driverData: CreateDriverData, companyId: string): Promise<Driver> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      // Explicitly set parameter types for UUID fields
      request.input('companyId', sql.UniqueIdentifier, companyId);
      request.input('fullName', sql.NVarChar, driverData.full_name);
      request.input('phone', sql.NVarChar, driverData.phone);
      request.input('licenseNumber', sql.NVarChar, driverData.license_number || null);

      const result = await request.query(this.createDriverQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in createDriver:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }

  async updateDriver(id: string, updateData: UpdateDriverData, companyId: string): Promise<Driver> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('driverId', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);
      request.input('fullName', sql.NVarChar, updateData.full_name);
      request.input('phone', sql.NVarChar, updateData.phone);
      request.input('licenseNumber', sql.NVarChar, updateData.license_number);
      request.input('isActive', sql.Bit, updateData.is_active);

      const result = await request.query(this.updateDriverQuery);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in updateDriver:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }

  async deleteDriver(id: string, companyId: string): Promise<void> {
    try {
      const { pool, sql } = await import('../../config/database');
      const request = pool.request();

      request.input('driverId', sql.UniqueIdentifier, id);
      request.input('companyId', sql.UniqueIdentifier, companyId);

      await request.query(this.deleteDriverQuery);
    } catch (error) {
      console.error('Error in deleteDriver:', error);
      throw new Error('Database operation failed: ' + (error as Error).message);
    }
  }
}
