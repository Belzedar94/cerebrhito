import { useState, useEffect, useCallback, useRef } from 'react';
import throttle from 'lodash/throttle';

interface UseVirtualListOptions {
  itemHeight: number;
  overscan?: number;
}

interface UseVirtualListResult<T> {
  virtualItems: Array<{ index: number; item: T }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useVirtualList<T>(
  items: T[],
  { itemHeight, overscan = 3 }: UseVirtualListOptions
): UseVirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  const calculateRange = useCallback(
    throttle(() => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, clientHeight } = container;
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        Math.ceil((scrollTop + clientHeight) / itemHeight),
        items.length
      );

      setVisibleRange({
        start: Math.max(0, start - overscan),
        end: Math.min(items.length, end + overscan),
      });
    }, 100),
    [itemHeight, items.length, overscan]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    calculateRange();
    container.addEventListener('scroll', calculateRange);
    window.addEventListener('resize', calculateRange);

    return () => {
      container.removeEventListener('scroll', calculateRange);
      window.removeEventListener('resize', calculateRange);
    };
  }, [calculateRange]);

  const virtualItems = items
    .slice(visibleRange.start, visibleRange.end)
    .map((item, index) => ({
      index: index + visibleRange.start,
      item,
    }));

  const totalHeight = items.length * itemHeight;

  return {
    virtualItems,
    totalHeight,
    containerRef,
  };
}