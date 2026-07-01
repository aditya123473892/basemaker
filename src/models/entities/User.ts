export interface Company {
  id: string;
  name: string;
  is_active?: boolean;
  metadata?: string | null;
  created_at: Date;
  updated_at?: Date | null;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  password_hash?: string;
  role: string;
  is_active?: boolean;
  last_login_at?: Date | null;
  metadata?: string | null;
  created_at: Date;
  updated_at?: Date | null;
}

export interface AuthUser {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    company_id: string;
  };
}
