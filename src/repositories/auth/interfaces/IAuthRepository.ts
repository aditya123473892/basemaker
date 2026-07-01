import { User, Company } from '../../../models/entities/User';
import { CreateUserData } from '../../../models/dto/AuthRequests';

export interface IAuthRepository {
  createCompany(name: string): Promise<Company>;
  createUser(userData: CreateUserData): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  updateLastLogin(userId: string): Promise<void>;
}
