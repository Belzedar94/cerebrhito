export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(message = 'Unauthorized', details?: any): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401, details);
  }

  static forbidden(message = 'Forbidden', details?: any): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403, details);
  }

  static notFound(message = 'Not found', details?: any): AppError {
    return new AppError(ErrorCode.NOT_FOUND, message, 404, details);
  }

  static validation(message = 'Validation error', details?: any): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static conflict(message = 'Conflict', details?: any): AppError {
    return new AppError(ErrorCode.CONFLICT, message, 409, details);
  }

  static internal(message = 'Internal server error', details?: any): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details);
  }

  static badRequest(message = 'Bad request', details?: any): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, 400, details);
  }

  static serviceUnavailable(message = 'Service unavailable', details?: any): AppError {
    return new AppError(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  }
}