import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../errors/types';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
  requestId?: string;
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  const errorContext = {
    requestId,
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    childId: (req as any).params?.childId,
    query: req.query,
    body: sanitizeRequestBody(req.body),
    headers: sanitizeHeaders(req.headers),
    timestamp: new Date().toISOString(),
  };

  let errorResponse: ErrorResponse;

  // Handle AppError instances
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.code}`, errorContext);
    errorResponse = {
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    };

    return res.status(err.status).json(errorResponse);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.error('Validation Error', { ...errorContext, zodErrors: err.errors });
    errorResponse = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation error',
      details: err.errors,
      requestId,
    };

    return res.status(400).json(errorResponse);
  }

  // Handle JWT errors with specific error codes
  if (err.name === 'JsonWebTokenError') {
    logger.error('JWT Error', errorContext);
    errorResponse = {
      code: ErrorCode.INVALID_TOKEN,
      message: 'Invalid token',
      details: err.message,
      requestId,
    };

    return res.status(401).json(errorResponse);
  }

  if (err.name === 'TokenExpiredError') {
    logger.error('Token Expired', errorContext);
    errorResponse = {
      code: ErrorCode.TOKEN_EXPIRED,
      message: 'Token has expired',
      details: err.message,
      requestId,
    };

    return res.status(401).json(errorResponse);
  }

  // Handle database errors
  if (err.name === 'PostgresError' || err.name === 'PostgrestError') {
    logger.error('Database Error', errorContext);
    errorResponse = {
      code: ErrorCode.DATABASE_ERROR,
      message: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId,
    };

    return res.status(503).json(errorResponse);
  }

  // Handle rate limit errors
  if (err.name === 'TooManyRequestsError') {
    logger.warn('Rate Limit Exceeded', errorContext);
    errorResponse = {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests',
      details: err.message,
      requestId,
    };

    return res.status(429).json(errorResponse);
  }

  // Handle external service errors
  if (err.name === 'GroqError') {
    logger.error('Groq API Error', errorContext);
    errorResponse = {
      code: ErrorCode.GROQ_API_ERROR,
      message: 'AI service error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId,
    };

    return res.status(502).json(errorResponse);
  }

  if (err.name === 'ElevenLabsError') {
    logger.error('ElevenLabs API Error', errorContext);
    errorResponse = {
      code: ErrorCode.ELEVENLABS_API_ERROR,
      message: 'Text-to-speech service error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId,
    };

    return res.status(502).json(errorResponse);
  }

  // Default internal server error
  logger.error('Unhandled Error', errorContext);
  errorResponse = {
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    requestId,
  };
  res.status(500).json(errorResponse);
};

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeRequestBody(body: any): any {
  if (!body) {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function sanitizeHeaders(headers: any): any {
  if (!headers) {
    return headers;
  }

  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  sensitiveHeaders.forEach(header => {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}
