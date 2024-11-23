import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../errors/types';
import { logger } from '../utils/logger';

interface ValidationOptions {
  stripUnknown?: boolean;
  strict?: boolean;
}

/**
 * Creates a validation middleware for request data
 * @param schema The Zod schema to validate against
 * @param target The part of the request to validate (body, query, params)
 * @param options Validation options
 */
export const validate = (
  schema: AnyZodObject,
  target: 'body' | 'query' | 'params' = 'body',
  options: ValidationOptions = { stripUnknown: true, strict: true }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await schema.parseAsync(req[target], {
        stripUnknown: options.stripUnknown,
        strict: options.strict
      });
      req[target] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', {
          path: req.path,
          target,
          errors: error.errors,
          data: req[target]
        });

        next(AppError.validation('Invalid request data', {
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates multiple parts of the request
 * @param schemas Object containing schemas for different parts of the request
 * @param options Validation options
 */
export const validateRequest = (
  schemas: {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
  },
  options: ValidationOptions = { stripUnknown: true, strict: true }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationPromises: Promise<void>[] = [];
      const errors: { target: string; errors: ZodError['errors'] }[] = [];

      if (schemas.body) {
        validationPromises.push(
          schemas.body.parseAsync(req.body, options)
            .then(data => { req.body = data; })
            .catch(error => {
              if (error instanceof ZodError) {
                errors.push({ target: 'body', errors: error.errors });
              }
              throw error;
            })
        );
      }

      if (schemas.query) {
        validationPromises.push(
          schemas.query.parseAsync(req.query, options)
            .then(data => { req.query = data; })
            .catch(error => {
              if (error instanceof ZodError) {
                errors.push({ target: 'query', errors: error.errors });
              }
              throw error;
            })
        );
      }

      if (schemas.params) {
        validationPromises.push(
          schemas.params.parseAsync(req.params, options)
            .then(data => { req.params = data; })
            .catch(error => {
              if (error instanceof ZodError) {
                errors.push({ target: 'params', errors: error.errors });
              }
              throw error;
            })
        );
      }

      await Promise.all(validationPromises);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', {
          path: req.path,
          errors: error.errors,
          data: {
            body: schemas.body ? req.body : undefined,
            query: schemas.query ? req.query : undefined,
            params: schemas.params ? req.params : undefined
          }
        });

        next(AppError.validation('Invalid request data', {
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates file uploads
 * @param allowedTypes Array of allowed MIME types
 * @param maxSize Maximum file size in bytes
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSize: number
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.files && !req.file) {
      return next(AppError.validation('No file uploaded'));
    }

    const files = req.files ? Object.values(req.files).flat() : [req.file];

    for (const file of files) {
      if (!file) continue;

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return next(AppError.validation('Invalid file type', {
          allowedTypes,
          receivedType: file.mimetype
        }));
      }

      // Check file size
      if (file.size > maxSize) {
        return next(AppError.validation('File too large', {
          maxSize,
          receivedSize: file.size
        }));
      }
    }

    next();
  };
};

/**
 * Validates pagination parameters
 */
export const validatePagination = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1) {
      return next(AppError.validation('Page must be greater than 0'));
    }

    if (limit < 1 || limit > 100) {
      return next(AppError.validation('Limit must be between 1 and 100'));
    }

    req.query.page = page.toString();
    req.query.limit = limit.toString();
    next();
  };
};

/**
 * Validates sort parameters
 * @param allowedFields Array of fields that can be used for sorting
 */
export const validateSort = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const sort = req.query.sort as string;
    if (!sort) return next();

    const [field, order] = sort.split(':');
    
    if (!allowedFields.includes(field)) {
      return next(AppError.validation('Invalid sort field', {
        allowedFields,
        receivedField: field
      }));
    }

    if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
      return next(AppError.validation('Invalid sort order', {
        allowedOrders: ['asc', 'desc'],
        receivedOrder: order
      }));
    }

    next();
  };
};