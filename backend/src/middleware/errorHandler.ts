import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../errors/types';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id
  });

  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation error',
      details: err
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Invalid token',
      details: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Token expired',
      details: err.message
    });
  }

  // Default error
  res.status(500).json({
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};