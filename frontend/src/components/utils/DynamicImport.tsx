import dynamic from 'next/dynamic';
import { Loading } from '@/components/ui/Loading';

interface DynamicImportProps {
  importFn: () => Promise<any>;
  fallback?: React.ReactNode;
}

export function createDynamicComponent(importFn: () => Promise<any>) {
  return dynamic(importFn, {
    loading: () => <Loading size="medium" />,
    ssr: false,
  });
}

export function DynamicImport({ importFn, fallback }: DynamicImportProps) {
  const Component = createDynamicComponent(importFn);
  return <Component fallback={fallback} />;
}