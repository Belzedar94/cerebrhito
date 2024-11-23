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
  CLEANUP_ERROR = 'CLEANUP_ERROR'
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
}

export interface ErrorDetails {
  title: string;
  description: string;
  action?: string;
  variant?: 'default' | 'destructive';
}

export const getErrorDetails = (error: ErrorResponse): ErrorDetails => {
  const { code, message, details } = error;

  // Default error details
  const defaultError: ErrorDetails = {
    title: 'Error',
    description: message || 'An unexpected error occurred',
    variant: 'destructive'
  };

  // Error code to user-friendly message mapping
  switch (code) {
    // Authentication & Authorization
    case ErrorCode.UNAUTHORIZED:
      return {
        title: 'Authentication Required',
        description: 'Please sign in to continue',
        action: 'Sign In',
        variant: 'default'
      };

    case ErrorCode.FORBIDDEN:
      return {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource',
        variant: 'destructive'
      };

    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.INVALID_TOKEN:
    case ErrorCode.INVALID_REFRESH_TOKEN:
    case ErrorCode.SESSION_EXPIRED:
      return {
        title: 'Session Expired',
        description: 'Your session has expired. Please sign in again',
        action: 'Sign In',
        variant: 'default'
      };

    case ErrorCode.ACCOUNT_LOCKED:
      return {
        title: 'Account Locked',
        description: 'Your account has been locked. Please contact support',
        action: 'Contact Support',
        variant: 'destructive'
      };

    case ErrorCode.ACCOUNT_DISABLED:
      return {
        title: 'Account Disabled',
        description: 'Your account has been disabled. Please contact support',
        action: 'Contact Support',
        variant: 'destructive'
      };

    case ErrorCode.EMAIL_NOT_VERIFIED:
      return {
        title: 'Email Not Verified',
        description: 'Please verify your email address to continue',
        action: 'Resend Verification',
        variant: 'default'
      };

    // Resource Errors
    case ErrorCode.NOT_FOUND:
    case ErrorCode.CHILD_NOT_FOUND:
    case ErrorCode.ACTIVITY_NOT_FOUND:
    case ErrorCode.MILESTONE_NOT_FOUND:
      return {
        title: 'Not Found',
        description: message || 'The requested resource was not found',
        variant: 'destructive'
      };

    case ErrorCode.CONFLICT:
    case ErrorCode.DUPLICATE_CHILD:
    case ErrorCode.DUPLICATE_ACTIVITY:
    case ErrorCode.DUPLICATE_MILESTONE:
      return {
        title: 'Duplicate Entry',
        description: message || 'This item already exists',
        variant: 'destructive'
      };

    case ErrorCode.RESOURCE_DELETED:
      return {
        title: 'Resource Deleted',
        description: 'This item has been deleted',
        variant: 'destructive'
      };

    case ErrorCode.RESOURCE_EXPIRED:
      return {
        title: 'Resource Expired',
        description: 'This item has expired',
        variant: 'destructive'
      };

    case ErrorCode.RESOURCE_LIMIT_EXCEEDED:
      return {
        title: 'Limit Exceeded',
        description: 'You have reached the maximum limit for this resource',
        variant: 'destructive'
      };

    // Validation & Input
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.BAD_REQUEST:
    case ErrorCode.INVALID_INPUT_FORMAT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return {
        title: 'Invalid Input',
        description: message || 'Please check your input and try again',
        variant: 'destructive'
      };

    case ErrorCode.INVALID_CREDENTIALS:
      return {
        title: 'Invalid Credentials',
        description: 'The email or password you entered is incorrect',
        variant: 'destructive'
      };

    case ErrorCode.INVALID_DATE_FORMAT:
      return {
        title: 'Invalid Date',
        description: 'Please enter a valid date',
        variant: 'destructive'
      };

    case ErrorCode.INVALID_AGE_RANGE:
      return {
        title: 'Invalid Age Range',
        description: 'Please enter a valid age range',
        variant: 'destructive'
      };

    case ErrorCode.INVALID_FILE_TYPE:
      return {
        title: 'Invalid File Type',
        description: 'Please upload a supported file type',
        variant: 'destructive'
      };

    case ErrorCode.FILE_TOO_LARGE:
      return {
        title: 'File Too Large',
        description: 'Please upload a smaller file',
        variant: 'destructive'
      };

    // External Services
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CACHE_ERROR:
    case ErrorCode.STORAGE_ERROR:
    case ErrorCode.NETWORK_ERROR:
      return {
        title: 'Service Unavailable',
        description: 'The service is temporarily unavailable. Please try again later',
        variant: 'destructive'
      };

    case ErrorCode.AI_SERVICE_ERROR:
    case ErrorCode.GROQ_API_ERROR:
    case ErrorCode.AI_CONTEXT_ERROR:
    case ErrorCode.AI_RESPONSE_ERROR:
      return {
        title: 'AI Service Error',
        description: 'There was an error with the AI service. Please try again',
        variant: 'destructive'
      };

    case ErrorCode.ELEVENLABS_API_ERROR:
    case ErrorCode.TTS_CONVERSION_ERROR:
      return {
        title: 'Text-to-Speech Error',
        description: 'There was an error converting text to speech. Please try again',
        variant: 'destructive'
      };

    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return {
        title: 'Rate Limit Exceeded',
        description: 'You have made too many requests. Please try again later',
        variant: 'destructive'
      };

    // Internal Errors
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.CONFIG_ERROR:
    case ErrorCode.INITIALIZATION_ERROR:
    case ErrorCode.MEMORY_ERROR:
    case ErrorCode.PROCESS_ERROR:
    case ErrorCode.TASK_QUEUE_ERROR:
    case ErrorCode.BACKGROUND_JOB_ERROR:
    case ErrorCode.CLEANUP_ERROR:
      return {
        title: 'Internal Error',
        description: 'An internal error occurred. Please try again later',
        variant: 'destructive'
      };

    default:
      return defaultError;
  }
};