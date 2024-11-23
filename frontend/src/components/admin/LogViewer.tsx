'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAsync } from '@/hooks/useAsync';
import { apiClient } from '@/lib/api';

interface LogQuery {
  startDate?: string;
  endDate?: string;
  level?: string;
  requestId?: string;
  userId?: string;
  childId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  minDuration?: number;
  type?: string;
  severity?: string;
  page?: number;
  limit?: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata: any;
}

interface LogStats {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  statusCodeDistribution: Record<number, number>;
  topEndpoints: Array<{ path: string; count: number }>;
  topErrors: Array<{ message: string; count: number }>;
  performanceMetrics: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export function LogViewer() {
  const [query, setQuery] = useState<LogQuery>({
    page: 1,
    limit: 50,
  });

  const [view, setView] = useState<'logs' | 'stats'>('logs');

  // Fetch logs
  const {
    data: logs,
    loading: logsLoading,
    execute: fetchLogs,
  } = useAsync<LogEntry[]>(
    () => apiClient.get('/api/logs', { params: query }).then(res => res.data),
    {
      onError: error => console.error('Error fetching logs:', error),
    }
  );

  // Fetch stats
  const {
    data: stats,
    loading: statsLoading,
    execute: fetchStats,
  } = useAsync<LogStats>(
    () =>
      apiClient
        .get('/api/logs/stats', {
          params: {
            startDate: query.startDate,
            endDate: query.endDate,
          },
        })
        .then(res => res.data),
    {
      onError: error => console.error('Error fetching stats:', error),
    }
  );

  // Export logs
  const { loading: exportLoading, execute: exportLogs } = useAsync<string>(
    () => apiClient.post('/api/logs/export', query).then(res => res.data),
    {
      onSuccess: url => window.open(url, '_blank'),
      onError: error => console.error('Error exporting logs:', error),
    }
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant={view === 'logs' ? 'default' : 'outline'}
          onClick={() => setView('logs')}
        >
          Logs
        </Button>
        <Button
          variant={view === 'stats' ? 'default' : 'outline'}
          onClick={() => setView('stats')}
        >
          Statistics
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="datetime-local"
            value={query.startDate}
            onChange={e =>
              setQuery(prev => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="datetime-local"
            value={query.endDate}
            onChange={e =>
              setQuery(prev => ({
                ...prev,
                endDate: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Log Level</label>
          <Select
            value={query.level}
            onValueChange={value =>
              setQuery(prev => ({
                ...prev,
                level: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Request ID</label>
          <Input
            value={query.requestId}
            onChange={e =>
              setQuery(prev => ({
                ...prev,
                requestId: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">User ID</label>
          <Input
            value={query.userId}
            onChange={e =>
              setQuery(prev => ({
                ...prev,
                userId: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Child ID</label>
          <Input
            value={query.childId}
            onChange={e =>
              setQuery(prev => ({
                ...prev,
                childId: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Path</label>
          <Input
            value={query.path}
            onChange={e =>
              setQuery(prev => ({
                ...prev,
                path: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Method</label>
          <Select
            value={query.method}
            onValueChange={value =>
              setQuery(prev => ({
                ...prev,
                method: value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => (view === 'logs' ? fetchLogs() : fetchStats())}
          disabled={logsLoading || statsLoading}
        >
          {logsLoading || statsLoading ? 'Loading...' : 'Refresh'}
        </Button>
        <Button
          variant="outline"
          onClick={() => exportLogs()}
          disabled={exportLoading}
        >
          {exportLoading ? 'Exporting...' : 'Export'}
        </Button>
      </div>

      {/* Content */}
      {view === 'logs' ? (
        <div className="space-y-4">
          {/* Log entries */}
          {logs?.map((log, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                log.level === 'error'
                  ? 'bg-red-50 border-red-200'
                  : log.level === 'warn'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <span
                  className={`text-sm font-medium ${
                    log.level === 'error'
                      ? 'text-red-600'
                      : log.level === 'warn'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                  }`}
                >
                  {log.level.toUpperCase()}
                </span>
              </div>
              <p className="mt-2">{log.message}</p>
              {log.metadata && (
                <pre className="mt-2 text-sm bg-gray-50 p-2 rounded">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() =>
                setQuery(prev => ({
                  ...prev,
                  page: Math.max(1, (prev.page || 1) - 1),
                }))
              }
              disabled={query.page === 1}
            >
              Previous
            </Button>
            <span>Page {query.page}</span>
            <Button
              variant="outline"
              onClick={() =>
                setQuery(prev => ({
                  ...prev,
                  page: (prev.page || 1) + 1,
                }))
              }
              disabled={!logs || logs.length < (query.limit || 50)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {stats && (
            <>
              {/* Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Requests
                  </h3>
                  <p className="mt-2 text-3xl font-semibold">
                    {stats.totalRequests}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500">
                    Avg Response Time
                  </h3>
                  <p className="mt-2 text-3xl font-semibold">
                    {stats.averageResponseTime.toFixed(2)}ms
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500">
                    Error Rate
                  </h3>
                  <p className="mt-2 text-3xl font-semibold">
                    {(stats.errorRate * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500">
                    Success Rate
                  </h3>
                  <p className="mt-2 text-3xl font-semibold">
                    {((1 - stats.errorRate) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">
                  Response Time Percentiles
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>P50</span>
                      <span>{stats.performanceMetrics.p50.toFixed(2)}ms</span>
                    </div>
                    <Progress value={50} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>P90</span>
                      <span>{stats.performanceMetrics.p90.toFixed(2)}ms</span>
                    </div>
                    <Progress value={90} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>P95</span>
                      <span>{stats.performanceMetrics.p95.toFixed(2)}ms</span>
                    </div>
                    <Progress value={95} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>P99</span>
                      <span>{stats.performanceMetrics.p99.toFixed(2)}ms</span>
                    </div>
                    <Progress value={99} />
                  </div>
                </div>
              </div>

              {/* Top Endpoints */}
              <div className="p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Top Endpoints</h3>
                <div className="space-y-2">
                  {stats.topEndpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="font-mono">{endpoint.path}</span>
                      <span className="text-gray-500">
                        {endpoint.count} requests
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Errors */}
              <div className="p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Top Errors</h3>
                <div className="space-y-2">
                  {stats.topErrors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-red-600">{error.message}</span>
                      <span className="text-gray-500">
                        {error.count} occurrences
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Code Distribution */}
              <div className="p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">
                  Status Code Distribution
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.statusCodeDistribution).map(
                    ([code, count]) => (
                      <div
                        key={code}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span
                          className={`font-mono ${
                            code.startsWith('2')
                              ? 'text-green-600'
                              : code.startsWith('4')
                                ? 'text-yellow-600'
                                : code.startsWith('5')
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                          }`}
                        >
                          {code}
                        </span>
                        <span className="text-gray-500">{count} requests</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
