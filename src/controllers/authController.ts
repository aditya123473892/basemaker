import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthRepository } from '../repositories/auth/AuthRepository';
import { signupSchema, loginSchema } from '../validations/authValidation';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const authRepository = new AuthRepository();
    this.authService = new AuthService(authRepository);
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = signupSchema.parse(req.body);

      // Call service
      const result = await this.authService.signup(validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Call service
      const result = await this.authService.login(validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
