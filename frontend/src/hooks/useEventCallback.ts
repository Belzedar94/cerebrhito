import { useCallback, useRef, useLayoutEffect } from 'react';

export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args: Parameters<T>) => {
    const fn = ref.current;
    return fn(...args);
  }, []) as T;
}