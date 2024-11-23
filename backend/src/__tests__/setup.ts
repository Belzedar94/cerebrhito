import { logger } from '../utils/logger';

// Disable logging during tests unless explicitly enabled
logger.silent = !process.env.ENABLE_LOGS;

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;

    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
  toBeValidURL(received: string) {
    try {
      new URL(received);

      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },
  toBeValidDate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },
  toBeValidJSON(received: string) {
    try {
      JSON.parse(received);

      return {
        message: () => `expected ${received} not to be valid JSON`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be valid JSON`,
        pass: false,
      };
    }
  },
  toBeValidBase64(received: string) {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const pass = base64Regex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be valid base64`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid base64`,
        pass: false,
      };
    }
  },
  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
  toBeValidPhoneNumber(received: string) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const pass = phoneRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid phone number`,
        pass: false,
      };
    }
  },
  toBeValidIPAddress(received: string) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    const pass = ipv4Regex.test(received) || ipv6Regex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid IP address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid IP address`,
        pass: false,
      };
    }
  },
  toBeValidMIMEType(received: string) {
    const mimeRegex = /^[a-z]+\/[a-z0-9\-\+\.]+$/i;
    const pass = mimeRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid MIME type`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid MIME type`,
        pass: false,
      };
    }
  },
  toBeValidLanguageCode(received: string) {
    const langRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    const pass = langRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid language code`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid language code`,
        pass: false,
      };
    }
  },
});

// Add global test utilities
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Add custom type declarations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidURL(): R;
      toBeValidDate(): R;
      toBeValidJSON(): R;
      toBeValidBase64(): R;
      toBeValidJWT(): R;
      toBeValidPhoneNumber(): R;
      toBeValidIPAddress(): R;
      toBeValidMIMEType(): R;
      toBeValidLanguageCode(): R;
    }
  }

  let sleep: (ms: number) => Promise<void>;
}
