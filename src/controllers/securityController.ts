import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/securityService';

export class SecurityController {
  private securityService = new SecurityService();

  async registry(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await this.securityService.getModuleRegistry() });
    } catch (error) {
      next(error);
    }
  }

  async roles(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = this.getCompanyId(req);
      res.status(200).json({ success: true, data: await this.securityService.getRoles(companyId) });
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await this.securityService.createRole(this.getCompanyId(req), req.user?.id, {
        roleName: req.body.roleName,
        description: req.body.description,
        isActive: req.body.isActive,
      });
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await this.securityService.updateRole(this.getCompanyId(req), req.params.id, req.user?.id, {
        roleName: req.body.roleName,
        description: req.body.description,
        isActive: req.body.isActive,
      });
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      await this.securityService.deleteRole(this.getCompanyId(req), req.params.id, req.user?.id);
      res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async permissions(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await this.securityService.getPermissions(this.getCompanyId(req)) });
    } catch (error) {
      next(error);
    }
  }

  async roleMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.securityService.getRolePermissionMatrix(this.getCompanyId(req), req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateRoleMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.securityService.setRolePermissions(
        this.getCompanyId(req),
        req.params.id,
        req.user?.id,
        req.body.permissions || []
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async users(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await this.securityService.getUsersWithRoles(this.getCompanyId(req)) });
    } catch (error) {
      next(error);
    }
  }

  async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.securityService.assignRole(this.getCompanyId(req), req.params.userId, req.body.roleId, req.user?.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async removeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.securityService.removeRole(this.getCompanyId(req), req.params.userId, req.params.roleId, req.user?.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async effectivePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId || req.user?.id;
      if (!userId) throw new Error('User ID not found');
      const data = await this.securityService.getEffectivePermissions(this.getCompanyId(req), userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async auditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await this.securityService.getAuditLogs(this.getCompanyId(req)) });
    } catch (error) {
      next(error);
    }
  }

  private getCompanyId(req: Request) {
    const companyId = req.user?.company_id;
    if (!companyId) throw new Error('Company ID not found');
    return companyId;
  }
}
