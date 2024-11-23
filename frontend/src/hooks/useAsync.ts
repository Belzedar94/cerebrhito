import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/useError';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface AsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: AsyncOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { toast } = useToast();
  const { handleError } = useError();

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let attempts = 0;
    const maxAttempts = options.retryCount ?? 3;
    const delay = options.retryDelay ?? 1000;
    const timeout = options.timeout ?? 10000;

    const executeWithTimeout = async (): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      );

      return Promise.race([asyncFn(), timeoutPromise]);
    };

    while (attempts < maxAttempts) {
      try {
        const data = await executeWithTimeout();

        setState({ data, loading: false, error: null });
        options.onSuccess?.(data);

        return data;
      } catch (error) {
        attempts++;
        const isLastAttempt = attempts === maxAttempts;

        if (isLastAttempt) {
          const finalError =
            error instanceof Error ? error : new Error(String(error));

          setState({ data: null, loading: false, error: finalError });
          handleError(finalError);
          options.onError?.(finalError);

          return null;
        } else {
          // Show retry toast
          toast({
            title: 'Operation failed',
            description: `Retrying in ${delay / 1000} seconds... (${attempts}/${maxAttempts})`,
            variant: 'destructive',
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }, [asyncFn, options, toast, handleError]);

  return {
    ...state,
    execute,
    reset: () => setState({ data: null, loading: false, error: null }),
  };
}

interface AsyncBatchState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  progress: number;
}

interface AsyncBatchOptions<T> extends AsyncOptions<T[]> {
  batchSize?: number;
  concurrency?: number;
}

export function useAsyncBatch<T>(
  asyncFn: (item: any) => Promise<T>,
  items: any[],
  options: AsyncBatchOptions<T> = {}
) {
  const [state, setState] = useState<AsyncBatchState<T>>({
    data: [],
    loading: false,
    error: null,
    progress: 0,
  });

  const { toast } = useToast();
  const { handleError } = useError();

  const execute = useCallback(async () => {
    if (!items.length) {
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      progress: 0,
    }));

    const batchSize = options.batchSize ?? 10;
    const concurrency = options.concurrency ?? 3;
    const results: T[] = [];
    let completed = 0;

    try {
      // Split items into batches
      const batches = Array.from(
        { length: Math.ceil(items.length / batchSize) },
        (_, i) => items.slice(i * batchSize, (i + 1) * batchSize)
      );

      // Process batches with concurrency limit
      for (let i = 0; i < batches.length; i += concurrency) {
        const batchPromises = batches
          .slice(i, i + concurrency)
          .map(async batch => {
            const batchResults = await Promise.all(
              batch.map(item => asyncFn(item))
            );

            completed += batch.length;
            setState(prev => ({
              ...prev,
              progress: (completed / items.length) * 100,
            }));

            return batchResults;
          });

        const batchResults = await Promise.all(batchPromises);

        results.push(...batchResults.flat());
      }

      setState({
        data: results,
        loading: false,
        error: null,
        progress: 100,
      });

      options.onSuccess?.(results);

      return results;
    } catch (error) {
      const finalError =
        error instanceof Error ? error : new Error(String(error));

      setState({
        data: results,
        loading: false,
        error: finalError,
        progress: (completed / items.length) * 100,
      });
      handleError(finalError);
      options.onError?.(finalError);

      return null;
    }
  }, [asyncFn, items, options, toast, handleError]);

  return {
    ...state,
    execute,
    reset: () =>
      setState({ data: [], loading: false, error: null, progress: 0 }),
  };
}

interface AsyncQueueState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  pending: number;
  completed: number;
}

interface AsyncQueueOptions<T> extends AsyncOptions<T[]> {
  concurrency?: number;
  retryFailedItems?: boolean;
}

export function useAsyncQueue<T>(
  asyncFn: (item: any) => Promise<T>,
  options: AsyncQueueOptions<T> = {}
) {
  const [state, setState] = useState<AsyncQueueState<T>>({
    data: [],
    loading: false,
    error: null,
    pending: 0,
    completed: 0,
  });

  const [queue, setQueue] = useState<any[]>([]);
  const { handleError } = useError();

  const add = useCallback((items: any | any[]) => {
    const newItems = Array.isArray(items) ? items : [items];

    setQueue(prev => [...prev, ...newItems]);
    setState(prev => ({ ...prev, pending: prev.pending + newItems.length }));
  }, []);

  const execute = useCallback(async () => {
    if (!queue.length || state.loading) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const concurrency = options.concurrency ?? 3;
    const results: T[] = [];
    const failedItems: any[] = [];

    try {
      // Process queue with concurrency limit
      while (queue.length > 0) {
        const batch = queue.splice(0, concurrency);
        const batchPromises = batch.map(async item => {
          try {
            const result = await asyncFn(item);

            setState(prev => ({
              ...prev,
              completed: prev.completed + 1,
              pending: prev.pending - 1,
            }));

            return result;
          } catch (error) {
            if (options.retryFailedItems) {
              failedItems.push(item);
            }

            setState(prev => ({
              ...prev,
              pending: prev.pending - 1,
            }));
            throw error;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        results.push(
          ...batchResults
            .filter(
              (r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled'
            )
            .map(r => r.value)
        );
      }

      // Retry failed items
      if (options.retryFailedItems && failedItems.length > 0) {
        add(failedItems);
      }

      setState(prev => ({
        ...prev,
        data: [...prev.data, ...results],
        loading: false,
        error: null,
      }));

      options.onSuccess?.(results);

      return results;
    } catch (error) {
      const finalError =
        error instanceof Error ? error : new Error(String(error));

      setState(prev => ({
        ...prev,
        loading: false,
        error: finalError,
      }));
      handleError(finalError);
      options.onError?.(finalError);

      return null;
    }
  }, [queue, state.loading, options, add, asyncFn, handleError]);

  return {
    ...state,
    queue,
    add,
    execute,
    reset: () => {
      setQueue([]);
      setState({
        data: [],
        loading: false,
        error: null,
        pending: 0,
        completed: 0,
      });
    },
  };
}
