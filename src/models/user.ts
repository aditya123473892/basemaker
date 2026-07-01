export interface UserAccount {
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
  roles?: Array<{
    id: string;
    user_id: string;
    role_id: string;
    role_name: string;
    is_system_role: boolean;
  }>;
}
