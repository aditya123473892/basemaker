import { DriverRepository } from '../repositories/driver/DriverRepository';
import { IDriverRepository } from '../repositories/driver/interfaces/IDriverRepository';
import { Driver, CreateDriverData, UpdateDriverData } from '../models/driver';

export class DriverService {
  private driverRepository: IDriverRepository;

  constructor(driverRepository: IDriverRepository = new DriverRepository()) {
    this.driverRepository = driverRepository;
  }

  async getAllDrivers(companyId: string): Promise<Driver[]> {
    try {
      return await this.driverRepository.getAllDrivers(companyId);
    } catch (error) {
      console.error('Error in DriverService.getAllDrivers:', error);
      throw new Error('Failed to fetch drivers');
    }
  }

  async getDriverById(id: string, companyId: string): Promise<Driver | null> {
    try {
      return await this.driverRepository.getDriverById(id, companyId);
    } catch (error) {
      console.error('Error in DriverService.getDriverById:', error);
      throw new Error('Failed to fetch driver');
    }
  }

  async createDriver(driverData: CreateDriverData, companyId: string): Promise<Driver> {
    try {
      // Validate required fields
      if (!driverData.full_name?.trim()) {
        throw new Error('Driver name is required');
      }
      if (!driverData.phone?.trim()) {
        throw new Error('Phone number is required');
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(driverData.phone.replace(/\s+/g, ''))) {
        throw new Error('Invalid phone number format');
      }

      return await this.driverRepository.createDriver(driverData, companyId);
    } catch (error) {
      console.error('Error in DriverService.createDriver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, updateData: UpdateDriverData, companyId: string): Promise<Driver> {
    try {
      // Validate that at least one field is being updated
      const hasUpdates = Object.values(updateData).some(value => value !== undefined);
      if (!hasUpdates) {
        throw new Error('No updates provided');
      }

      // Validate phone if provided
      if (updateData.phone !== undefined) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(updateData.phone.replace(/\s+/g, ''))) {
          throw new Error('Invalid phone number format');
        }
      }

      return await this.driverRepository.updateDriver(id, updateData, companyId);
    } catch (error) {
      console.error('Error in DriverService.updateDriver:', error);
      throw error;
    }
  }

  async deleteDriver(id: string, companyId: string): Promise<void> {
    try {
      await this.driverRepository.deleteDriver(id, companyId);
    } catch (error) {
      console.error('Error in DriverService.deleteDriver:', error);
      throw new Error('Failed to delete driver');
    }
  }
}
