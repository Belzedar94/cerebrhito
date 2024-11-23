import { Request, Response, NextFunction } from 'express';
import { CacheManager } from '../services/cacheManager';
import { logger } from '../utils/logger';

interface CacheOptions {
  type: string;
  key?: string | ((req: Request) => string);
  ttl?: number;
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(
  cacheManager: CacheManager,
  options: CacheOptions
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache if condition is not met
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = typeof options.key === 'function'
      ? options.key(req)
      : options.key || `${req.method}:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await cacheManager.get(cacheKey, options.type);
      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey, type: options.type });
        return res.json(cachedData);
      }

      // Store original send function
      const originalSend = res.send;

      // Override send function to cache response
      res.send = function (body: any): Response {
        try {
          // Parse response body if it's JSON
          const data = typeof body === 'string' ? JSON.parse(body) : body;

          // Cache only successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheManager.set(cacheKey, data, options.type)
              .catch(error => {
                logger.error('Failed to cache response', {
                  key: cacheKey,
                  type: options.type,
                  error
                });
              });
          }
        } catch (error) {
          logger.error('Error caching response', {
            key: cacheKey,
            type: options.type,
            error
          });
        }

        // Call original send function
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', {
        key: cacheKey,
        type: options.type,
        error
      });
      next();
    }
  };
}

export function clearCacheMiddleware(
  cacheManager: CacheManager,
  type: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to invalidate cache
    res.send = function (body: any): Response {
      try {
        // Invalidate cache only for successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const operation = req.method === 'POST'
            ? 'create'
            : req.method === 'PUT' || req.method === 'PATCH'
            ? 'update'
            : req.method === 'DELETE'
            ? 'delete'
            : null;

          if (operation) {
            cacheManager.invalidate(type, operation)
              .catch(error => {
                logger.error('Failed to invalidate cache', {
                  type,
                  operation,
                  error
                });
              });
          }
        }
      } catch (error) {
        logger.error('Error invalidating cache', { type, error });
      }

      // Call original send function
      return originalSend.call(this, body);
    };

    next();
  };
}