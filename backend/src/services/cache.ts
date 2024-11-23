import { createClient } from 'redis';
import { IService } from './base';
import { logger } from '../utils/logger';
import { AppError } from '../errors/types';

export interface CacheConfig {
  url?: string;
  defaultTtl: number;
  maxRetries?: number;
  retryDelay?: number;
  maxMemory?: string;
  maxKeys?: number;
  prefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memory: string;
  uptime: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
  };
}

export class CacheService implements IService {
  private client;
  private defaultTtl: number;
  private maxRetries: number;
  private retryDelay: number;
  private prefix: string;
  private stats: {
    hits: number;
    misses: number;
    operations: {
      gets: number;
      sets: number;
      deletes: number;
    };
  };

  constructor(config: CacheConfig) {
    this.client = createClient({
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > (config.maxRetries || 10)) {
            logger.error('Max cache reconnection attempts reached');
            return new Error('Max cache reconnection attempts reached');
          }
          return Math.min(retries * (config.retryDelay || 100), 3000);
        }
      }
    });

    this.defaultTtl = config.defaultTtl;
    this.maxRetries = config.maxRetries || 10;
    this.retryDelay = config.retryDelay || 100;
    this.prefix = config.prefix || '';
    this.stats = {
      hits: 0,
      misses: 0,
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0
      }
    };

    // Event handlers
    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis Client Reconnecting');
    });

    this.client.on('ready', async () => {
      logger.info('Redis Client Ready');
      if (config.maxMemory) {
        await this.client.configSet('maxmemory', config.maxMemory);
        await this.client.configSet('maxmemory-policy', 'allkeys-lru');
      }
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
      this.stats.operations.gets++;
      const value = await this.client.get(this.prefixKey(key));
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      logger.error('Cache get error', { key, error });
      throw AppError.cacheError('Failed to get value from cache');
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      this.stats.operations.sets++;
      const serialized = JSON.stringify(value);
      const prefixedKey = this.prefixKey(key);

      if (ttl) {
        await this.client.setEx(prefixedKey, ttl, serialized);
      } else if (this.defaultTtl > 0) {
        await this.client.setEx(prefixedKey, this.defaultTtl, serialized);
      } else {
        await this.client.set(prefixedKey, serialized);
      }
    } catch (error) {
      logger.error('Cache set error', { key, error });
      throw AppError.cacheError('Failed to set value in cache');
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.stats.operations.deletes++;
      await this.client.del(this.prefixKey(key));
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      throw AppError.cacheError('Failed to delete value from cache');
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      let cursor = 0;
      do {
        const { cursor: newCursor, keys } = await this.client.scan(cursor, {
          MATCH: this.prefixKey(pattern),
          COUNT: 100
        });
        cursor = newCursor;

        if (keys.length > 0) {
          this.stats.operations.deletes += keys.length;
          await this.client.del(keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      logger.error('Cache clear pattern error', { pattern, error });
      throw AppError.cacheError('Failed to clear pattern from cache');
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const value = await this.get<T>(key);
    if (value !== null) {
      return value;
    }

    const newValue = await factory();
    await this.set(key, newValue, ttl);
    return newValue;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      this.stats.operations.gets += keys.length;
      const prefixedKeys = keys.map(key => this.prefixKey(key));
      const values = await this.client.mGet(prefixedKeys);
      
      return values.map(value => {
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        } else {
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget error', { keys, error });
      throw AppError.cacheError('Failed to get multiple values from cache');
    }
  }

  async mset(items: { key: string; value: any; ttl?: number }[]): Promise<void> {
    try {
      this.stats.operations.sets += items.length;
      const pipeline = this.client.multi();

      items.forEach(({ key, value, ttl }) => {
        const prefixedKey = this.prefixKey(key);
        const serialized = JSON.stringify(value);

        if (ttl) {
          pipeline.setEx(prefixedKey, ttl, serialized);
        } else if (this.defaultTtl > 0) {
          pipeline.setEx(prefixedKey, this.defaultTtl, serialized);
        } else {
          pipeline.set(prefixedKey, serialized);
        }
      });

      await pipeline.exec();
    } catch (error) {
      logger.error('Cache mset error', { items, error });
      throw AppError.cacheError('Failed to set multiple values in cache');
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.client.info();
      const memory = info.match(/used_memory_human:(\S+)/)?.[1] || '0B';
      const uptime = parseInt(info.match(/uptime_in_seconds:(\d+)/)?.[1] || '0');
      const size = parseInt(info.match(/keys=(\d+)/)?.[1] || '0');

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
        size,
        memory,
        uptime,
        operations: { ...this.stats.operations }
      };
    } catch (error) {
      logger.error('Cache stats error', { error });
      throw AppError.cacheError('Failed to get cache stats');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushDb();
      this.resetStats();
    } catch (error) {
      logger.error('Cache clear error', { error });
      throw AppError.cacheError('Failed to clear cache');
    }
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const { cursor: newCursor, keys: batch } = await this.client.scan(cursor, {
          MATCH: this.prefixKey(pattern),
          COUNT: 100
        });
        cursor = newCursor;
        keys.push(...batch.map(key => this.unprefixKey(key)));
      } while (cursor !== 0);

      return keys;
    } catch (error) {
      logger.error('Cache keys error', { pattern, error });
      throw AppError.cacheError('Failed to get cache keys');
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(this.prefixKey(key));
    } catch (error) {
      logger.error('Cache ttl error', { key, error });
      throw AppError.cacheError('Failed to get TTL');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(this.prefixKey(key))) === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      throw AppError.cacheError('Failed to check key existence');
    }
  }

  generateKey(parts: string[]): string {
    return parts.join(':');
  }

  private prefixKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  private unprefixKey(key: string): string {
    return this.prefix ? key.replace(`${this.prefix}:`, '') : key;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0
      }
    };
  }
}