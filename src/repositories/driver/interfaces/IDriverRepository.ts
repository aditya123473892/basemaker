import { Driver, CreateDriverData, UpdateDriverData } from '../../../models/driver';

export interface IDriverRepository {
  getAllDrivers(companyId: string): Promise<Driver[]>;
  getDriverById(id: string, companyId: string): Promise<Driver | null>;
  createDriver(driverData: CreateDriverData, companyId: string): Promise<Driver>;
  updateDriver(id: string, updateData: UpdateDriverData, companyId: string): Promise<Driver>;
  deleteDriver(id: string, companyId: string): Promise<void>;
}
