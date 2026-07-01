import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/user/UserRepository';

export class UserController {
  private userService: UserService;

  constructor() {
    const userRepository = new UserRepository();
    this.userService = new UserService(userRepository);
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.company_id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID not found',
        });
      }

      const users = await this.userService.getAllUsers(companyId);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID not found',
        });
      }

      const user = await this.userService.getUserById(id, companyId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.company_id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID not found',
        });
      }

      const userData = {
        companyId,
        email: req.body.email,
        fullName: req.body.full_name,
        password: req.body.password,
        role: req.body.role || 'USER',
        roleIds: Array.isArray(req.body.roleIds) ? req.body.roleIds : [],
        actorUserId: req.user?.id,
      };

      const user = await this.userService.createUser(userData);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID not found',
        });
      }

      const updateData = {
        full_name: req.body.full_name,
        role: req.body.role,
        is_active: req.body.is_active,
        roleIds: Array.isArray(req.body.roleIds) ? req.body.roleIds : undefined,
        actorUserId: req.user?.id,
      };

      const user = await this.userService.updateUser(id, companyId, updateData);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.user?.company_id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID not found',
        });
      }

      await this.userService.deleteUser(id, companyId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
