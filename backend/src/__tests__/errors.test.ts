import { AppError, ErrorCode } from '../errors/types';
import { errorHandler } from '../middleware/errorHandler';
import type { Request, Response } from 'express';
import { ZodError, z } from 'zod';

// Mock Express request and response
function createMockReq(overrides = {}): Partial<Request> {
  return {
    path: '/test',
    method: 'GET',
    ip: '127.0.0.1',
    headers: {},
    body: {},
    query: {},
    params: {},
    ...overrides,
  };
}

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  status(code: number): this;
  json(data: any): this;
  setHeader(name: string, value: string): this;
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      this.statusCode = code;

      return this;
    },
    json(data: any) {
      this.body = data;

      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;

      return this;
    },
  };

  return res;
}

describe('Error Handler', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: jest.Mock;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle unauthorized error', () => {
      const error = AppError.unauthorized('Invalid credentials');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(401);
      expect(res.body?.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(res.body?.message).toBe('Invalid credentials');
    });

    it('should handle not found error', () => {
      const error = AppError.notFound('Resource not found');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(404);
      expect(res.body?.code).toBe(ErrorCode.NOT_FOUND);
      expect(res.body?.message).toBe('Resource not found');
    });

    it('should handle validation error', () => {
      const error = AppError.validation('Invalid input', {
        field: 'email',
        message: 'Invalid email format',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(400);
      expect(res.body?.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(res.body?.message).toBe('Invalid input');
      expect(res.body?.details).toEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should handle database error', () => {
      const error = AppError.databaseError('Connection failed');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(503);
      expect(res.body?.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(res.body?.message).toBe('Connection failed');
    });

    it('should handle AI service error', () => {
      const error = AppError.aiServiceError('Groq API error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(502);
      expect(res.body?.code).toBe(ErrorCode.AI_SERVICE_ERROR);
      expect(res.body?.message).toBe('Groq API error');
    });
  });

  describe('Zod error handling', () => {
    it('should handle Zod validation error', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const error = schema.safeParse({ email: 'invalid', age: 16 }).error as Error;

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(400);
      expect(res.body?.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(res.body?.details).toHaveLength(2);
      expect(res.body?.details[0]).toHaveProperty('path');
      expect(res.body?.details[0]).toHaveProperty('message');
    });
  });

  describe('JWT error handling', () => {
    it('should handle invalid token error', () => {
      const error = Object.assign(new Error('invalid token'), {
        name: 'JsonWebTokenError',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(401);
      expect(res.body?.code).toBe(ErrorCode.INVALID_TOKEN);
      expect(res.body?.message).toBe('Invalid token');
    });

    it('should handle token expired error', () => {
      const error = Object.assign(new Error('jwt expired'), {
        name: 'TokenExpiredError',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(401);
      expect(res.body?.code).toBe(ErrorCode.TOKEN_EXPIRED);
      expect(res.body?.message).toBe('Token has expired');
    });
  });

  describe('Database error handling', () => {
    it('should handle Postgres error', () => {
      const error = Object.assign(new Error('connection failed'), {
        name: 'PostgresError',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(503);
      expect(res.body?.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(res.body?.message).toBe('Database operation failed');
    });
  });

  describe('Rate limit error handling', () => {
    it('should handle rate limit exceeded error', () => {
      const error = Object.assign(new Error('too many requests'), {
        name: 'TooManyRequestsError',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(429);
      expect(res.body?.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(res.body?.message).toBe('Too many requests');
    });
  });

  describe('External service error handling', () => {
    it('should handle Groq API error', () => {
      const error = Object.assign(new Error('API error'), {
        name: 'GroqError',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(502);
      expect(res.body?.code).toBe(ErrorCode.GROQ_API_ERROR);
      expect(res.body?.message).toBe('AI service error');
    });

    it('should handle ElevenLabs API error', () => {
      const error = Object.assign(new Error('API error'), {
        name: 'ElevenLabsError',
      });

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(502);
      expect(res.body?.code).toBe(ErrorCode.ELEVENLABS_API_ERROR);
      expect(res.body?.message).toBe('Text-to-speech service error');
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(500);
      expect(res.body?.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(res.body?.message).toBe('An unexpected error occurred');
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'production';

      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.statusCode).toBe(500);
      expect(res.body?.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(res.body?.message).toBe('An unexpected error occurred');
      expect(res.body?.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request context', () => {
    it('should include request ID in error response', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.body?.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should use provided request ID if available', () => {
      const requestId = 'test-request-123';

      req.headers = { 'x-request-id': requestId };

      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.body?.requestId).toBe(requestId);
    });

    it('should include user ID in error context if available', () => {
      (req as any).user = { id: 'test-user-123' };

      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.body?.requestId).toBeDefined();
    });

    it('should include child ID in error context if available', () => {
      (req as any).params = { childId: 'test-child-123' };

      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.body?.requestId).toBeDefined();
    });
  });
});
