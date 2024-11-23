import type { IService } from './base';
import { logger } from '../utils/logger';
import { AppError } from '../errors/types';
import { createHash, randomBytes, scrypt } from 'crypto';

interface SecurityConfig {
  saltLength?: number;
  keyLength?: number;
  iterations?: number;
  pepper?: string;
}

export class SecurityService implements IService {
  private saltLength: number;
  private keyLength: number;
  private iterations: number;
  private pepper: string;

  constructor(config?: SecurityConfig) {
    this.saltLength = config?.saltLength || 32;
    this.keyLength = config?.keyLength || 64;
    this.iterations = config?.iterations || 100000;
    this.pepper = config?.pepper || process.env.PEPPER || '';
  }

  async init(): Promise<void> {
    if (!this.pepper) {
      logger.warn('No pepper provided for password hashing');
    }
  }

  async dispose(): Promise<void> {
    // No cleanup needed
  }

  /**
   * Hash a password using scrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Generate a random salt
      const salt = randomBytes(this.saltLength).toString('hex');

      // Add pepper to password
      const pepperedPassword = this.pepper ? `${password}${this.pepper}` : password;

      // Hash the password
      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        scrypt(
          pepperedPassword,
          salt,
          this.keyLength,
          {
            N: this.iterations,
            r: 8,
            p: 1,
          },
          (err, key) => {
            if (err) {
              reject(err);
            } else {
              resolve(key);
            }
          }
        );
      });

      // Return the salt and hash combined
      return `${salt}:${derivedKey.toString('hex')}`;
    } catch (error) {
      logger.error('Error hashing password', error);
      throw AppError.securityError('Failed to hash password', error);
    }
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Split hash into salt and key
      const [salt, key] = hash.split(':');

      // Add pepper to password
      const pepperedPassword = this.pepper ? `${password}${this.pepper}` : password;

      // Hash the password with the same salt
      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        scrypt(
          pepperedPassword,
          salt,
          this.keyLength,
          {
            N: this.iterations,
            r: 8,
            p: 1,
          },
          (err, key) => {
            if (err) {
              reject(err);
            } else {
              resolve(key);
            }
          }
        );
      });

      // Compare the hashes
      return derivedKey.toString('hex') === key;
    } catch (error) {
      logger.error('Error verifying password', error);
      throw AppError.securityError('Failed to verify password', error);
    }
  }

  /**
   * Generate a secure random token
   */
  generateToken(length = 32): string {
    try {
      return randomBytes(length).toString('hex');
    } catch (error) {
      logger.error('Error generating token', error);
      throw AppError.securityError('Failed to generate token', error);
    }
  }

  /**
   * Hash a value using SHA-256
   */
  hashValue(value: string): string {
    try {
      return createHash('sha256').update(value).digest('hex');
    } catch (error) {
      logger.error('Error hashing value', error);
      throw AppError.securityError('Failed to hash value', error);
    }
  }

  /**
   * Sanitize a value for safe storage
   */
  sanitizeValue(value: string): string {
    try {
      // Remove any HTML tags
      value = value.replace(/<[^>]*>/g, '');

      // Remove any script tags and their contents
      value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // Remove any potentially dangerous attributes
      value = value.replace(/\b(on\w+|style|class|id)="[^"]*"/gi, '');

      // Remove any JavaScript event handlers
      value = value.replace(/\b(javascript|vbscript|expression|data):/gi, '');

      // Remove any SQL injection attempts
      value = value.replace(/['";]/g, '');

      // Remove any NoSQL injection attempts
      value = value.replace(/[\${}]/g, '');

      // Remove any command injection attempts
      value = value.replace(/[&|;`]/g, '');

      return value;
    } catch (error) {
      logger.error('Error sanitizing value', error);
      throw AppError.securityError('Failed to sanitize value', error);
    }
  }

  /**
   * Validate a value against a pattern
   */
  validateValue(value: string, pattern: RegExp): boolean {
    try {
      return pattern.test(value);
    } catch (error) {
      logger.error('Error validating value', error);
      throw AppError.securityError('Failed to validate value', error);
    }
  }

  /**
   * Check if a value contains any dangerous patterns
   */
  hasDangerousPatterns(value: string): boolean {
    try {
      const dangerousPatterns = [
        // SQL injection
        /'.*--/,
        /;.*--/,
        /\/\*.*\*\//,
        /xp_.*\(/,
        /union.*select/i,
        /select.*from/i,
        /insert.*into/i,
        /delete.*from/i,
        /drop.*table/i,
        /update.*set/i,

        // NoSQL injection
        /\$where/i,
        /\$regex/i,
        /\$ne/i,
        /\$gt/i,
        /\$lt/i,
        /\$gte/i,
        /\$lte/i,
        /\$in/i,
        /\$nin/i,
        /\$or/i,
        /\$and/i,

        // XSS
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /expression\(/i,
        /onload=/i,
        /onerror=/i,
        /onclick=/i,
        /onmouseover=/i,

        // Command injection
        /\|\|/,
        /&&/,
        /;\s*$/,
        /`.*`/,
        /\$\(.+\)/,
        /\$\{.+\}/,

        // Path traversal
        /\.\.\//,
        /\.\.\\\\/,
        /%2e%2e\//i,
        /%2e%2e\\\\/i,

        // File inclusion
        /include\s*\(/i,
        /require\s*\(/i,
        /load\s*\(/i,
        /eval\s*\(/i,

        // LDAP injection
        /\(\|\(/i,
        /\)\|\)/i,
        /\(\&\(/i,
        /\)\&\)/i,

        // XML injection
        /<!\[CDATA\[/i,
        /<!ENTITY/i,
        /<!DOCTYPE/i,
        /<!\[INCLUDE\[/i,
      ];

      return dangerousPatterns.some(pattern => pattern.test(value));
    } catch (error) {
      logger.error('Error checking dangerous patterns', error);
      throw AppError.securityError('Failed to check dangerous patterns', error);
    }
  }

  /**
   * Mask sensitive data
   */
  maskSensitiveData(data: string): string {
    try {
      // Mask credit card numbers
      data = data.replace(
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        match => `${match.slice(-4).padStart(match.length, '*')}`
      );

      // Mask social security numbers
      data = data.replace(
        /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/g,
        match => `${match.slice(-4).padStart(match.length, '*')}`
      );

      // Mask email addresses
      data = data.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, match => {
        const [local, domain] = match.split('@');

        return `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
      });

      // Mask phone numbers
      data = data.replace(
        /\b\+?\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g,
        match => `${match.slice(-4).padStart(match.length, '*')}`
      );

      return data;
    } catch (error) {
      logger.error('Error masking sensitive data', error);
      throw AppError.securityError('Failed to mask sensitive data', error);
    }
  }
}
