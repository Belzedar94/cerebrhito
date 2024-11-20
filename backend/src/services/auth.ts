import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { DatabaseService } from './database';
import type { User, UserRole, SubscriptionType } from '../types/database';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  private db: DatabaseService;
  private jwtSecret: string;

  constructor() {
    this.db = new DatabaseService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private generateToken(userId: string, email: string, role: UserRole): string {
    return jwt.sign(
      { userId, email, role },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  async signUp(data: SignUpData) {
    // Check if user already exists
    const existingUser = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser.data) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Create user in our database
    const user = await this.db.createUser({
      email: data.email,
      encrypted_password: hashedPassword,
      full_name: data.fullName,
      role: data.role,
      subscription_type: 'free' as SubscriptionType,
      subscription_expires_at: null,
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        subscriptionType: user.subscription_type,
      },
      token,
    };
  }

  async signIn(data: SignInData) {
    // Get user from database
    const user = await this.db.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(
      data.password,
      user.encrypted_password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Sign in with Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      throw authError;
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        subscriptionType: user.subscription_type,
      },
      token,
    };
  }

  async signOut(userId: string) {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw error;
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user from database
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await this.comparePasswords(
      currentPassword,
      user.encrypted_password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }

    // Update password in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password in our database
    await supabase
      .from('users')
      .update({ encrypted_password: hashedPassword })
      .eq('id', userId);
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.jwtSecret) as {
        userId: string;
        email: string;
        role: UserRole;
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}