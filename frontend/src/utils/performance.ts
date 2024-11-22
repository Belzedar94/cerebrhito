import { memo } from 'react';
import isEqual from 'lodash/isEqual';

export function memoWithDeepEqual<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual = isEqual
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, propsAreEqual);
}

export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout;
  let currentPromise: Promise<any> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (currentPromise) {
      return currentPromise;
    }

    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        currentPromise = fn(...args)
          .then((result) => {
            currentPromise = null;
            resolve(result);
            return result;
          })
          .catch((error) => {
            currentPromise = null;
            reject(error);
            throw error;
          });
      }, wait);
    });
  };
}

export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`${name} took ${end - start}ms`);
      }) as ReturnType<T>;
    }

    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  }) as T;
}

export function createChunkIterator<T>(
  array: T[],
  chunkSize: number
): Generator<T[], void> {
  return function* () {
    for (let i = 0; i < array.length; i += chunkSize) {
      yield array.slice(i, i + chunkSize);
    }
  }();
}

export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>,
  onChunkProcessed?: (results: R[]) => void
): Promise<R[]> {
  const results: R[] = [];
  const iterator = createChunkIterator(items, chunkSize);

  for (const chunk of iterator) {
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
    onChunkProcessed?.(chunkResults);
  }

  return results;
}