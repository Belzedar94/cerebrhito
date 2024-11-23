import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { UAParser } from 'ua-parser-js';

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: any;
}

export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  const userAgent = new UAParser(req.headers['user-agent'] as string);

  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-frame-options',
    'x-xss-protection',
  ];

  const modifiedHeaders = suspiciousHeaders.filter(header => req.headers[header] !== undefined);

  if (modifiedHeaders.length > 0) {
    logSecurityEvent({
      type: 'SUSPICIOUS_HEADERS',
      severity: 'low',
      description: 'Request contains potentially spoofed headers',
      details: {
        requestId,
        headers: modifiedHeaders,
        ip: req.ip,
        path: req.path,
      },
    });
  }

  // Check for suspicious query parameters
  const suspiciousParams = ['exec', 'eval', 'script', 'alert', 'document'];
  const suspiciousQueryParams = Object.keys(req.query).filter(param =>
    suspiciousParams.some(
      suspicious =>
        param.toLowerCase().includes(suspicious) ||
        (typeof req.query[param] === 'string' &&
          (req.query[param] as string).toLowerCase().includes(suspicious))
    )
  );

  if (suspiciousQueryParams.length > 0) {
    logSecurityEvent({
      type: 'SUSPICIOUS_QUERY_PARAMS',
      severity: 'medium',
      description: 'Request contains potentially malicious query parameters',
      details: {
        requestId,
        params: suspiciousQueryParams,
        ip: req.ip,
        path: req.path,
      },
    });
  }

  // Check for suspicious user agent
  const browser = userAgent.getBrowser();
  const os = userAgent.getOS();
  const device = userAgent.getDevice();

  if (!browser.name || !os.name) {
    logSecurityEvent({
      type: 'SUSPICIOUS_USER_AGENT',
      severity: 'low',
      description: 'Request contains suspicious or missing user agent',
      details: {
        requestId,
        userAgent: req.headers['user-agent'],
        browser,
        os,
        device,
        ip: req.ip,
        path: req.path,
      },
    });
  }

  // Check for rate limiting
  const rateLimitRemaining = parseInt(res.getHeader('X-RateLimit-Remaining') as string);

  if (rateLimitRemaining !== undefined && rateLimitRemaining <= 0) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'medium',
      description: 'Rate limit exceeded for request',
      details: {
        requestId,
        ip: req.ip,
        path: req.path,
        rateLimitRemaining,
      },
    });
  }

  // Check for authentication failures
  res.on('finish', () => {
    if (res.statusCode === 401) {
      logSecurityEvent({
        type: 'AUTHENTICATION_FAILURE',
        severity: 'high',
        description: 'Failed authentication attempt',
        details: {
          requestId,
          ip: req.ip,
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
        },
      });
    }

    // Check for authorization failures
    if (res.statusCode === 403) {
      logSecurityEvent({
        type: 'AUTHORIZATION_FAILURE',
        severity: 'high',
        description: 'Unauthorized access attempt',
        details: {
          requestId,
          ip: req.ip,
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          userId: (req as any).user?.id,
        },
      });
    }

    // Check for server errors that might indicate security issues
    if (res.statusCode >= 500) {
      logSecurityEvent({
        type: 'SERVER_ERROR',
        severity: 'medium',
        description: 'Server error that might indicate security issue',
        details: {
          requestId,
          ip: req.ip,
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          userId: (req as any).user?.id,
        },
      });
    }
  });

  next();
};

function logSecurityEvent(event: SecurityEvent) {
  const logMessage = `Security Event: ${event.type}`;
  const logData = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  switch (event.severity) {
    case 'critical':
      logger.error(logMessage, logData);
      // TODO: Send immediate notification to security team
      break;
    case 'high':
      logger.error(logMessage, logData);
      break;
    case 'medium':
      logger.warn(logMessage, logData);
      break;
    case 'low':
      logger.info(logMessage, logData);
      break;
  }
}
