import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);

    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';

    if (err.message.includes(targetError)) {
      return true;
    }

    return false;
  },
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Handle Redis events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', error => {
  logger.error('Redis client error', { error });
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});

redisClient.on('end', () => {
  logger.warn('Redis client connection ended');
});

// Cache configuration
export const cacheConfig = {
  // Default TTL for cached items (1 hour)
  defaultTTL: 60 * 60,

  // TTL for different types of data
  ttl: {
    // User data (1 hour)
    user: 60 * 60,
    // Child data (1 hour)
    child: 60 * 60,
    // Activity data (6 hours)
    activity: 6 * 60 * 60,
    // Milestone data (6 hours)
    milestone: 6 * 60 * 60,
    // Activity log data (15 minutes)
    activityLog: 15 * 60,
    // Milestone tracking data (15 minutes)
    milestoneTracking: 15 * 60,
    // Media data (1 day)
    media: 24 * 60 * 60,
    // AI chat history (1 day)
    aiChat: 24 * 60 * 60,
    // Notification data (5 minutes)
    notification: 5 * 60,
  },

  // Cache key prefixes
  prefix: {
    user: 'user:',
    child: 'child:',
    activity: 'activity:',
    milestone: 'milestone:',
    activityLog: 'activity_log:',
    milestoneTracking: 'milestone_tracking:',
    media: 'media:',
    aiChat: 'ai_chat:',
    notification: 'notification:',
  },

  // Cache key patterns for bulk operations
  pattern: {
    user: 'user:*',
    child: 'child:*',
    activity: 'activity:*',
    milestone: 'milestone:*',
    activityLog: 'activity_log:*',
    milestoneTracking: 'milestone_tracking:*',
    media: 'media:*',
    aiChat: 'ai_chat:*',
    notification: 'notification:*',
  },
};
