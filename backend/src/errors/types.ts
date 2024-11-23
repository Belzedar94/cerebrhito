export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  RESOURCE_EXPIRED = 'RESOURCE_EXPIRED',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',

  // Validation & Input
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // External Services
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  GROQ_API_ERROR = 'GROQ_API_ERROR',
  ELEVENLABS_API_ERROR = 'ELEVENLABS_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Internal Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR'
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

  // Authentication & Authorization Errors
  static unauthorized(message = 'Unauthorized', details?: any): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401, details);
  }

  static forbidden(message = 'Forbidden', details?: any): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403, details);
  }

  static tokenExpired(message = 'Token has expired', details?: any): AppError {
    return new AppError(ErrorCode.TOKEN_EXPIRED, message, 401, details);
  }

  static invalidToken(message = 'Invalid token', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_TOKEN, message, 401, details);
  }

  static insufficientPermissions(message = 'Insufficient permissions', details?: any): AppError {
    return new AppError(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403, details);
  }

  // Resource Errors
  static notFound(message = 'Resource not found', details?: any): AppError {
    return new AppError(ErrorCode.NOT_FOUND, message, 404, details);
  }

  static conflict(message = 'Resource conflict', details?: any): AppError {
    return new AppError(ErrorCode.CONFLICT, message, 409, details);
  }

  static resourceDeleted(message = 'Resource has been deleted', details?: any): AppError {
    return new AppError(ErrorCode.RESOURCE_DELETED, message, 410, details);
  }

  static resourceExpired(message = 'Resource has expired', details?: any): AppError {
    return new AppError(ErrorCode.RESOURCE_EXPIRED, message, 410, details);
  }

  static resourceLimitExceeded(message = 'Resource limit exceeded', details?: any): AppError {
    return new AppError(ErrorCode.RESOURCE_LIMIT_EXCEEDED, message, 429, details);
  }

  // Validation & Input Errors
  static validation(message = 'Validation error', details?: any): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }

  static badRequest(message = 'Bad request', details?: any): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, 400, details);
  }

  static invalidInputFormat(message = 'Invalid input format', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_INPUT_FORMAT, message, 400, details);
  }

  static missingRequiredField(message = 'Missing required field', details?: any): AppError {
    return new AppError(ErrorCode.MISSING_REQUIRED_FIELD, message, 400, details);
  }

  static invalidCredentials(message = 'Invalid credentials', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_CREDENTIALS, message, 401, details);
  }

  // External Service Errors
  static serviceUnavailable(message = 'Service unavailable', details?: any): AppError {
    return new AppError(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  }

  static aiServiceError(message = 'AI service error', details?: any): AppError {
    return new AppError(ErrorCode.AI_SERVICE_ERROR, message, 502, details);
  }

  static groqApiError(message = 'Groq API error', details?: any): AppError {
    return new AppError(ErrorCode.GROQ_API_ERROR, message, 502, details);
  }

  static elevenLabsApiError(message = 'ElevenLabs API error', details?: any): AppError {
    return new AppError(ErrorCode.ELEVENLABS_API_ERROR, message, 502, details);
  }

  static databaseError(message = 'Database error', details?: any): AppError {
    return new AppError(ErrorCode.DATABASE_ERROR, message, 503, details);
  }

  static cacheError(message = 'Cache error', details?: any): AppError {
    return new AppError(ErrorCode.CACHE_ERROR, message, 503, details);
  }

  static rateLimitExceeded(message = 'Rate limit exceeded', details?: any): AppError {
    return new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details);
  }

  // Internal Errors
  static internal(message = 'Internal server error', details?: any): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details);
  }

  static configError(message = 'Configuration error', details?: any): AppError {
    return new AppError(ErrorCode.CONFIG_ERROR, message, 500, details);
  }

  static initializationError(message = 'Initialization error', details?: any): AppError {
    return new AppError(ErrorCode.INITIALIZATION_ERROR, message, 500, details);
  }
}