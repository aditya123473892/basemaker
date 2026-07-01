import { z } from 'zod';

export const signupSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  owner_full_name: z.string().min(1, 'Full name is required').max(150),
  owner_email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
