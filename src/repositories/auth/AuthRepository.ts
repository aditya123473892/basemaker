import * as fs from 'fs';
import * as path from 'path';
import { BaseRepository } from '../base/BaseRepository';
import { IAuthRepository } from './interfaces/IAuthRepository';
import { User, Company } from '../../models/entities/User';
import { CreateUserData } from '../../models/dto/AuthRequests';

export class AuthRepository extends BaseRepository implements IAuthRepository {
  private readQueryFile(filename: string): string {
    const filePath = path.join(__dirname, 'queries', filename);
    return fs.readFileSync(filePath, 'utf8').trim();
  }

  async createCompany(name: string): Promise<Company> {
    const query = this.readQueryFile('createCompany.sql');
    return await this.executeScalar<Company>(query, { name });
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const query = this.readQueryFile('createUser.sql');
    return await this.executeScalar<User>(query, {
      company_id: userData.companyId,
      email: userData.email,
      full_name: userData.fullName,
      password_hash: userData.passwordHash,
      role: userData.role,
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const query = this.readQueryFile('findUserByEmail.sql');
    const users = await this.executeQuery<User>(query, { email });
    return users.length > 0 ? users[0] : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    const query = this.readQueryFile('updateLastLogin.sql');
    await this.executeNonQuery(query, { userId });
  }
}
