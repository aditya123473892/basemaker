import { Request, Response, NextFunction } from 'express';
import { NavigationService } from '../services/navigationService';

export class NavigationController {
  private navigationService = new NavigationService();

  async sidebar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const data = await this.navigationService.getSidebarMenus(
        req.user.company_id,
        req.user.id,
        req.user.role
      );

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
