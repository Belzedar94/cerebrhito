import {
  withRetry,
  withPartialSuccess,
  withTimeout,
  withCancellation,
  withRateLimit,
  withDebounce,
  withThrottle,
  withBatch,
  withMemo,
} from '../utils/async';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Async Utils', () => {
  describe('withRetry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;

        if (attempts < 3) {
          throw new Error('Operation failed');
        }

        return 'success';
      };

      const result = await withRetry(operation, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max attempts', async () => {
      const operation = async () => {
        throw new Error('Operation failed');
      };

      await expect(withRetry(operation, { maxAttempts: 2 })).rejects.toThrow('Operation failed');
    });

    it('should respect retry options', async () => {
      let lastDelay = 0;
      const operation = async () => {
        throw new Error('Operation failed');
      };

      const start = Date.now();

      try {
        await withRetry(operation, {
          maxAttempts: 2,
          initialDelay: 100,
          backoffFactor: 2,
          maxDelay: 1000,
        });
      } catch {
        lastDelay = Date.now() - start;
      }

      expect(lastDelay).toBeGreaterThanOrEqual(100); // At least initial delay
    });
  });

  describe('withPartialSuccess', () => {
    it('should handle mixed results', async () => {
      const promises = [
        Promise.resolve('success1'),
        Promise.reject(new Error('error1')),
        Promise.resolve('success2'),
      ];

      const result = await withPartialSuccess(promises);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toBe('success1');
      expect(result.results[1]).toBeInstanceOf(Error);
      expect(result.results[2]).toBe('success2');
    });

    it('should respect minimum success requirement', async () => {
      const promises = [
        Promise.resolve('success1'),
        Promise.reject(new Error('error1')),
        Promise.reject(new Error('error2')),
      ];

      await expect(withPartialSuccess(promises, { requireMinSuccess: 3 })).rejects.toThrow(
        'Required minimum of 3 successful operations'
      );
    });

    it('should handle timeouts', async () => {
      const promises = [
        Promise.resolve('success1'),
        new Promise(resolve => setTimeout(resolve, 200, 'success2')),
        Promise.resolve('success3'),
      ];

      const result = await withPartialSuccess(promises, { timeoutMs: 100 });

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('withTimeout', () => {
    it('should complete within timeout', async () => {
      const operation = async () => {
        await sleep(50);

        return 'success';
      };

      const result = await withTimeout(operation, 100);

      expect(result).toBe('success');
    });

    it('should fail on timeout', async () => {
      const operation = async () => {
        await sleep(200);

        return 'success';
      };

      await expect(withTimeout(operation, 100)).rejects.toThrow('Operation timed out');
    });

    it('should use custom timeout error', async () => {
      const operation = async () => {
        await sleep(200);

        return 'success';
      };

      await expect(withTimeout(operation, 100, new Error('Custom timeout'))).rejects.toThrow(
        'Custom timeout'
      );
    });
  });

  describe('withCancellation', () => {
    it('should handle cancellation', async () => {
      const operation = async (signal: AbortSignal) => {
        await sleep(100);

        if (signal.aborted) {
          throw new Error('Cancelled');
        }

        return 'success';
      };

      const { promise, cancel } = withCancellation(operation);

      setTimeout(() => cancel('User cancelled'), 50);

      await expect(promise).rejects.toThrow('Operation cancelled: User cancelled');
    });

    it('should complete if not cancelled', async () => {
      const operation = async (signal: AbortSignal) => {
        await sleep(50);

        return 'success';
      };

      const { promise } = withCancellation(operation);
      const result = await promise;

      expect(result).toBe('success');
    });
  });

  describe('withRateLimit', () => {
    it('should respect rate limit', async () => {
      const results: number[] = [];
      const start = Date.now();
      const operation = withRateLimit(
        async () => {
          const now = Date.now() - start;

          results.push(now);

          return now;
        },
        { maxCalls: 2, windowMs: 100, queueLimit: 10 }
      );

      // Execute sequentially to avoid queue timeout
      await operation();
      await sleep(50);
      await operation();
      await sleep(50);
      await operation();

      expect(results[2]).toBeGreaterThanOrEqual(100);
    });

    it('should fail when queue is full', async () => {
      const operation = withRateLimit(async () => 'success', {
        maxCalls: 1,
        windowMs: 100,
        queueLimit: 1,
      });

      // Fill the queue
      operation();
      operation();

      await expect(operation()).rejects.toThrow('Rate limit queue is full');
    });
  });

  describe('withDebounce', () => {
    it('should debounce calls', async () => {
      let callCount = 0;
      const operation = withDebounce(async () => {
        callCount++;

        return callCount;
      }, 50);

      // Make multiple calls in quick succession
      operation();
      operation();
      operation();
      await sleep(100);

      expect(callCount).toBe(1);
    });

    it('should respect maxWait option', async () => {
      let callCount = 0;
      const operation = withDebounce(
        async () => {
          callCount++;

          return callCount;
        },
        200,
        { maxWait: 100 }
      );

      // Make multiple calls in quick succession
      operation();
      await sleep(50);
      operation();
      await sleep(50);
      operation();
      await sleep(150);

      expect(callCount).toBe(2); // Initial call and one after maxWait
    });
  });

  describe('withThrottle', () => {
    it('should throttle calls', async () => {
      const results: number[] = [];
      const start = Date.now();
      const operation = withThrottle(
        async () => {
          const now = Date.now() - start;

          results.push(now);

          return now;
        },
        100,
        { trailing: false }
      );

      // Make multiple calls in quick succession
      operation();
      operation();
      operation();
      await sleep(50);

      expect(results.length).toBe(1);
    });

    it('should handle trailing option', async () => {
      const results: number[] = [];
      const operation = withThrottle(
        async () => {
          results.push(Date.now());

          return results.length;
        },
        100,
        { trailing: true }
      );

      operation();
      operation();
      operation();
      await sleep(150);

      expect(results.length).toBe(2);
    });
  });

  describe('withBatch', () => {
    jest.setTimeout(30000);
    it('should batch calls', async () => {
      const batchCalls: number[][] = [];
      const batchFn = withBatch(
        async (items: number[]) => {
          batchCalls.push(items);

          return items.map(i => i * 2);
        },
        { maxBatchSize: 3, maxWaitMs: 50 }
      );

      const results = [];
      const p1 = batchFn(1);
      const p2 = batchFn(2);
      const p3 = batchFn(3);
      const p4 = batchFn(4);

      results.push(await p1);
      results.push(await p2);
      results.push(await p3);
      results.push(await p4);

      expect(results).toEqual([2, 4, 6, 8]);
      expect(batchCalls.length).toBe(2);
      expect(batchCalls[0].length).toBe(3);
    });

    it('should process batch on timeout', async () => {
      const batchCalls: number[][] = [];
      const batchFn = withBatch(
        async (items: number[]) => {
          batchCalls.push(items);

          return items.map(i => i * 2);
        },
        { maxBatchSize: 10, maxWaitMs: 50 }
      );

      batchFn(1);
      batchFn(2);
      await sleep(100);

      expect(batchCalls.length).toBe(1);
      expect(batchCalls[0]).toEqual([1, 2]);
    });
  });

  describe('withMemo', () => {
    it('should memoize results', async () => {
      let computeCount = 0;
      const operation = withMemo(
        async (n: number) => {
          computeCount++;

          return n * 2;
        },
        { ttlMs: 100 }
      );

      // Make same call multiple times
      await operation(5);
      await operation(5);
      await operation(5);

      expect(computeCount).toBe(1);
    });

    it('should expire cache', async () => {
      let computeCount = 0;
      const operation = withMemo(
        async (n: number) => {
          computeCount++;

          return n * 2;
        },
        { ttlMs: 50 }
      );

      // Make same call with delay
      await operation(5);
      await sleep(100);
      await operation(5);

      expect(computeCount).toBe(2);
    });

    it('should respect maxSize option', async () => {
      let computeCount = 0;
      const operation = withMemo(
        async (n: number) => {
          computeCount++;

          return n * 2;
        },
        { maxSize: 2 }
      );

      // Fill cache beyond maxSize
      await operation(1);
      await operation(2);
      await operation(3);
      await operation(1); // Should recompute

      expect(computeCount).toBe(4);
    });

    it('should use custom key function', async () => {
      let computeCount = 0;
      const operation = withMemo(
        async (obj: { id: number; data: any }) => {
          computeCount++;

          return obj.id * 2;
        },
        {
          keyFn: obj => String(obj.id),
        }
      );

      // Same id but different data should use cache
      await operation({ id: 1, data: 'a' });
      await operation({ id: 1, data: 'b' });

      expect(computeCount).toBe(1);
    });
  });
});
