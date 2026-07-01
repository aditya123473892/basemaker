import { Request, Response, NextFunction } from 'express';
import { TripService } from '../services/tripService';
import { CreateTripData, UpdateTripData } from '../models/trip';

export class TripController {
  private tripService: TripService;

  constructor() {
    this.tripService = new TripService();
  }

  async getAllTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const trips = await this.tripService.getAllTrips(companyId);
      res.json({ success: true, data: trips });
    } catch (error) {
      next(error);
    }
  }

  async getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const trip = await this.tripService.getTripById(id, companyId);
      if (!trip) {
        res.status(404).json({ success: false, error: 'Trip not found' });
        return;
      }

      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.company_id;
      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const tripData: CreateTripData = {
        vehicle_id: req.body.vehicle_id,
        driver_id: req.body.driver_id,
        source: req.body.source,
        destination: req.body.destination,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        status: req.body.status,
        total_distance_km: req.body.total_distance_km,
        freight_amount: req.body.freight_amount,
        metadata: req.body.metadata
      };

      const trip = await this.tripService.createTrip(tripData, companyId);
      res.status(201).json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  async updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      const updateData: UpdateTripData = {
        vehicle_id: req.body.vehicle_id,
        driver_id: req.body.driver_id,
        source: req.body.source,
        destination: req.body.destination,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        status: req.body.status,
        total_distance_km: req.body.total_distance_km,
        freight_amount: req.body.freight_amount,
        metadata: req.body.metadata
      };

      const trip = await this.tripService.updateTrip(id, updateData, companyId);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  async deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        res.status(400).json({ success: false, error: 'Company ID not found' });
        return;
      }

      await this.tripService.deleteTrip(id, companyId);
      res.json({ success: true, message: 'Trip deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
