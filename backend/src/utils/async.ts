import { logger } from './logger';
import { AppError } from '../errors/types';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: (new (...args: any[]) => Error)[];
}

/**
 * Default retry options
 */
const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [Error, TypeError, ReferenceError, AppError],
};

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt - 1);

  return Math.min(delay, options.maxDelay);
}

/**
 * Check if an error is retryable based on options
 */
function isRetryableError(error: Error, options: Required<RetryOptions>): boolean {
  return options.retryableErrors.some(errorType => error instanceof errorType);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retryOptions = { ...defaultRetryOptions, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(lastError, retryOptions) || attempt === retryOptions.maxAttempts) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, retryOptions);

      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        delay,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Execute multiple promises and handle partial failures
 */
export async function withPartialSuccess<T>(
  promises: Promise<T>[],
  options: {
    requireMinSuccess?: number;
    timeoutMs?: number;
  } = {}
): Promise<{
  results: (T | Error)[];
  successful: number;
  failed: number;
}> {
  const { requireMinSuccess = 0, timeoutMs } = options;

  // Add timeout if specified
  const timeoutPromise = timeoutMs
    ? new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    : null;

  // Execute promises with Promise.allSettled
  const results = await Promise.allSettled(
    timeoutPromise ? promises.map(p => Promise.race([p, timeoutPromise])) : promises
  );

  // Process results
  const processedResults = results.map(result =>
    result.status === 'fulfilled' ? result.value : result.reason
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - successful;

  // Check minimum success requirement
  if (requireMinSuccess > 0 && successful < requireMinSuccess) {
    throw new Error(
      `Required minimum of ${requireMinSuccess} successful operations, but only got ${successful}`
    );
  }

  return { results: processedResults, successful, failed };
}

/**
 * Execute a function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError = new Error('Operation timed out')
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(timeoutError), timeoutMs)
  );

  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Execute a function with cancellation support
 */
export function withCancellation<T>(fn: (signal: AbortSignal) => Promise<T>): {
  promise: Promise<T>;
  cancel: (reason?: string) => void;
} {
  const controller = new AbortController();
  const { signal } = controller;

  const promise = fn(signal).catch(error => {
    if (signal.aborted) {
      throw new Error(`Operation cancelled: ${signal.reason || error.message}`);
    }

    throw error;
  });

  return {
    promise,
    cancel: (reason?: string) => controller.abort(reason),
  };
}

/**
 * Execute a function with rate limiting
 */
export function withRateLimit<T>(
  fn: () => Promise<T>,
  options: {
    maxCalls: number;
    windowMs: number;
    queueLimit?: number;
  }
): () => Promise<T> {
  const { maxCalls, windowMs, queueLimit = maxCalls * 2 } = options;
  const queue: Array<() => void> = [];
  const timestamps: number[] = [];

  return async () => {
    // Check queue limit
    if (queue.length >= queueLimit) {
      throw new Error('Rate limit queue is full');
    }

    // Remove old timestamps
    const now = Date.now();

    while (timestamps[0] && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }

    // Check rate limit
    if (timestamps.length >= maxCalls) {
      // Wait for next available slot
      const oldestTimestamp = timestamps[0];
      const waitTime = oldestTimestamp + windowMs - now;

      await new Promise<void>((resolve, reject) => {
        const queueItem = () => {
          timestamps.shift();
          resolve();
        };

        if (waitTime <= 0) {
          queueItem();
        } else {
          queue.push(queueItem);
          setTimeout(() => {
            const index = queue.indexOf(queueItem);

            if (index !== -1) {
              queue.splice(index, 1);
              reject(new Error('Rate limit queue timeout'));
            }
          }, waitTime + 1000); // Add 1s buffer
        }
      });
    }

    // Execute function
    timestamps.push(now);

    return fn();
  };
}

/**
 * Execute a function with debouncing
 */
export function withDebounce<T>(
  fn: () => Promise<T>,
  waitMs: number,
  options: {
    maxWait?: number;
    leading?: boolean;
  } = {}
): () => Promise<T> {
  const { maxWait, leading = false } = options;
  let timeout: NodeJS.Timeout | null = null;
  let maxWaitTimeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let pendingPromise: Promise<T> | null = null;

  return async () => {
    const now = Date.now();
    const isFirstCall = !lastCallTime;

    lastCallTime = now;

    // Return pending promise if it exists
    if (pendingPromise) {
      return pendingPromise;
    }

    // Create new promise
    pendingPromise = new Promise<T>((resolve, reject) => {
      const execute = () => {
        timeout = null;
        maxWaitTimeout = null;
        lastCallTime = 0;
        const promise = fn();

        pendingPromise = null;

        return promise;
      };

      // Clear existing timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Execute immediately if leading and first call
      if (leading && isFirstCall) {
        resolve(execute());

        return;
      }

      // Set new timeout
      timeout = setTimeout(() => {
        resolve(execute());
      }, waitMs);

      // Set max wait timeout if specified
      if (maxWait && !maxWaitTimeout) {
        maxWaitTimeout = setTimeout(() => {
          if (timeout) {
            clearTimeout(timeout);
            resolve(execute());
          }
        }, maxWait);
      }
    });

    return pendingPromise;
  };
}

/**
 * Execute a function with throttling
 */
export function withThrottle<T>(
  fn: () => Promise<T>,
  waitMs: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): () => Promise<T> {
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let lastResult: T;
  let timeout: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<T> | null = null;

  return async () => {
    const now = Date.now();

    // Return pending promise if it exists
    if (pendingPromise) {
      return pendingPromise;
    }

    // If this is the first call, or enough time has passed
    if (!lastCallTime || now - lastCallTime >= waitMs) {
      lastCallTime = now;
      const result = await fn();

      lastResult = result;

      return result;
    }

    // If leading is false and this is not the first call
    if (!leading && lastResult !== undefined) {
      return lastResult;
    }

    // If trailing is true, schedule a call
    if (trailing) {
      if (timeout) {
        clearTimeout(timeout);
      }

      pendingPromise = new Promise<T>((resolve, reject) => {
        timeout = setTimeout(
          async () => {
            try {
              const result = await fn();

              lastCallTime = Date.now();
              lastResult = result;
              pendingPromise = null;
              resolve(result);
            } catch (error) {
              pendingPromise = null;
              reject(error);
            }
          },
          waitMs - (now - lastCallTime)
        );
      });

      return pendingPromise;
    }

    // If neither leading nor trailing, return last result
    return lastResult;
  };
}

/**
 * Batch multiple calls into a single request
 */
export function withBatch<T, R>(
  fn: (items: T[]) => Promise<R[]>,
  options: {
    maxBatchSize?: number;
    maxWaitMs?: number;
  } = {}
): (item: T) => Promise<R> {
  const { maxBatchSize = 10, maxWaitMs = 100 } = options;
  let batch: T[] = [];
  let currentPromise: Promise<R[]> | null = null;
  let timeout: NodeJS.Timeout | null = null;
  let itemPromises: Map<number, { resolve: (value: R) => void; reject: (error: Error) => void }> =
    new Map();

  const processBatch = async () => {
    if (batch.length === 0) {
      return;
    }

    const items = batch.slice();
    const promises = Array.from(itemPromises.entries());

    batch = [];
    timeout = null;
    currentPromise = null;
    itemPromises = new Map();

    try {
      const results = await fn(items);

      promises.forEach(([index, { resolve }]) => {
        resolve(results[index]);
      });
    } catch (error) {
      promises.forEach(([_, { reject }]) => {
        reject(error as Error);
      });
    }
  };

  return async (item: T) => {
    const itemIndex = batch.length;

    batch.push(item);

    const promise = new Promise<R>((resolve, reject) => {
      itemPromises.set(itemIndex, { resolve, reject });
    });

    if (batch.length >= maxBatchSize) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      processBatch();
    } else if (!timeout) {
      timeout = setTimeout(processBatch, maxWaitMs);
    }

    return promise;
  };
}

/**
 * Execute a function with memoization
 */
export function withMemo<T, R>(
  fn: (arg: T) => Promise<R>,
  options: {
    maxSize?: number;
    ttlMs?: number;
    keyFn?: (arg: T) => string;
  } = {}
): (arg: T) => Promise<R> {
  const { maxSize = 100, ttlMs, keyFn = (arg: T) => JSON.stringify(arg) } = options;

  const cache = new Map<string, { value: R; timestamp: number; promise: Promise<R> }>();

  return async (arg: T) => {
    const key = keyFn(arg);
    const now = Date.now();
    const cached = cache.get(key);

    // Return cached value if valid
    if (cached && (!ttlMs || now - cached.timestamp < ttlMs)) {
      return cached.value;
    }

    // Clear expired entries
    if (ttlMs) {
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp >= ttlMs) {
          cache.delete(k);
        }
      }
    }

    // Clear oldest entries if cache is full
    if (cache.size >= maxSize) {
      const oldest = Array.from(cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0];

      if (oldest) {
        cache.delete(oldest[0]);
      }
    }

    // Execute function and cache result
    const promise = fn(arg);
    const entry = {
      value: await promise,
      timestamp: now,
      promise,
    };

    cache.set(key, entry);

    return entry.value;
  };
}
