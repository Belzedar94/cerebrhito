'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAsync } from '@/hooks/useAsync';
import { apiClient } from '@/lib/api';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memory: string;
  uptime: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
  };
}

export function CacheMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch cache stats
  const {
    data: stats,
    loading: statsLoading,
    execute: fetchStats,
  } = useAsync<CacheStats>(
    () => apiClient.get('/api/cache/stats').then(res => res.data),
    {
      onError: error => console.error('Error fetching cache stats:', error),
    }
  );

  // Clear cache
  const { loading: clearLoading, execute: clearCache } = useAsync(
    () => apiClient.post('/api/cache/clear'),
    {
      onSuccess: () => fetchStats(),
      onError: error => console.error('Error clearing cache:', error),
    }
  );

  // Auto refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      interval = setInterval(fetchStats, 5000);
    }

    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button onClick={() => fetchStats()} disabled={statsLoading}>
          {statsLoading ? 'Loading...' : 'Refresh'}
        </Button>
        <Button variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
          {autoRefresh ? 'Stop Auto Refresh' : 'Start Auto Refresh'}
        </Button>
        <Button
          variant="destructive"
          onClick={() => clearCache()}
          disabled={clearLoading}
        >
          {clearLoading ? 'Clearing...' : 'Clear Cache'}
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hit Rate */}
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Hit Rate</h3>
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span>{(stats.hitRate * 100).toFixed(2)}%</span>
                <span>
                  {stats.hits} hits / {stats.misses} misses
                </span>
              </div>
              <Progress value={stats.hitRate * 100} />
            </div>
          </div>

          {/* Cache Size */}
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Cache Size</h3>
            <div className="mt-2">
              <p className="text-3xl font-semibold">{stats.size}</p>
              <p className="text-sm text-gray-500">keys</p>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
            <div className="mt-2">
              <p className="text-3xl font-semibold">{stats.memory}</p>
            </div>
          </div>

          {/* Uptime */}
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
            <div className="mt-2">
              <p className="text-3xl font-semibold">
                {formatUptime(stats.uptime)}
              </p>
            </div>
          </div>

          {/* Operations */}
          <div className="p-4 bg-white rounded-lg border md:col-span-2 lg:col-span-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              Operations
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-semibold">
                  {stats.operations.gets}
                </p>
                <p className="text-sm text-gray-500">Gets</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stats.operations.sets}
                </p>
                <p className="text-sm text-gray-500">Sets</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stats.operations.deletes}
                </p>
                <p className="text-sm text-gray-500">Deletes</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
