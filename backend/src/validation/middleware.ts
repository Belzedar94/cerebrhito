import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError, ErrorCode } from '../errors/types';
import { logger } from '../utils/logger';
import sanitizeHtml from 'sanitize-html';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Validation failed',
          400,
          error.errors
        ));
      } else {
        next(error);
      }
    }
  };
};

const defaultSanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  allowedAttributes: {},
  allowedStyles: {},
};

export const sanitizeBody = (fields: string[], options = defaultSanitizeOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeHtml(req.body[field], options);
        }
      }
      next();
    } catch (error) {
      logger.error('Error sanitizing request body', { error, fields });
      next(new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Error sanitizing request body',
        400
      ));
    }
  };
};

export const validateAndSanitize = (schema: AnyZodObject, sanitizeFields: string[] = []) => {
  return [
    sanitizeBody(sanitizeFields),
    validateRequest(schema)
  ];
};