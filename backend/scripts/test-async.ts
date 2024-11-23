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
} from '../src/utils/async';

// Helper functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createFailingFunction = (
  failCount: number,
  errorType: new (...args: any[]) => Error = Error
) => {
  let attempts = 0;

  return async () => {
    attempts++;

    if (attempts <= failCount) {
      throw new errorType('Operation failed');
    }

    return 'success';
  };
};

interface TestCase<T = any> {
  name: string;
  fn: () => Promise<T>;
  expected?: T;
  expectedError?: string;
  shouldPass: boolean;
}

// Test cases
const testCases: Record<string, TestCase[]> = {
  // Retry tests
  retry: [
    {
      name: 'Should succeed after retries',
      fn: () => {
        const operation = createFailingFunction(2);

        return withRetry(operation, { maxAttempts: 3 });
      },
      expected: 'success',
      shouldPass: true,
    },
    {
      name: 'Should fail after max attempts',
      fn: () => {
        const operation = createFailingFunction(3);

        return withRetry(operation, { maxAttempts: 2 });
      },
      expectedError: 'Operation failed',
      shouldPass: false,
    },
  ],

  // Partial success tests
  partialSuccess: [
    {
      name: 'Should handle mixed results',
      fn: async () => {
        const { successful, failed } = await withPartialSuccess([
          Promise.resolve('success1'),
          Promise.reject(new Error('error1')),
          Promise.resolve('success2'),
        ]);

        return { successful, failed };
      },
      expected: {
        successful: 2,
        failed: 1,
      },
      shouldPass: true,
    },
    {
      name: 'Should fail with minimum success requirement',
      fn: async () => {
        const promises = [
          Promise.resolve('success1'),
          Promise.reject(new Error('error1')),
          Promise.reject(new Error('error2')),
        ];

        return withPartialSuccess(promises, { requireMinSuccess: 3 });
      },
      expectedError: 'Required minimum of 3 successful operations',
      shouldPass: false,
    },
  ],

  // Timeout tests
  timeout: [
    {
      name: 'Should complete within timeout',
      fn: async () => {
        const operation = async () => {
          await sleep(50);

          return 'success';
        };

        return withTimeout(operation, 100);
      },
      expected: 'success',
      shouldPass: true,
    },
    {
      name: 'Should fail on timeout',
      fn: async () => {
        const operation = async () => {
          await sleep(200);

          return 'success';
        };

        return withTimeout(operation, 100);
      },
      expectedError: 'Operation timed out',
      shouldPass: false,
    },
  ],

  // Cancellation tests
  cancellation: [
    {
      name: 'Should handle cancellation',
      fn: async () => {
        const operation = async (signal: AbortSignal) => {
          await sleep(100);

          if (signal.aborted) {
            throw new Error('Cancelled');
          }

          return 'success';
        };
        const { promise, cancel } = withCancellation(operation);

        setTimeout(() => cancel('User cancelled'), 50);

        return promise;
      },
      expectedError: 'Operation cancelled: User cancelled',
      shouldPass: false,
    },
  ],

  // Rate limit tests
  rateLimit: [
    {
      name: 'Should respect rate limit',
      fn: async () => {
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
        await sleep(50);

        return results[2] >= 100; // Third call should be delayed
      },
      expected: true,
      shouldPass: true,
    },
  ],

  // Debounce tests
  debounce: [
    {
      name: 'Should debounce calls',
      fn: async () => {
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

        return callCount;
      },
      expected: 1,
      shouldPass: true,
    },
  ],

  // Throttle tests
  throttle: [
    {
      name: 'Should throttle calls',
      fn: async () => {
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

        return results.length === 1; // Only first call should execute immediately
      },
      expected: true,
      shouldPass: true,
    },
  ],

  // Batch tests
  batch: [
    {
      name: 'Should batch calls',
      fn: async () => {
        const batchCalls: number[][] = [];
        const batchFn = withBatch(
          async (items: number[]) => {
            batchCalls.push(items);

            return items.map(i => i * 2);
          },
          { maxBatchSize: 3, maxWaitMs: 50 }
        );

        const results = await Promise.all([batchFn(1), batchFn(2), batchFn(3), batchFn(4)]);

        return {
          results,
          batchCalls: batchCalls.length,
          firstBatchSize: batchCalls[0].length,
        };
      },
      expected: {
        results: [2, 4, 6, 8],
        batchCalls: 2,
        firstBatchSize: 3,
      },
      shouldPass: true,
    },
  ],

  // Memo tests
  memo: [
    {
      name: 'Should memoize results',
      fn: async () => {
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

        return computeCount;
      },
      expected: 1,
      shouldPass: true,
    },
    {
      name: 'Should expire cache',
      fn: async () => {
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

        return computeCount;
      },
      expected: 2,
      shouldPass: true,
    },
  ],
};

// Test runner
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    details: [] as any[],
  };

  for (const [category, cases] of Object.entries(testCases)) {
    console.log(`\nTesting ${category}:`);
    console.log('='.repeat(50));

    for (const testCase of cases) {
      try {
        const result = await testCase.fn();

        if (testCase.shouldPass) {
          const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

          if (passed) {
            console.log(`✅ PASS: ${testCase.name}`);
            results.passed++;
          } else {
            console.log(`❌ FAIL: ${testCase.name}`);
            console.log('Expected:', testCase.expected);
            console.log('Received:', result);
            results.failed++;
          }
        } else {
          console.log(`❌ FAIL: ${testCase.name} (Expected to fail but passed)`);
          results.failed++;
        }

        results.details.push({
          category,
          name: testCase.name,
          result: testCase.shouldPass ? 'pass' : 'unexpected pass',
          expected: testCase.expected,
          received: result,
        });
      } catch (error) {
        if (!testCase.shouldPass) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const { expectedError } = testCase;
          const passed = expectedError ? errorMessage.includes(expectedError) : true;

          if (passed) {
            console.log(`✅ PASS: ${testCase.name} (Failed as expected)`);
            results.passed++;
          } else {
            console.log(`❌ FAIL: ${testCase.name}`);
            console.log('Expected error:', expectedError);
            console.log('Received error:', errorMessage);
            results.failed++;
          }
        } else {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log('Error:', error instanceof Error ? error.message : error);
          results.failed++;
        }

        results.details.push({
          category,
          name: testCase.name,
          result: testCase.shouldPass ? 'fail' : 'expected fail',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  console.log('\nTest Summary:');
  console.log('='.repeat(50));
  console.log(`Total tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  return results;
}

// Run tests
runTests().catch(console.error);
