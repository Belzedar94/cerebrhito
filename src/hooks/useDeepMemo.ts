import { useRef } from 'react';
import isEqual from 'lodash/isEqual';

export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  
  return ref.current;
}