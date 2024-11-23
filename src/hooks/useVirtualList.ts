import { useState, useEffect, useCallback } from 'react';

interface UseVirtualListOptions {
  itemHeight: number;
  overscan?: number;
}

export function useVirtualList<T>(
  items: T[],
  containerHeight: number,
  options: UseVirtualListOptions
) {
  const { itemHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    totalHeight,
    onScroll,
  };
}