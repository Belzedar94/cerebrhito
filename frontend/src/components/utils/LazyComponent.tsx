import { Suspense, lazy, ComponentType } from 'react';
import { Loading } from '@/components/ui/Loading';

interface LazyComponentProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
}

export function LazyComponent({
  importFn,
  props = {},
  fallback = <Loading size="medium" />,
}: LazyComponentProps) {
  const Component = lazy(importFn);

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

export function createLazyComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  defaultProps = {}
) {
  return function LazyWrapper(props: Record<string, any>) {
    return (
      <LazyComponent
        importFn={importFn}
        props={{ ...defaultProps, ...props }}
      />
    );
  };
}