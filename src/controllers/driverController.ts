import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driverService';
import { CreateDriverData, UpdateDriverData } from '../models/driver';

export class DriverController {
  private driverService: DriverService;

  constructor() {
    this.driverService = new DriverService();
  }

  async getAllDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const drivers = await this.driverService.getAllDrivers(companyId);
      res.json({ success: true, data: drivers });
    } catch (error) {
      next(error);
    }
  }

  async getDriverById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const driver = await this.driverService.getDriverById(id, companyId);
      if (!driver) {
        res.status(404).json({ success: false, error: 'Driver not found' });
        return;
      }

      res.json({ success: true, data: driver });
    } catch (error) {
      next(error);
    }
  }

  async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.company_id;
      console.log('DriverController.createDriver - companyId:', companyId, 'type:', typeof companyId);

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(companyId)) {
        console.log('DriverController.createDriver - Invalid UUID format:', companyId);
        res.status(400).json({ success: false, error: 'Invalid company ID format' });
        return;
      }

      const driverData: CreateDriverData = {
        full_name: req.body.full_name,
        phone: req.body.phone,
        license_number: req.body.license_number
      };

      console.log('DriverController.createDriver - Creating driver with data:', { driverData, companyId });
      const driver = await this.driverService.createDriver(driverData, companyId);
      res.status(201).json({ success: true, data: driver });
    } catch (error) {
      console.error('DriverController.createDriver - Error:', error);
      next(error);
    }
  }

  async updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const updateData: UpdateDriverData = {
        full_name: req.body.full_name,
        phone: req.body.phone,
        license_number: req.body.license_number,
        is_active: req.body.is_active
      };

      const driver = await this.driverService.updateDriver(id, updateData, companyId);
      res.json({ success: true, data: driver });
    } catch (error) {
      next(error);
    }
  }

  async deleteDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      await this.driverService.deleteDriver(id, companyId);
      res.json({ success: true, message: 'Driver deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
