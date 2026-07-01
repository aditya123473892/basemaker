import * as fs from 'fs';
import * as path from 'path';
import { BaseRepository } from '../base/BaseRepository';
import { IUserRepository, CreateUserData, UpdateUserData } from './interfaces/IUserRepository';
import { UserAccount } from '../../models/user';

export class UserRepository extends BaseRepository implements IUserRepository {
  private readQueryFile(filename: string): string {
    const filePath = path.join(__dirname, 'queries', filename);
    return fs.readFileSync(filePath, 'utf8').trim();
  }

  async getAllUsers(companyId: string): Promise<UserAccount[]> {
    const query = this.readQueryFile('getAllUsers.sql');
    return await this.executeQuery<UserAccount>(query, { companyId });
  }

  async getUserById(userId: string, companyId: string): Promise<UserAccount | null> {
    const query = this.readQueryFile('getUserById.sql');
    const users = await this.executeQuery<UserAccount>(query, { userId, companyId });
    return users.length > 0 ? users[0] : null;
  }

  async createUser(userData: CreateUserData): Promise<UserAccount> {
    const query = this.readQueryFile('createUser.sql');
    return await this.executeScalar<UserAccount>(query, {
      companyId: userData.companyId,
      email: userData.email,
      fullName: userData.fullName,
      passwordHash: userData.passwordHash,
      role: userData.role,
    });
  }

  async updateUser(userId: string, companyId: string, updateData: UpdateUserData): Promise<UserAccount> {
    const query = this.readQueryFile('updateUser.sql');
    return await this.executeScalar<UserAccount>(query, {
      userId,
      companyId,
      fullName: updateData.fullName,
      role: updateData.role,
      isActive: updateData.isActive,
    });
  }

  async deleteUser(userId: string, companyId: string): Promise<void> {
    const query = this.readQueryFile('deleteUser.sql');
    await this.executeNonQuery(query, { userId, companyId });
  }
}
