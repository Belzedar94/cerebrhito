import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../../services/cache';
import { mockRedisClient } from '../helpers/mocks';
import { AppError } from '../../errors/types';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      defaultTtl: 3600,
      maxRetries: 3,
      retryDelay: 100,
      maxMemory: '100mb'
    });
    (cacheService as any).client = mockRedisClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('initializes the cache service', async () => {
      await cacheService.init();
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('handles initialization error', async () => {
      mockRedisClient.connect.mockRejectedValueOnce(new Error('Connection failed'));
      await expect(cacheService.init()).rejects.toThrow('Connection failed');
    });
  });

  describe('dispose', () => {
    it('disposes the cache service', async () => {
      await cacheService.dispose();
      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('gets a value from cache', async () => {
      const value = { foo: 'bar' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));
      const result = await cacheService.get('test-key');
      expect(result).toEqual(value);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('returns null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('handles get error', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Get failed'));
      await expect(cacheService.get('test-key')).rejects.toThrow(AppError);
    });
  });

  describe('set', () => {
    it('sets a value in cache with TTL', async () => {
      const value = { foo: 'bar' };
      await cacheService.set('test-key', value, 60);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        60,
        JSON.stringify(value)
      );
    });

    it('sets a value in cache with default TTL', async () => {
      const value = { foo: 'bar' };
      await cacheService.set('test-key', value);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(value)
      );
    });

    it('handles set error', async () => {
      mockRedisClient.setEx.mockRejectedValueOnce(new Error('Set failed'));
      await expect(cacheService.set('test-key', { foo: 'bar' })).rejects.toThrow(AppError);
    });
  });

  describe('del', () => {
    it('deletes a value from cache', async () => {
      await cacheService.del('test-key');
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('handles delete error', async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error('Delete failed'));
      await expect(cacheService.del('test-key')).rejects.toThrow(AppError);
    });
  });

  describe('clearPattern', () => {
    it('clears values matching pattern', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: '1', keys: ['key1', 'key2'] })
        .mockResolvedValueOnce({ cursor: '0', keys: ['key3'] });

      await cacheService.clearPattern('test-*');

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key3']);
    });

    it('handles clear pattern error', async () => {
      mockRedisClient.scan.mockRejectedValueOnce(new Error('Scan failed'));
      await expect(cacheService.clearPattern('test-*')).rejects.toThrow(AppError);
    });
  });

  describe('getOrSet', () => {
    it('returns cached value if exists', async () => {
      const value = { foo: 'bar' };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));
      const factory = vi.fn();

      const result = await cacheService.getOrSet('test-key', factory);

      expect(result).toEqual(value);
      expect(factory).not.toHaveBeenCalled();
    });

    it('sets and returns new value if not cached', async () => {
      const value = { foo: 'bar' };
      mockRedisClient.get.mockResolvedValueOnce(null);
      const factory = vi.fn().mockResolvedValueOnce(value);

      const result = await cacheService.getOrSet('test-key', factory);

      expect(result).toEqual(value);
      expect(factory).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(value)
      );
    });
  });

  describe('mget', () => {
    it('gets multiple values from cache', async () => {
      const values = ['value1', 'value2'];
      mockRedisClient.mGet.mockResolvedValueOnce(values.map(v => JSON.stringify(v)));

      const result = await cacheService.mget(['key1', 'key2']);

      expect(result).toEqual(values);
      expect(mockRedisClient.mGet).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('handles null values in batch', async () => {
      mockRedisClient.mGet.mockResolvedValueOnce([JSON.stringify('value1'), null]);

      const result = await cacheService.mget(['key1', 'key2']);

      expect(result).toEqual(['value1', null]);
    });

    it('handles mget error', async () => {
      mockRedisClient.mGet.mockRejectedValueOnce(new Error('Mget failed'));
      await expect(cacheService.mget(['key1', 'key2'])).rejects.toThrow(AppError);
    });
  });

  describe('mset', () => {
    it('sets multiple values in cache', async () => {
      const items = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2', ttl: 60 }
      ];

      await cacheService.mset(items);

      expect(mockRedisClient.pipeline).toHaveBeenCalled();
      expect(mockRedisClient.exec).toHaveBeenCalled();
    });

    it('handles mset error', async () => {
      mockRedisClient.pipeline.mockReturnValueOnce({
        setEx: vi.fn(),
        exec: vi.fn().mockRejectedValueOnce(new Error('Mset failed'))
      });

      await expect(cacheService.mset([{ key: 'key1', value: 'value1' }])).rejects.toThrow(AppError);
    });
  });

  describe('getStats', () => {
    it('returns cache stats', async () => {
      const info = `
        used_memory_human:1.00M
        uptime_in_seconds:3600
        keyspace_hits:100
        keyspace_misses:20
        used_memory:1048576
        connected_clients:1
      `;
      mockRedisClient.info.mockResolvedValueOnce(info);

      const stats = await cacheService.getStats();

      expect(stats).toEqual({
        hits: expect.any(Number),
        misses: expect.any(Number),
        hitRate: expect.any(Number),
        size: expect.any(Number),
        memory: expect.any(String),
        uptime: expect.any(Number),
        operations: {
          gets: expect.any(Number),
          sets: expect.any(Number),
          deletes: expect.any(Number)
        }
      });
    });

    it('handles stats error', async () => {
      mockRedisClient.info.mockRejectedValueOnce(new Error('Info failed'));
      await expect(cacheService.getStats()).rejects.toThrow(AppError);
    });
  });

  describe('clear', () => {
    it('clears all cache', async () => {
      await cacheService.clear();
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it('handles clear error', async () => {
      mockRedisClient.flushDb.mockRejectedValueOnce(new Error('Clear failed'));
      await expect(cacheService.clear()).rejects.toThrow(AppError);
    });
  });

  describe('exists', () => {
    it('checks if key exists', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);
      const result = await cacheService.exists('test-key');
      expect(result).toBe(true);
    });

    it('returns false for non-existent key', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);
      const result = await cacheService.exists('test-key');
      expect(result).toBe(false);
    });

    it('handles exists error', async () => {
      mockRedisClient.exists.mockRejectedValueOnce(new Error('Exists failed'));
      await expect(cacheService.exists('test-key')).rejects.toThrow(AppError);
    });
  });

  describe('ttl', () => {
    it('gets TTL for key', async () => {
      mockRedisClient.ttl.mockResolvedValueOnce(3600);
      const result = await cacheService.ttl('test-key');
      expect(result).toBe(3600);
    });

    it('handles ttl error', async () => {
      mockRedisClient.ttl.mockRejectedValueOnce(new Error('TTL failed'));
      await expect(cacheService.ttl('test-key')).rejects.toThrow(AppError);
    });
  });

  describe('keys', () => {
    it('gets keys matching pattern', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: '1', keys: ['key1', 'key2'] })
        .mockResolvedValueOnce({ cursor: '0', keys: ['key3'] });

      const result = await cacheService.keys('test-*');

      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('handles keys error', async () => {
      mockRedisClient.scan.mockRejectedValueOnce(new Error('Keys failed'));
      await expect(cacheService.keys('test-*')).rejects.toThrow(AppError);
    });
  });
});