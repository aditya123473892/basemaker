import { UserAccount } from '../../../models/user';

export interface CreateUserData {
  companyId: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: string;
}

export interface UpdateUserData {
  fullName?: string;
  role?: string;
  isActive?: boolean;
}

export interface IUserRepository {
  getAllUsers(companyId: string): Promise<UserAccount[]>;
  getUserById(userId: string, companyId: string): Promise<UserAccount | null>;
  createUser(userData: CreateUserData): Promise<UserAccount>;
  updateUser(userId: string, companyId: string, updateData: UpdateUserData): Promise<UserAccount>;
  deleteUser(userId: string, companyId: string): Promise<void>;
}
