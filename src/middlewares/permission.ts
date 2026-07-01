import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/securityService';

export function requirePermission(moduleKey: string, action: string) {
  const securityService = new SecurityService();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const allowed = await securityService.hasPermission(
        req.user.company_id,
        req.user.id,
        req.user.role,
        moduleKey,
        action
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: '403 Unauthorized',
          permission: { moduleKey, action },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
