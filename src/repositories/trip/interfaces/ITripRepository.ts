import { Trip, CreateTripData, UpdateTripData } from '../../../models/trip';

export interface ITripRepository {
  getAllTrips(companyId: string): Promise<Trip[]>;
  getTripById(id: string, companyId: string): Promise<Trip | null>;
  createTrip(tripData: CreateTripData, companyId: string): Promise<Trip>;
  updateTrip(id: string, updateData: UpdateTripData, companyId: string): Promise<Trip>;
  deleteTrip(id: string, companyId: string): Promise<void>;
}
