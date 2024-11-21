import rateLimit from 'express-rate-limit';
import { AppError, ErrorCode } from '../errors/types';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
    max: options.max || 100, // Default: 100 requests per windowMs
    message: options.message || 'Too many requests, please try again later',
    handler: (req, res, next, options) => {
      next(new AppError(
        ErrorCode.BAD_REQUEST,
        options.message as string,
        429
      ));
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiter for auth routes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Rate limiter for AI routes
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many AI requests, please try again after 1 minute'
});

// General API rate limiter
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per 15 minutes
});