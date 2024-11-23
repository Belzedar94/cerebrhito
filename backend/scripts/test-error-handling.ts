import { AppError, ErrorCode } from '../src/errors/types';
import { errorHandler } from '../src/middleware/errorHandler';
import { Request, Response } from 'express';
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
    ...overrides
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

function createMockRes(): MockResponse & Partial<Response> {
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
    }
  };

  return res as MockResponse & Partial<Response>;
}

// Test cases
const testCases = [
  {
    name: 'AppError - Unauthorized',
    error: AppError.unauthorized('Invalid credentials'),
    expectedStatus: 401,
    expectedCode: ErrorCode.UNAUTHORIZED
  },
  {
    name: 'AppError - Not Found',
    error: AppError.notFound('Resource not found'),
    expectedStatus: 404,
    expectedCode: ErrorCode.NOT_FOUND
  },
  {
    name: 'AppError - Validation',
    error: AppError.validation('Invalid input', {
      field: 'email',
      message: 'Invalid email format'
    }),
    expectedStatus: 400,
    expectedCode: ErrorCode.VALIDATION_ERROR
  },
  {
    name: 'AppError - Database Error',
    error: AppError.databaseError('Connection failed'),
    expectedStatus: 503,
    expectedCode: ErrorCode.DATABASE_ERROR
  },
  {
    name: 'AppError - AI Service Error',
    error: AppError.aiServiceError('Groq API error'),
    expectedStatus: 502,
    expectedCode: ErrorCode.AI_SERVICE_ERROR
  },
  {
    name: 'ZodError',
    error: new ZodError([{
      code: 'invalid_type',
      expected: 'string',
      received: 'number',
      path: ['email'],
      message: 'Expected string, received number'
    }]),
    expectedStatus: 400,
    expectedCode: ErrorCode.VALIDATION_ERROR
  },
  {
    name: 'JWT Error',
    error: Object.assign(new Error('invalid token'), { name: 'JsonWebTokenError' }),
    expectedStatus: 401,
    expectedCode: ErrorCode.INVALID_TOKEN
  },
  {
    name: 'Token Expired Error',
    error: Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' }),
    expectedStatus: 401,
    expectedCode: ErrorCode.TOKEN_EXPIRED
  },
  {
    name: 'Database Error',
    error: Object.assign(new Error('connection failed'), { name: 'PostgresError' }),
    expectedStatus: 503,
    expectedCode: ErrorCode.DATABASE_ERROR
  },
  {
    name: 'Rate Limit Error',
    error: Object.assign(new Error('too many requests'), { name: 'TooManyRequestsError' }),
    expectedStatus: 429,
    expectedCode: ErrorCode.RATE_LIMIT_EXCEEDED
  },
  {
    name: 'Groq API Error',
    error: Object.assign(new Error('API error'), { name: 'GroqError' }),
    expectedStatus: 502,
    expectedCode: ErrorCode.GROQ_API_ERROR
  },
  {
    name: 'ElevenLabs API Error',
    error: Object.assign(new Error('API error'), { name: 'ElevenLabsError' }),
    expectedStatus: 502,
    expectedCode: ErrorCode.ELEVENLABS_API_ERROR
  },
  {
    name: 'Unknown Error',
    error: new Error('Something went wrong'),
    expectedStatus: 500,
    expectedCode: ErrorCode.INTERNAL_ERROR
  }
];

// Test runner
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    details: [] as any[]
  };

  console.log('Testing Error Handler:');
  console.log('='.repeat(50));

  for (const testCase of testCases) {
    const req = createMockReq();
    const res = createMockRes();
    const next = () => {};

    try {
      errorHandler(testCase.error, req as Request, res as Response, next);

      const passed = (
        res.statusCode === testCase.expectedStatus &&
        res.body?.code === testCase.expectedCode
      );

      if (passed) {
        console.log(`✅ PASS: ${testCase.name}`);
        results.passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.name}`);
        console.log('Expected:', {
          status: testCase.expectedStatus,
          code: testCase.expectedCode
        });
        console.log('Received:', {
          status: res.statusCode,
          code: res.body?.code
        });
        results.failed++;
      }

      results.details.push({
        name: testCase.name,
        result: passed ? 'pass' : 'fail',
        expected: {
          status: testCase.expectedStatus,
          code: testCase.expectedCode
        },
        received: {
          status: res.statusCode,
          code: res.body?.code,
          body: res.body
        }
      });
    } catch (error) {
      console.log(`❌ FAIL: ${testCase.name} (Error during test)`);
      console.log('Error:', error);
      results.failed++;

      results.details.push({
        name: testCase.name,
        result: 'error',
        error: error
      });
    }
  }

  console.log('\nTest Summary:');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  return results;
}

// Run tests
runTests().catch(console.error);