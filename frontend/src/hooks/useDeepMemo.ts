import { useRef, useMemo, DependencyList } from 'react';
import isEqual from 'lodash/isEqual';

export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T }>();

  return useMemo(() => {
    if (!ref.current || !isEqual(deps, ref.current.deps)) {
      ref.current = { deps, value: factory() };
    }

    return ref.current.value;
  }, [factory, deps]);