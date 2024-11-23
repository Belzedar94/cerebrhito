import dynamic from 'next/dynamic';
import { Loading } from '@/components/common/Loading';

export function withDynamicImport<T>(importFn: () => Promise<{ default: T }>) {
  return dynamic(importFn, {
    loading: () => <Loading />,
    ssr: false,
  });
}