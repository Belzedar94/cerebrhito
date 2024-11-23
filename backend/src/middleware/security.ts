import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import cors from 'cors';
import { expressCspHeader, INLINE, NONE, SELF } from 'express-csp-header';
import { logger } from '../utils/logger';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later',
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      headers: req.headers
    });
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later'
    });
  }
};

// Speed limiting configuration
const speedLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes without delay
  delayMs: 500, // Begin adding 500ms of delay per request above 100
  maxDelayMs: 2000, // Maximum delay per request
  onLimitReached: (req: Request) => {
    logger.warn('Speed limit reached', {
      ip: req.ip,
      path: req.path,
      headers: req.headers
    });
  }
};

// CORS configuration
const corsConfig = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-API-Key',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// CSP configuration
const cspConfig = {
  directives: {
    'default-src': [SELF],
    'script-src': [SELF, INLINE],
    'style-src': [SELF, INLINE],
    'img-src': [SELF, 'data:', 'https:'],
    'font-src': [SELF, 'https://fonts.gstatic.com'],
    'object-src': [NONE],
    'media-src': [SELF],
    'frame-src': [NONE],
    'connect-src': [
      SELF,
      'https://api.groq.com',
      'https://api.elevenlabs.io',
      process.env.SUPABASE_URL || ''
    ],
    'worker-src': [SELF],
    'manifest-src': [SELF],
    'form-action': [SELF],
    'frame-ancestors': [NONE],
    'base-uri': [SELF]
  }
};

// Security middleware
export const securityMiddleware = [
  // Helmet middleware for security headers
  helmet({
    contentSecurityPolicy: false, // We'll use express-csp-header instead
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: true,
    referrerPolicy: true,
    xssFilter: true
  }),

  // CSP middleware
  expressCspHeader(cspConfig),

  // CORS middleware
  cors(corsConfig),

  // Rate limiting middleware
  rateLimit(rateLimitConfig),

  // Speed limiting middleware
  slowDown(speedLimitConfig),

  // Request ID middleware
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  },

  // Sanitize request body
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      // Remove any properties starting with $ or containing .
      const sanitizeObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (!key.startsWith('$') && !key.includes('.')) {
              result[key] = sanitizeObject(value);
            }
          }
          return result;
        }
        return obj;
      };

      req.body = sanitizeObject(req.body);
    }
    next();
  },

  // Validate content type
  (req: Request, res: Response, next: NextFunction) => {
    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      req.method !== 'OPTIONS' &&
      !req.is('application/json') &&
      !req.is('multipart/form-data')
    ) {
      logger.warn('Invalid content type', {
        ip: req.ip,
        path: req.path,
        contentType: req.headers['content-type']
      });
      return res.status(415).json({
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be application/json or multipart/form-data'
      });
    }
    next();
  },

  // Validate request size
  (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
      logger.warn('Request too large', {
        ip: req.ip,
        path: req.path,
        size: contentLength
      });
      return res.status(413).json({
        code: 'REQUEST_TOO_LARGE',
        message: 'Request body too large'
      });
    }
    next();
  },

  // Validate request parameters
  (req: Request, res: Response, next: NextFunction) => {
    const validateValue = (value: any): boolean => {
      if (typeof value === 'string') {
        // Check for common injection patterns
        const dangerousPatterns = [
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
          /\$not/i,
          /\$nor/i,
          /\$exists/i,
          /\$type/i,
          /\$mod/i,
          /\$all/i,
          /\$size/i,
          /\$elemMatch/i,
          /\$set/i,
          /\$unset/i,
          /\$inc/i,
          /\$mul/i,
          /\$rename/i,
          /\$setOnInsert/i,
          /\$addToSet/i,
          /\$pop/i,
          /\$pull/i,
          /\$push/i,
          /\$each/i,
          /\$slice/i,
          /\$sort/i,
          /\$position/i,
          /\$bit/i,
          /\$isolated/i,
          /\$comment/i,
          /\$text/i,
          /\$search/i,
          /\$language/i,
          /\$caseSensitive/i,
          /\$diacriticSensitive/i,
          /\$natural/i,
          /\$explain/i,
          /\$hint/i,
          /\$max/i,
          /\$min/i,
          /\$orderby/i,
          /\$returnKey/i,
          /\$showDiskLoc/i,
          /\$snapshot/i,
          /\$query/i,
          /\$atomic/i,
          /\$currentDate/i,
          /\$currentTimestamp/i,
          /\$inc/i,
          /\$min/i,
          /\$max/i,
          /\$mul/i,
          /\$rename/i,
          /\$set/i,
          /\$setOnInsert/i,
          /\$unset/i,
          /\$addToSet/i,
          /\$pop/i,
          /\$pullAll/i,
          /\$pull/i,
          /\$pushAll/i,
          /\$push/i,
          /\$bit/i,
          /\$isolated/i,
          /\$comment/i,
          /\$text/i,
          /\$search/i,
          /\$language/i,
          /\$caseSensitive/i,
          /\$diacriticSensitive/i,
          /\$natural/i,
          /\$explain/i,
          /\$hint/i,
          /\$max/i,
          /\$min/i,
          /\$orderby/i,
          /\$returnKey/i,
          /\$showDiskLoc/i,
          /\$snapshot/i,
          /\$query/i,
          /\$atomic/i,
          /\$currentDate/i,
          /\$currentTimestamp/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(value));
      }
      if (Array.isArray(value)) {
        return value.every(validateValue);
      }
      if (value && typeof value === 'object') {
        return Object.values(value).every(validateValue);
      }
      return true;
    };

    const params = { ...req.query, ...req.params };
    if (!validateValue(params)) {
      logger.warn('Invalid request parameters', {
        ip: req.ip,
        path: req.path,
        params
      });
      return res.status(400).json({
        code: 'INVALID_PARAMETERS',
        message: 'Invalid request parameters'
      });
    }
    next();
  }
];