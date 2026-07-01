import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/securityService';
import { NavigationService } from '../services/navigationService';

export class SessionController {
  private securityService = new SecurityService();
  private navigationService = new NavigationService();

  async bootstrap(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const [permissions, sidebarMenus] = await Promise.all([
        this.securityService.getEffectivePermissions(req.user.company_id, req.user.id),
        this.navigationService.getSidebarMenus(req.user.company_id, req.user.id, req.user.role),
      ]);

      res.status(200).json({
        success: true,
        data: {
          permissions,
          sidebarMenus,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
