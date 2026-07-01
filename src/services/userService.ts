import { IUserRepository } from '../repositories/user/interfaces/IUserRepository';
import { UserRepository } from '../repositories/user/UserRepository';
import { UserAccount } from '../models/user';
import * as bcrypt from 'bcryptjs';
import { SecurityService } from './securityService';

export class UserService {
  private userRepository: IUserRepository;
  private securityService: SecurityService;

  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository || new UserRepository();
    this.securityService = new SecurityService();
  }

  async getAllUsers(companyId: string): Promise<UserAccount[]> {
    try {
      const users = await this.userRepository.getAllUsers(companyId);
      const withRoles = await Promise.all(
        users.map(async (user) => ({
          ...user,
          roles: await this.securityService.getUserRoles(companyId, user.id),
        }))
      );
      return withRoles;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getUserById(userId: string, companyId: string): Promise<UserAccount | null> {
    try {
      return await this.userRepository.getUserById(userId, companyId);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async createUser(userData: {
    companyId: string;
    email: string;
    fullName: string;
    password: string;
    role: string;
    roleIds?: string[];
    actorUserId?: string;
  }): Promise<UserAccount> {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = await this.userRepository.createUser({
        companyId: userData.companyId,
        email: userData.email,
        fullName: userData.fullName,
        passwordHash,
        role: userData.role,
      });
      if (userData.roleIds?.length) {
        user.roles = await this.securityService.setUserRoles(
          userData.companyId,
          user.id,
          userData.roleIds,
          userData.actorUserId
        );
      }
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(
    userId: string,
    companyId: string,
    updateData: Partial<{
      full_name: string;
      role: string;
      is_active: boolean;
      roleIds: string[];
      actorUserId: string;
    }>
  ): Promise<UserAccount> {
    try {
      const user = await this.userRepository.updateUser(userId, companyId, {
        fullName: updateData.full_name,
        role: updateData.role,
        isActive: updateData.is_active,
      });
      if (updateData.roleIds) {
        user.roles = await this.securityService.setUserRoles(
          companyId,
          userId,
          updateData.roleIds,
          updateData.actorUserId
        );
      } else {
        user.roles = await this.securityService.getUserRoles(companyId, userId);
      }
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(userId: string, companyId: string): Promise<void> {
    try {
      await this.userRepository.deleteUser(userId, companyId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}
