'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAsync, useAsyncBatch, useAsyncQueue } from '@/hooks/useAsync';

// Simulated API calls
const simulateApiCall = (delay: number = 1000) =>
  new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.7) {
        reject(new Error('Random API error'));
      } else {
        resolve('API call successful');
      }
    }, delay);
  });

const simulateBatchApiCall = (item: number) =>
  new Promise<string>((resolve, reject) => {
    setTimeout(
      () => {
        if (Math.random() > 0.9) {
          reject(new Error(`Failed to process item ${item}`));
        } else {
          resolve(`Processed item ${item}`);
        }
      },
      500 + Math.random() * 1000
    );
  });

export function AsyncExample() {
  const [items] = useState(() => Array.from({ length: 20 }, (_, i) => i + 1));

  // Single async operation
  const {
    data: singleData,
    loading: singleLoading,
    error: singleError,
    execute: executeSingle,
  } = useAsync(() => simulateApiCall(), {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 5000,
    onSuccess: data => console.log('Single operation succeeded:', data),
    onError: error => console.error('Single operation failed:', error),
  });

  // Batch async operations
  const {
    data: batchData,
    loading: batchLoading,
    error: batchError,
    progress: batchProgress,
    execute: executeBatch,
  } = useAsyncBatch(simulateBatchApiCall, items, {
    batchSize: 5,
    concurrency: 2,
    onSuccess: data => console.log('Batch operation succeeded:', data),
    onError: error => console.error('Batch operation failed:', error),
  });

  // Queue async operations
  const {
    data: queueData,
    loading: queueLoading,
    error: queueError,
    pending: queuePending,
    completed: queueCompleted,
    add: addToQueue,
    execute: executeQueue,
  } = useAsyncQueue(simulateBatchApiCall, {
    concurrency: 3,
    retryFailedItems: true,
    onSuccess: data => console.log('Queue operation succeeded:', data),
    onError: error => console.error('Queue operation failed:', error),
  });

  return (
    <div className="space-y-8">
      {/* Single Operation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Single Operation</h3>
        <div className="flex items-center gap-4">
          <Button onClick={() => executeSingle()} disabled={singleLoading}>
            {singleLoading ? 'Loading...' : 'Execute Single'}
          </Button>
          <div className="flex-1">
            {singleData && (
              <p className="text-sm text-green-600">Result: {singleData}</p>
            )}
            {singleError && (
              <p className="text-sm text-red-600">
                Error: {singleError.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Batch Operations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Batch Operations</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => executeBatch()} disabled={batchLoading}>
              {batchLoading ? 'Processing...' : 'Execute Batch'}
            </Button>
            <div className="flex-1">
              <Progress value={batchProgress} />
            </div>
          </div>
          {batchData && (
            <div className="text-sm space-y-1">
              <p className="font-medium">Results:</p>
              <ul className="list-disc list-inside">
                {batchData.map((result, index) => (
                  <li key={index}>{result}</li>
                ))}
              </ul>
            </div>
          )}
          {batchError && (
            <p className="text-sm text-red-600">Error: {batchError.message}</p>
          )}
        </div>
      </div>

      {/* Queue Operations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Queue Operations</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                // Add random items to queue
                const newItems = Array.from(
                  { length: 5 },
                  () => Math.floor(Math.random() * 100) + 1
                );

                addToQueue(newItems);
              }}
              disabled={queueLoading}
            >
              Add to Queue
            </Button>
            <Button
              onClick={() => executeQueue()}
              disabled={queueLoading || queuePending === 0}
            >
              {queueLoading ? 'Processing...' : 'Process Queue'}
            </Button>
            <div className="flex-1 text-sm">
              <p>Pending: {queuePending}</p>
              <p>Completed: {queueCompleted}</p>
            </div>
          </div>
          {queueData && queueData.length > 0 && (
            <div className="text-sm space-y-1">
              <p className="font-medium">Results:</p>
              <ul className="list-disc list-inside">
                {queueData.map((result, index) => (
                  <li key={index}>{result}</li>
                ))}
              </ul>
            </div>
          )}
          {queueError && (
            <p className="text-sm text-red-600">Error: {queueError.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
