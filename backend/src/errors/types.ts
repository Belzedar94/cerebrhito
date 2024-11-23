export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  RESOURCE_EXPIRED = 'RESOURCE_EXPIRED',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  CHILD_NOT_FOUND = 'CHILD_NOT_FOUND',
  ACTIVITY_NOT_FOUND = 'ACTIVITY_NOT_FOUND',
  MILESTONE_NOT_FOUND = 'MILESTONE_NOT_FOUND',
  DUPLICATE_CHILD = 'DUPLICATE_CHILD',
  DUPLICATE_ACTIVITY = 'DUPLICATE_ACTIVITY',
  DUPLICATE_MILESTONE = 'DUPLICATE_MILESTONE',

  // Validation & Input
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_AGE_RANGE = 'INVALID_AGE_RANGE',
  INVALID_ACTIVITY_TYPE = 'INVALID_ACTIVITY_TYPE',
  INVALID_MILESTONE_STATUS = 'INVALID_MILESTONE_STATUS',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // External Services
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  GROQ_API_ERROR = 'GROQ_API_ERROR',
  ELEVENLABS_API_ERROR = 'ELEVENLABS_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AI_CONTEXT_ERROR = 'AI_CONTEXT_ERROR',
  AI_RESPONSE_ERROR = 'AI_RESPONSE_ERROR',
  TTS_CONVERSION_ERROR = 'TTS_CONVERSION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Internal Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  PROCESS_ERROR = 'PROCESS_ERROR',
  TASK_QUEUE_ERROR = 'TASK_QUEUE_ERROR',
  BACKGROUND_JOB_ERROR = 'BACKGROUND_JOB_ERROR',
  CLEANUP_ERROR = 'CLEANUP_ERROR',
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

  static invalidRefreshToken(message = 'Invalid refresh token', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_REFRESH_TOKEN, message, 401, details);
  }

  static sessionExpired(message = 'Session has expired', details?: any): AppError {
    return new AppError(ErrorCode.SESSION_EXPIRED, message, 401, details);
  }

  static accountLocked(message = 'Account is locked', details?: any): AppError {
    return new AppError(ErrorCode.ACCOUNT_LOCKED, message, 403, details);
  }

  static accountDisabled(message = 'Account is disabled', details?: any): AppError {
    return new AppError(ErrorCode.ACCOUNT_DISABLED, message, 403, details);
  }

  static emailNotVerified(message = 'Email not verified', details?: any): AppError {
    return new AppError(ErrorCode.EMAIL_NOT_VERIFIED, message, 403, details);
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

  static childNotFound(message = 'Child not found', details?: any): AppError {
    return new AppError(ErrorCode.CHILD_NOT_FOUND, message, 404, details);
  }

  static activityNotFound(message = 'Activity not found', details?: any): AppError {
    return new AppError(ErrorCode.ACTIVITY_NOT_FOUND, message, 404, details);
  }

  static milestoneNotFound(message = 'Milestone not found', details?: any): AppError {
    return new AppError(ErrorCode.MILESTONE_NOT_FOUND, message, 404, details);
  }

  static duplicateChild(message = 'Child already exists', details?: any): AppError {
    return new AppError(ErrorCode.DUPLICATE_CHILD, message, 409, details);
  }

  static duplicateActivity(message = 'Activity already exists', details?: any): AppError {
    return new AppError(ErrorCode.DUPLICATE_ACTIVITY, message, 409, details);
  }

  static duplicateMilestone(message = 'Milestone already exists', details?: any): AppError {
    return new AppError(ErrorCode.DUPLICATE_MILESTONE, message, 409, details);
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

  static invalidDateFormat(message = 'Invalid date format', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_DATE_FORMAT, message, 400, details);
  }

  static invalidAgeRange(message = 'Invalid age range', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_AGE_RANGE, message, 400, details);
  }

  static invalidActivityType(message = 'Invalid activity type', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_ACTIVITY_TYPE, message, 400, details);
  }

  static invalidMilestoneStatus(message = 'Invalid milestone status', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_MILESTONE_STATUS, message, 400, details);
  }

  static invalidFileType(message = 'Invalid file type', details?: any): AppError {
    return new AppError(ErrorCode.INVALID_FILE_TYPE, message, 400, details);
  }

  static fileTooLarge(message = 'File too large', details?: any): AppError {
    return new AppError(ErrorCode.FILE_TOO_LARGE, message, 400, details);
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

  static aiContextError(message = 'AI context error', details?: any): AppError {
    return new AppError(ErrorCode.AI_CONTEXT_ERROR, message, 502, details);
  }

  static aiResponseError(message = 'AI response error', details?: any): AppError {
    return new AppError(ErrorCode.AI_RESPONSE_ERROR, message, 502, details);
  }

  static ttsConversionError(message = 'TTS conversion error', details?: any): AppError {
    return new AppError(ErrorCode.TTS_CONVERSION_ERROR, message, 502, details);
  }

  static storageError(message = 'Storage error', details?: any): AppError {
    return new AppError(ErrorCode.STORAGE_ERROR, message, 503, details);
  }

  static networkError(message = 'Network error', details?: any): AppError {
    return new AppError(ErrorCode.NETWORK_ERROR, message, 503, details);
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

  static memoryError(message = 'Memory error', details?: any): AppError {
    return new AppError(ErrorCode.MEMORY_ERROR, message, 500, details);
  }

  static processError(message = 'Process error', details?: any): AppError {
    return new AppError(ErrorCode.PROCESS_ERROR, message, 500, details);
  }

  static taskQueueError(message = 'Task queue error', details?: any): AppError {
    return new AppError(ErrorCode.TASK_QUEUE_ERROR, message, 500, details);
  }

  static backgroundJobError(message = 'Background job error', details?: any): AppError {
    return new AppError(ErrorCode.BACKGROUND_JOB_ERROR, message, 500, details);
  }

  static cleanupError(message = 'Cleanup error', details?: any): AppError {
    return new AppError(ErrorCode.CLEANUP_ERROR, message, 500, details);
  }
}
