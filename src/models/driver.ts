export interface Driver {
  id: string;
  company_id: string;
  full_name: string;
  phone: string;
  license_number?: string;
  is_active: boolean;
  metadata?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateDriverData {
  full_name: string;
  phone: string;
  license_number?: string;
}

export interface UpdateDriverData {
  full_name?: string;
  phone?: string;
  license_number?: string;
  is_active?: boolean;
}
