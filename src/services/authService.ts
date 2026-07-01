import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import { SignupInput, LoginInput } from '../validations/authValidation';
import { IAuthRepository } from '../repositories/auth/interfaces/IAuthRepository';
import { AuthResponse, AuthUser } from '../models/entities/User';
import { SecurityService } from './securityService';

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiration: StringValue;
  private readonly securityService: SecurityService;

  constructor(private authRepository: IAuthRepository) {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtExpiration = (process.env.JWT_EXPIRATION || '24h') as StringValue;
    this.securityService = new SecurityService();
  }

  async signup(data: SignupInput): Promise<AuthResponse> {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create company
      const company = await this.authRepository.createCompany(data.company_name);

      // Create user account
      const user = await this.authRepository.createUser({
        companyId: company.id,
        email: data.owner_email,
        fullName: data.owner_full_name,
        passwordHash,
        role: 'OWNER'
      });

      await this.securityService.ensureSecuritySeed(user.company_id, user.id);
      await this.securityService.assignSystemRoleByName(user.company_id, user.id, 'Super Admin', user.id);

      // Generate JWT
      const token = this.generateToken({
        userId: user.id,
        companyId: user.company_id,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          company_id: user.company_id,
        },
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error('Failed to create account. Please try again.');
    }
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.authRepository.findUserByEmail(data.email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password_hash!);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.authRepository.updateLastLogin(user.id);
      await this.securityService.ensureSecuritySeed(user.company_id, user.id);
      await this.assignLegacyRole(user);

      // Generate JWT
      const token = this.generateToken({
        userId: user.id,
        companyId: user.company_id,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          company_id: user.company_id,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw the error as-is (already user-friendly)
    }
  }

  private generateToken(payload: { userId: string; companyId: string; role: string }): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiration });
  }

  static verifyToken(token: string): { userId: string; companyId: string; role: string } {
    try {
      const secret = process.env.JWT_SECRET!;
      return jwt.verify(token, secret) as { userId: string; companyId: string; role: string };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private async assignLegacyRole(user: AuthUser) {
    const normalizedRole = user.role.toUpperCase();
    if (['OWNER', 'SUPERADMIN', 'SUPER_ADMIN'].includes(normalizedRole)) {
      await this.securityService.assignSystemRoleByName(user.company_id, user.id, 'Super Admin', user.id);
    } else if (normalizedRole === 'ADMIN') {
      await this.securityService.assignSystemRoleByName(user.company_id, user.id, 'Admin', user.id);
    } else if (['TRANSPORTER', 'TRANSPORT_MANAGER'].includes(normalizedRole)) {
      await this.securityService.assignSystemRoleByName(user.company_id, user.id, 'Transporter', user.id);
    }
  }
}
