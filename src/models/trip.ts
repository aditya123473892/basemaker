export interface Trip {
  id: string;
  company_id: string;
  vehicle_id: string;
  driver_id: string;
  source: string;
  destination: string;
  start_date: string;
  end_date?: string;
  status: string;
  total_distance_km?: number;
  freight_amount?: number;
  metadata?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateTripData {
  vehicle_id: string;
  driver_id: string;
  source: string;
  destination: string;
  start_date: string;
  end_date?: string;
  status: string;
  total_distance_km?: number;
  freight_amount?: number;
  metadata?: string;
}

export interface UpdateTripData {
  vehicle_id?: string;
  driver_id?: string;
  source?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  total_distance_km?: number;
  freight_amount?: number;
  metadata?: string;
  updated_at?: string;
}

export interface Container {
  id: string;
  company_id: string;
  container_number: string;
  container_type: string;
  size_ft: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateContainerData {
  container_number: string;
  container_type: string;
  size_ft: number;
}

export interface UpdateContainerData {
  container_number?: string;
  container_type?: string;
  size_ft?: number;
  is_active?: boolean;
}

export interface TripContainer {
  id: string;
  trip_id: string;
  vehicle_id: string;
  container_id: string;
  loaded_at?: string;
  unloaded_at?: string;
  created_at: string;
}

export interface CreateTripContainerData {
  vehicle_id: string;
  container_id: string;
  loaded_at?: string;
  unloaded_at?: string;
}

export interface UpdateTripContainerData {
  vehicle_id?: string;
  container_id?: string;
  loaded_at?: string;
  unloaded_at?: string;
}

export interface TripEstimate {
  id: string;
  trip_id: string;
  estimated_freight_amount: number;
  estimated_driver_payout: number;
  estimated_fuel_cost: number;
  estimated_other_cost?: number;
  created_at: string;
}

export interface CreateTripEstimateData {
  estimated_freight_amount: number;
  estimated_driver_payout: number;
  estimated_fuel_cost: number;
  estimated_other_cost?: number;
}

export interface UpdateTripEstimateData {
  estimated_freight_amount?: number;
  estimated_driver_payout?: number;
  estimated_fuel_cost?: number;
  estimated_other_cost?: number;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  expense_type: string;
  amount: number;
  expense_date: string;
  notes?: string;
  created_at: string;
}

export interface CreateTripExpenseData {
  expense_type: string;
  amount: number;
  expense_date: string;
  notes?: string;
}

export interface UpdateTripExpenseData {
  expense_type?: string;
  amount?: number;
  expense_date?: string;
  notes?: string;
}

export interface TripSettlement {
  id: string;
  trip_id: string;
  total_freight_amount: number;
  total_expense_amount: number;
  driver_final_payout: number;
  company_profit: number;
  settlement_date: string;
}

export interface CreateTripSettlementData {
  total_freight_amount: number;
  total_expense_amount: number;
  driver_final_payout: number;
  company_profit: number;
  settlement_date: string;
}

export interface UpdateTripSettlementData {
  total_freight_amount?: number;
  total_expense_amount?: number;
  driver_final_payout?: number;
  company_profit?: number;
  settlement_date?: string;
}
