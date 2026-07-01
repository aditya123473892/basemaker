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

  async listMenus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const menus = await this.navigationService.getAllMenus(req.user.company_id);
      res.status(200).json({ success: true, data: menus });
    } catch (error) {
      next(error);
    }
  }

  async createMenu(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { label, path, iconKey, permissionModuleKey, permissionAction, parentId, sortOrder } = req.body;
      const menu = await this.navigationService.createMenu(req.user.company_id, {
        label,
        path,
        iconKey,
        permissionModuleKey,
        permissionAction,
        parentId,
        sortOrder,
      });
      res.status(201).json({ success: true, data: menu });
    } catch (error) {
      next(error);
    }
  }

  async updateMenu(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { id } = req.params;
      const payload = req.body || {};
      const menu = await this.navigationService.updateMenu(req.user.company_id, id, {
        label: payload.label,
        path: payload.path,
        iconKey: payload.iconKey,
        permissionModuleKey: payload.permissionModuleKey,
        permissionAction: payload.permissionAction,
        parentId: payload.parentId,
        sortOrder: typeof payload.sortOrder === 'number' ? payload.sortOrder : undefined,
        isActive: payload.isActive,
      });
      res.status(200).json({ success: true, data: menu });
    } catch (error: any) {
      console.error('Failed to update menu:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to update menu' });
    }
  }

  async deleteMenu(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { id } = req.params;
      await this.navigationService.deleteMenu(req.user.company_id, id);
      res.status(200).json({ success: true, message: 'Menu deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
