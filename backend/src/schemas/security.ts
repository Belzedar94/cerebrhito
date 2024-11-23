import { z } from 'zod';

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Email validation schema
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters')
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'Invalid email format'
  );

// Phone number validation schema
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format. Must follow E.164 format'
  );

// URL validation schema
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .regex(
    /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    'URL must start with http:// or https://'
  );

// File validation schema
export const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  buffer: z.instanceof(Buffer),
  size: z.number().max(10 * 1024 * 1024, 'File size must not exceed 10MB')
});

// API key validation schema
export const apiKeySchema = z
  .string()
  .regex(
    /^[A-Za-z0-9_-]{32,}$/,
    'Invalid API key format. Must be at least 32 characters long and contain only letters, numbers, underscores, and hyphens'
  );

// JWT validation schema
export const jwtSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    'Invalid JWT format'
  );

// UUID validation schema
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

// Date validation schema
export const dateSchema = z
  .string()
  .datetime('Invalid date format. Must be ISO 8601 format');

// IP address validation schema
export const ipSchema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Invalid IP address format'
  );

// User agent validation schema
export const userAgentSchema = z
  .string()
  .min(1, 'User agent must not be empty')
  .max(500, 'User agent must not exceed 500 characters');

// Request ID validation schema
export const requestIdSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9-_]{8,}$/,
    'Invalid request ID format. Must be at least 8 characters long and contain only letters, numbers, underscores, and hyphens'
  );

// Content type validation schema
export const contentTypeSchema = z
  .string()
  .regex(
    /^[a-z]+\/[a-z0-9\-\+\.]+$/i,
    'Invalid content type format'
  );

// Security headers validation schema
export const securityHeadersSchema = z.object({
  'content-security-policy': z.string().optional(),
  'x-frame-options': z.string().optional(),
  'x-content-type-options': z.string().optional(),
  'x-xss-protection': z.string().optional(),
  'referrer-policy': z.string().optional(),
  'strict-transport-security': z.string().optional(),
  'x-permitted-cross-domain-policies': z.string().optional(),
  'x-download-options': z.string().optional(),
  'expect-ct': z.string().optional(),
  'feature-policy': z.string().optional(),
  'access-control-allow-origin': z.string().optional(),
  'access-control-allow-methods': z.string().optional(),
  'access-control-allow-headers': z.string().optional(),
  'access-control-expose-headers': z.string().optional(),
  'access-control-max-age': z.string().optional(),
  'access-control-allow-credentials': z.string().optional()
});

// Audit event validation schema
export const auditEventSchema = z.object({
  userId: uuidSchema,
  action: z.string().min(1, 'Action must not be empty'),
  resourceType: z.string().min(1, 'Resource type must not be empty'),
  resourceId: uuidSchema,
  details: z.record(z.any()).optional(),
  ip: ipSchema.optional(),
  userAgent: userAgentSchema.optional(),
  status: z.enum(['success', 'failure']),
  error: z.string().optional()
});

// Security policy validation schema
export const securityPolicySchema = z.object({
  passwordMinLength: z.number().min(8),
  passwordMaxLength: z.number().max(72),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSpecialChars: z.boolean(),
  passwordExpiryDays: z.number().min(0),
  passwordHistorySize: z.number().min(0),
  sessionTimeoutMinutes: z.number().min(1),
  maxLoginAttempts: z.number().min(1),
  lockoutDurationMinutes: z.number().min(1),
  mfaEnabled: z.boolean(),
  mfaMethods: z.array(z.enum(['sms', 'email', 'authenticator'])),
  ipWhitelist: z.array(ipSchema).optional(),
  ipBlacklist: z.array(ipSchema).optional(),
  allowedOrigins: z.array(urlSchema),
  allowedMethods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])),
  allowedHeaders: z.array(z.string()),
  exposedHeaders: z.array(z.string()),
  maxRequestSize: z.number().min(1),
  rateLimitRequests: z.number().min(1),
  rateLimitWindowMs: z.number().min(1),
  speedLimitRequests: z.number().min(1),
  speedLimitWindowMs: z.number().min(1),
  speedLimitDelayMs: z.number().min(0)
});

// Security quota validation schema
export const securityQuotaSchema = z.object({
  children: z.object({
    free: z.number().min(0),
    basic: z.number().min(0),
    premium: z.number().min(0)
  }),
  activities: z.object({
    free: z.number().min(0),
    basic: z.number().min(0),
    premium: z.number().min(0)
  }),
  media: z.object({
    free: z.number().min(0),
    basic: z.number().min(0),
    premium: z.number().min(0)
  }),
  ai_chat: z.object({
    free: z.number().min(0),
    basic: z.number().min(0),
    premium: z.number().min(0)
  })
});

// Security statistics validation schema
export const securityStatsSchema = z.object({
  totalEvents: z.number().min(0),
  successfulEvents: z.number().min(0),
  failedEvents: z.number().min(0),
  uniqueUsers: z.number().min(0),
  topActions: z.array(z.object({
    action: z.string(),
    count: z.number().min(0)
  })),
  topResources: z.array(z.object({
    resourceType: z.string(),
    count: z.number().min(0)
  })),
  topErrors: z.array(z.object({
    error: z.string(),
    count: z.number().min(0)
  }))
});