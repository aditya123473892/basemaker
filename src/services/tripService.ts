import { TripRepository } from '../repositories/trip/TripRepository';
import { ITripRepository } from '../repositories/trip/interfaces/ITripRepository';
import { Trip, CreateTripData, UpdateTripData } from '../models/trip';

export class TripService {
  private tripRepository: ITripRepository;

  constructor(tripRepository: ITripRepository = new TripRepository()) {
    this.tripRepository = tripRepository;
  }

  async getAllTrips(companyId: string): Promise<Trip[]> {
    try {
      return await this.tripRepository.getAllTrips(companyId);
    } catch (error) {
      console.error('Error in TripService.getAllTrips:', error);
      throw new Error('Failed to fetch trips');
    }
  }

  async getTripById(id: string, companyId: string): Promise<Trip | null> {
    try {
      return await this.tripRepository.getTripById(id, companyId);
    } catch (error) {
      console.error('Error in TripService.getTripById:', error);
      throw new Error('Failed to fetch trip');
    }
  }

  async createTrip(tripData: CreateTripData, companyId: string): Promise<Trip> {
    try {
      // Validate required fields
      if (!tripData.vehicle_id) {
        throw new Error('Vehicle ID is required');
      }
      if (!tripData.driver_id) {
        throw new Error('Driver ID is required');
      }
      if (!tripData.source?.trim()) {
        throw new Error('Source is required');
      }
      if (!tripData.destination?.trim()) {
        throw new Error('Destination is required');
      }
      if (!tripData.start_date) {
        throw new Error('Start date is required');
      }
      if (!tripData.status?.trim()) {
        throw new Error('Status is required');
      }

      // Validate dates
      const startDate = new Date(tripData.start_date);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date');
      }

      if (tripData.end_date) {
        const endDate = new Date(tripData.end_date);
        if (isNaN(endDate.getTime())) {
          throw new Error('Invalid end date');
        }
        if (endDate < startDate) {
          throw new Error('End date cannot be before start date');
        }
      }

      return await this.tripRepository.createTrip(tripData, companyId);
    } catch (error) {
      console.error('Error in TripService.createTrip:', error);
      throw error;
    }
  }

  async updateTrip(id: string, updateData: UpdateTripData, companyId: string): Promise<Trip> {
    try {
      // Validate that at least one field is being updated
      const hasUpdates = Object.values(updateData).some(value => value !== undefined);
      if (!hasUpdates) {
        throw new Error('No updates provided');
      }

      // Validate dates if provided
      if (updateData.start_date) {
        const startDate = new Date(updateData.start_date);
        if (isNaN(startDate.getTime())) {
          throw new Error('Invalid start date');
        }
      }

      if (updateData.end_date) {
        const endDate = new Date(updateData.end_date);
        if (isNaN(endDate.getTime())) {
          throw new Error('Invalid end date');
        }
      }

      // If both dates are provided, validate end date is after start date
      if (updateData.start_date && updateData.end_date) {
        const startDate = new Date(updateData.start_date);
        const endDate = new Date(updateData.end_date);
        if (endDate < startDate) {
          throw new Error('End date cannot be before start date');
        }
      }

      return await this.tripRepository.updateTrip(id, updateData, companyId);
    } catch (error) {
      console.error('Error in TripService.updateTrip:', error);
      throw error;
    }
  }

  async deleteTrip(id: string, companyId: string): Promise<void> {
    try {
      await this.tripRepository.deleteTrip(id, companyId);
    } catch (error) {
      console.error('Error in TripService.deleteTrip:', error);
      throw new Error('Failed to delete trip');
    }
  }
}
