import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthUser } from '../models/entities/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export class AuthMiddleware {
  static authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authorization token required',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = AuthService.verifyToken(token);

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        company_id: decoded.companyId,
        role: decoded.role,
        email: '', // Will be populated from database if needed
        full_name: '', // Will be populated from database if needed
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  }

  static requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      next();
    };
  }

  static scopeByCompany(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Add company_id to query/filter parameters for data scoping
    req.query.company_id = req.user.company_id;
    req.body.company_id = req.user.company_id;

    next();
  }
}
