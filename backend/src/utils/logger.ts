import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Custom log levels with corresponding colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(logColors);

// Custom format for development console output
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info =>
      `${info.timestamp} ${info.level}: ${info.message}${
        info.splat !== undefined ? `${info.splat}` : ' '
      }${info.stack !== undefined ? `\n${info.stack}` : ''}${
        info.metadata && Object.keys(info.metadata).length
          ? `\n${JSON.stringify(info.metadata, null, 2)}`
          : ''
      }`
  )
);

// Custom format for production JSON output
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] }),
  winston.format.json()
);

// Define log directory
const LOG_DIR = path.join(process.cwd(), 'logs');

// Create rotating file transport for error logs
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d', // Keep logs for 30 days
  maxSize: '20m', // Rotate when size reaches 20MB
  format: productionFormat,
  zippedArchive: true,
});

// Create rotating file transport for combined logs
const combinedFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  format: productionFormat,
  zippedArchive: true,
});

// Create rotating file transport for HTTP logs
const httpFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(LOG_DIR, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxFiles: '7d', // Keep HTTP logs for 7 days
  maxSize: '20m',
  format: productionFormat,
  zippedArchive: true,
});

// Create console transport with appropriate format based on environment
const consoleTransport = new winston.transports.Console({
  format: process.env.NODE_ENV === 'development' ? developmentFormat : productionFormat,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

// Create the logger instance
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transports: [
    consoleTransport,
    errorFileRotateTransport,
    combinedFileRotateTransport,
    httpFileRotateTransport,
  ],
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: productionFormat,
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: productionFormat,
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

// Add request logging method
logger.http = logger.log.bind(logger, 'http');

// Export a function to create child loggers with additional context
export function createChildLogger(context: object) {
  return logger.child(context);
}
