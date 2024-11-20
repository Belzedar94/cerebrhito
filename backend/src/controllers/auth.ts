import { Request, Response } from 'express';
import { AuthService, SignUpData, SignInData } from '../services/auth';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['parent', 'professional']),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = async (req: Request, res: Response) => {
    try {
      const validatedData = signUpSchema.parse(req.body);
      const result = await this.authService.signUp(validatedData as SignUpData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  };

  signIn = async (req: Request, res: Response) => {
    try {
      const validatedData = signInSchema.parse(req.body);
      const result = await this.authService.signIn(validatedData as SignInData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(401).json({ message: (error as Error).message });
      }
    }
  };

  signOut = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      await this.authService.signOut(req.user.userId);
      res.json({ message: 'Successfully signed out' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      await this.authService.resetPassword(email);
      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  };

  updatePassword = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const validatedData = updatePasswordSchema.parse(req.body);
      await this.authService.updatePassword(
        req.user.userId,
        validatedData.currentPassword,
        validatedData.newPassword
      );
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(400).json({ message: (error as Error).message });
      }
    }
  };
}