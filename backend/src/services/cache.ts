import { createClient } from 'redis';
import { IService } from './base';
import { logger } from '../utils/logger';

export interface CacheConfig {
  url?: string;
  defaultTtl: number;
}

export class CacheService implements IService {
  private client;
  private defaultTtl: number;

  constructor(config: CacheConfig) {
    this.client = createClient({
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.defaultTtl = config.defaultTtl;

    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });
  }

  async init(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Cache service initialized');
    } catch (error) {
      logger.error('Failed to initialize cache service', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    await this.client.quit();
    logger.info('Cache service disposed');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else if (this.defaultTtl > 0) {
        await this.client.setEx(key, this.defaultTtl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      let cursor = 0;
      do {
        const { cursor: newCursor, keys } = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        cursor = newCursor;

        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      logger.error('Cache clear pattern error', { pattern, error });
    }
  }

  generateKey(parts: string[]): string {
    return parts.join(':');
  }
}