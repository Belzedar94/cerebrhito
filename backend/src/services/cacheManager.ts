import type { CacheService } from './cache';
import { logger } from '../utils/logger';
import { AppError } from '../errors/types';

interface CacheDependency {
  key: string;
  pattern?: string;
  ttl?: number;
  dependencies?: string[];
}

interface CacheInvalidationRule {
  key: string;
  pattern?: string;
  invalidateOn: ('create' | 'update' | 'delete')[];
  dependencies?: string[];
}

export class CacheManager {
  private dependencies: Map<string, CacheDependency>;
  private invalidationRules: Map<string, CacheInvalidationRule[]>;
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
    this.dependencies = new Map();
    this.invalidationRules = new Map();

    // Initialize default dependencies and rules
    this.initializeDependencies();
    this.initializeInvalidationRules();
  }

  /**
   * Initialize cache dependencies
   */
  private initializeDependencies() {
    // User dependencies
    this.addDependency({
      key: 'user',
      pattern: 'user:*',
      ttl: 3600, // 1 hour
      dependencies: ['child', 'notification'],
    });

    // Child dependencies
    this.addDependency({
      key: 'child',
      pattern: 'child:*',
      ttl: 3600, // 1 hour
      dependencies: ['activity_log', 'milestone_tracking', 'media'],
    });

    // Activity dependencies
    this.addDependency({
      key: 'activity',
      pattern: 'activity:*',
      ttl: 21600, // 6 hours
      dependencies: ['activity_log'],
    });

    // Milestone dependencies
    this.addDependency({
      key: 'milestone',
      pattern: 'milestone:*',
      ttl: 21600, // 6 hours
      dependencies: ['milestone_tracking'],
    });

    // Activity log dependencies
    this.addDependency({
      key: 'activity_log',
      pattern: 'activity_log:*',
      ttl: 900, // 15 minutes
    });

    // Milestone tracking dependencies
    this.addDependency({
      key: 'milestone_tracking',
      pattern: 'milestone_tracking:*',
      ttl: 900, // 15 minutes
    });

    // Media dependencies
    this.addDependency({
      key: 'media',
      pattern: 'media:*',
      ttl: 86400, // 24 hours
    });

    // AI chat dependencies
    this.addDependency({
      key: 'ai_chat',
      pattern: 'ai_chat:*',
      ttl: 86400, // 24 hours
    });

    // Notification dependencies
    this.addDependency({
      key: 'notification',
      pattern: 'notification:*',
      ttl: 300, // 5 minutes
    });
  }

  /**
   * Initialize cache invalidation rules
   */
  private initializeInvalidationRules() {
    // User invalidation rules
    this.addInvalidationRule('user', {
      key: 'user',
      pattern: 'user:*',
      invalidateOn: ['update', 'delete'],
      dependencies: ['child', 'notification'],
    });

    // Child invalidation rules
    this.addInvalidationRule('child', {
      key: 'child',
      pattern: 'child:*',
      invalidateOn: ['create', 'update', 'delete'],
      dependencies: ['activity_log', 'milestone_tracking', 'media'],
    });

    // Activity invalidation rules
    this.addInvalidationRule('activity', {
      key: 'activity',
      pattern: 'activity:*',
      invalidateOn: ['create', 'update', 'delete'],
      dependencies: ['activity_log'],
    });

    // Milestone invalidation rules
    this.addInvalidationRule('milestone', {
      key: 'milestone',
      pattern: 'milestone:*',
      invalidateOn: ['create', 'update', 'delete'],
      dependencies: ['milestone_tracking'],
    });

    // Activity log invalidation rules
    this.addInvalidationRule('activity_log', {
      key: 'activity_log',
      pattern: 'activity_log:*',
      invalidateOn: ['create', 'update', 'delete'],
    });

    // Milestone tracking invalidation rules
    this.addInvalidationRule('milestone_tracking', {
      key: 'milestone_tracking',
      pattern: 'milestone_tracking:*',
      invalidateOn: ['create', 'update', 'delete'],
    });

    // Media invalidation rules
    this.addInvalidationRule('media', {
      key: 'media',
      pattern: 'media:*',
      invalidateOn: ['create', 'update', 'delete'],
    });

    // AI chat invalidation rules
    this.addInvalidationRule('ai_chat', {
      key: 'ai_chat',
      pattern: 'ai_chat:*',
      invalidateOn: ['create'],
    });

    // Notification invalidation rules
    this.addInvalidationRule('notification', {
      key: 'notification',
      pattern: 'notification:*',
      invalidateOn: ['create', 'update', 'delete'],
    });
  }

  /**
   * Add a cache dependency
   */
  addDependency(dependency: CacheDependency) {
    this.dependencies.set(dependency.key, dependency);
  }

  /**
   * Add a cache invalidation rule
   */
  addInvalidationRule(key: string, rule: CacheInvalidationRule) {
    const rules = this.invalidationRules.get(key) || [];

    rules.push(rule);
    this.invalidationRules.set(key, rules);
  }

  /**
   * Get a value from cache with dependencies
   */
  async get<T>(key: string, type: string): Promise<T | null> {
    try {
      const dependency = this.dependencies.get(type);

      if (!dependency) {
        throw new Error(`No dependency found for type: ${type}`);
      }

      return await this.cache.get<T>(key);
    } catch (error) {
      logger.error('Cache manager get error', { key, type, error });
      throw AppError.cacheError('Failed to get value from cache');
    }
  }

  /**
   * Set a value in cache with dependencies
   */
  async set<T>(key: string, value: T, type: string): Promise<void> {
    try {
      const dependency = this.dependencies.get(type);

      if (!dependency) {
        throw new Error(`No dependency found for type: ${type}`);
      }

      await this.cache.set(key, value, dependency.ttl);
    } catch (error) {
      logger.error('Cache manager set error', { key, type, error });
      throw AppError.cacheError('Failed to set value in cache');
    }
  }

  /**
   * Invalidate cache based on type and operation
   */
  async invalidate(type: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const rules = this.invalidationRules.get(type) || [];
      const invalidationPromises: Promise<void>[] = [];

      for (const rule of rules) {
        if (rule.invalidateOn.includes(operation)) {
          // Invalidate the main pattern
          if (rule.pattern) {
            invalidationPromises.push(this.cache.clearPattern(rule.pattern));
          }

          // Invalidate dependencies
          if (rule.dependencies) {
            for (const depType of rule.dependencies) {
              const depRule = this.dependencies.get(depType);

              if (depRule?.pattern) {
                invalidationPromises.push(this.cache.clearPattern(depRule.pattern));
              }
            }
          }
        }
      }

      await Promise.all(invalidationPromises);
    } catch (error) {
      logger.error('Cache manager invalidate error', { type, operation, error });
      throw AppError.cacheError('Failed to invalidate cache');
    }
  }

  /**
   * Get or set a value in cache with dependencies
   */
  async getOrSet<T>(key: string, type: string, factory: () => Promise<T>): Promise<T> {
    try {
      const dependency = this.dependencies.get(type);

      if (!dependency) {
        throw new Error(`No dependency found for type: ${type}`);
      }

      return await this.cache.getOrSet(key, factory, dependency.ttl);
    } catch (error) {
      logger.error('Cache manager getOrSet error', { key, type, error });
      throw AppError.cacheError('Failed to get or set value in cache');
    }
  }

  /**
   * Get multiple values from cache with dependencies
   */
  async mget<T>(keys: string[], type: string): Promise<(T | null)[]> {
    try {
      const dependency = this.dependencies.get(type);

      if (!dependency) {
        throw new Error(`No dependency found for type: ${type}`);
      }

      return await this.cache.mget<T>(keys);
    } catch (error) {
      logger.error('Cache manager mget error', { keys, type, error });
      throw AppError.cacheError('Failed to get multiple values from cache');
    }
  }

  /**
   * Set multiple values in cache with dependencies
   */
  async mset(items: { key: string; value: any }[], type: string): Promise<void> {
    try {
      const dependency = this.dependencies.get(type);

      if (!dependency) {
        throw new Error(`No dependency found for type: ${type}`);
      }

      await this.cache.mset(
        items.map(item => ({
          ...item,
          ttl: dependency.ttl,
        }))
      );
    } catch (error) {
      logger.error('Cache manager mset error', { items, type, error });
      throw AppError.cacheError('Failed to set multiple values in cache');
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (error) {
      logger.error('Cache manager clear error', { error });
      throw AppError.cacheError('Failed to clear cache');
    }
  }

  /**
   * Get cache stats
   */
  async getStats() {
    try {
      return await this.cache.getStats();
    } catch (error) {
      logger.error('Cache manager stats error', { error });
      throw AppError.cacheError('Failed to get cache stats');
    }
  }
}
