import type { Request, Response } from 'express';
import { validate, validateRequest, validateFileUpload } from '../middleware/validation';
import { z } from 'zod';
import { AppError } from '../errors/types';

// Mock Express request and response
interface MockRequest extends Partial<Request> {
  file?: Express.Multer.File;
  files?: { [fieldname: string]: Express.Multer.File[] };
}

function createMockReq(overrides = {}): MockRequest {
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

describe('Validation Middleware', () => {
  let req: MockRequest;
  let res: MockResponse;
  let next: jest.Mock;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = jest.fn();
  });

  describe('validate', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
      name: z.string().min(2),
    });

    it('should pass validation for valid data', async () => {
      req.body = {
        email: 'test@example.com',
        age: 25,
        name: 'John',
      };

      await validate(schema)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should strip unknown fields by default', async () => {
      req.body = {
        email: 'test@example.com',
        age: 25,
        name: 'John',
        unknown: 'field',
      };

      await validate(schema)(req as Request, res as Response, next);

      expect(req.body).not.toHaveProperty('unknown');
      expect(next).toHaveBeenCalled();
    });

    it('should fail validation for invalid data', async () => {
      req.body = {
        email: 'invalid-email',
        age: 16,
        name: 'J',
      };

      await validate(schema)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
      expect(next.mock.calls[0][0].details).toHaveLength(3);
    });

    it('should validate query parameters', async () => {
      const querySchema = z.object({
        page: z.string().regex(/^\d+$/).transform(Number),
        limit: z.string().regex(/^\d+$/).transform(Number),
      });

      req.query = {
        page: '1',
        limit: '10',
      };

      await validate(querySchema, 'query')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(10);
    });

    it('should validate path parameters', async () => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      req.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      await validate(paramsSchema, 'params')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateRequest', () => {
    const schemas = {
      body: z.object({
        name: z.string().min(2),
      }),
      query: z.object({
        sort: z.enum(['asc', 'desc']),
      }),
      params: z.object({
        id: z.string().uuid(),
      }),
    };

    it('should validate multiple parts of the request', async () => {
      req.body = { name: 'John' };
      req.query = { sort: 'asc' };
      req.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      await validateRequest(schemas)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should fail if any part is invalid', async () => {
      req.body = { name: 'J' };
      req.query = { sort: 'invalid' };
      req.params = { id: 'invalid-uuid' };

      await validateRequest(schemas)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
    });

    it('should validate only specified parts', async () => {
      req.body = { name: 'John' };
      req.query = { invalid: 'field' };

      await validateRequest({ body: schemas.body })(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validateFileUpload', () => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 1024 * 1024; // 1MB

    it('should pass for valid single file', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: maxSize / 2,
        originalname: 'test.jpg',
      } as any;

      validateFileUpload(allowedTypes, maxSize)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass for valid multiple files', () => {
      req.files = {
        images: [
          {
            mimetype: 'image/jpeg',
            size: maxSize / 2,
            originalname: 'test1.jpg',
          },
          {
            mimetype: 'image/png',
            size: maxSize / 2,
            originalname: 'test2.png',
          },
        ],
      } as any;

      validateFileUpload(allowedTypes, maxSize)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should fail for invalid file type', () => {
      req.file = {
        mimetype: 'application/pdf',
        size: maxSize / 2,
        originalname: 'test.pdf',
      } as any;

      validateFileUpload(allowedTypes, maxSize)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
      expect(next.mock.calls[0][0].details).toHaveProperty('allowedTypes');
    });

    it('should fail for file too large', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: maxSize * 2,
        originalname: 'test.jpg',
      } as any;

      validateFileUpload(allowedTypes, maxSize)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
      expect(next.mock.calls[0][0].details).toHaveProperty('maxSize');
    });

    it('should fail if no file is uploaded', () => {
      validateFileUpload(allowedTypes, maxSize)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
      expect(next.mock.calls[0][0].message).toBe('No file uploaded');
    });
  });
});
