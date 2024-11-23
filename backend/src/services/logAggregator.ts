import { logger } from '../utils/logger';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { createGunzip } from 'zlib';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';

interface LogQuery {
  startDate?: Date;
  endDate?: Date;
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

export class LogAggregator {
  private readonly logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
  }

  /**
   * Query logs with filtering and pagination
   */
  async queryLogs(query: LogQuery, page: number = 1, limit: number = 100): Promise<LogEntry[]> {
    try {
      const logFiles = await this.getLogFiles();
      const results: LogEntry[] = [];
      const skip = (page - 1) * limit;

      for (const file of logFiles) {
        const entries = await this.processLogFile(file, query);
        results.push(...entries);

        if (results.length >= skip + limit) {
          break;
        }
      }

      return results.slice(skip, skip + limit);
    } catch (error) {
      logger.error('Error querying logs', { error, query });
      throw error;
    }
  }

  /**
   * Calculate statistics from logs
   */
  async calculateStats(startDate?: Date, endDate?: Date): Promise<LogStats> {
    try {
      const logFiles = await this.getLogFiles();
      const stats: LogStats = {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        statusCodeDistribution: {},
        topEndpoints: [],
        topErrors: [],
        performanceMetrics: { p50: 0, p90: 0, p95: 0, p99: 0 }
      };

      const responseTimes: number[] = [];
      const endpointCounts: Record<string, number> = {};
      const errorCounts: Record<string, number> = {};
      let totalErrors = 0;

      for (const file of logFiles) {
        const entries = await this.processLogFile(file, {
          startDate,
          endDate,
          level: 'http'
        });

        for (const entry of entries) {
          if (entry.metadata.statusCode) {
            stats.totalRequests++;
            stats.statusCodeDistribution[entry.metadata.statusCode] =
              (stats.statusCodeDistribution[entry.metadata.statusCode] || 0) + 1;

            if (entry.metadata.duration) {
              responseTimes.push(parseFloat(entry.metadata.duration));
            }

            if (entry.metadata.path) {
              endpointCounts[entry.metadata.path] =
                (endpointCounts[entry.metadata.path] || 0) + 1;
            }

            if (entry.metadata.statusCode >= 400) {
              totalErrors++;
              const errorMessage = entry.metadata.error?.message || 'Unknown error';
              errorCounts[errorMessage] = (errorCounts[errorMessage] || 0) + 1;
            }
          }
        }
      }

      // Calculate statistics
      if (stats.totalRequests > 0) {
        stats.errorRate = totalErrors / stats.totalRequests;
        stats.averageResponseTime =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

        // Sort response times for percentiles
        responseTimes.sort((a, b) => a - b);
        const getPercentile = (p: number) => {
          const index = Math.ceil((p / 100) * responseTimes.length) - 1;
          return responseTimes[index];
        };

        stats.performanceMetrics = {
          p50: getPercentile(50),
          p90: getPercentile(90),
          p95: getPercentile(95),
          p99: getPercentile(99)
        };

        // Get top endpoints
        stats.topEndpoints = Object.entries(endpointCounts)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Get top errors
        stats.topErrors = Object.entries(errorCounts)
          .map(([message, count]) => ({ message, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      return stats;
    } catch (error) {
      logger.error('Error calculating log statistics', { error });
      throw error;
    }
  }

  /**
   * Export logs to a file
   */
  async exportLogs(query: LogQuery, format: 'json' | 'csv'): Promise<string> {
    try {
      const entries = await this.queryLogs(query);
      const outputPath = path.join(
        this.logDir,
        `export_${Date.now()}.${format}`
      );

      if (format === 'csv') {
        const csvContent = this.convertToCSV(entries);
        await this.writeFile(outputPath, csvContent);
      } else {
        const jsonContent = JSON.stringify(entries, null, 2);
        await this.writeFile(outputPath, jsonContent);
      }

      return outputPath;
    } catch (error) {
      logger.error('Error exporting logs', { error, query, format });
      throw error;
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(retentionDays: number): Promise<void> {
    try {
      const logFiles = await this.getLogFiles();
      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      for (const file of logFiles) {
        const stats = await this.getFileStats(file);
        if (now - stats.mtimeMs > retentionMs) {
          await this.deleteFile(file);
          logger.info('Deleted old log file', { file });
        }
      }
    } catch (error) {
      logger.error('Error cleaning up old logs', { error });
      throw error;
    }
  }

  private async getLogFiles(): Promise<string[]> {
    const files = await readdir(this.logDir);
    return files
      .filter(file => file.endsWith('.log') || file.endsWith('.log.gz'))
      .map(file => path.join(this.logDir, file))
      .sort((a, b) => {
        // Sort by date in filename, most recent first
        const dateA = this.extractDateFromFilename(a);
        const dateB = this.extractDateFromFilename(b);
        return dateB.getTime() - dateA.getTime();
      });
  }

  private extractDateFromFilename(filename: string): Date {
    const match = filename.match(/\d{4}-\d{2}-\d{2}/);
    return match ? new Date(match[0]) : new Date(0);
  }

  private async processLogFile(
    filePath: string,
    query: LogQuery
  ): Promise<LogEntry[]> {
    const entries: LogEntry[] = [];
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: filePath.endsWith('.gz')
        ? fileStream.pipe(createGunzip())
        : fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const entry = JSON.parse(line);
        if (this.matchesQuery(entry, query)) {
          entries.push(entry);
        }
      } catch (error) {
        logger.warn('Error parsing log line', { error, line, file: filePath });
      }
    }

    return entries;
  }

  private matchesQuery(entry: LogEntry, query: LogQuery): boolean {
    if (query.startDate && new Date(entry.timestamp) < query.startDate) {
      return false;
    }
    if (query.endDate && new Date(entry.timestamp) > query.endDate) {
      return false;
    }
    if (query.level && entry.level !== query.level) {
      return false;
    }
    if (query.requestId && entry.metadata.requestId !== query.requestId) {
      return false;
    }
    if (query.userId && entry.metadata.userId !== query.userId) {
      return false;
    }
    if (query.childId && entry.metadata.childId !== query.childId) {
      return false;
    }
    if (query.path && entry.metadata.path !== query.path) {
      return false;
    }
    if (query.method && entry.metadata.method !== query.method) {
      return false;
    }
    if (query.statusCode && entry.metadata.statusCode !== query.statusCode) {
      return false;
    }
    if (
      query.minDuration &&
      (!entry.metadata.duration ||
        parseFloat(entry.metadata.duration) < query.minDuration)
    ) {
      return false;
    }
    if (query.type && entry.metadata.type !== query.type) {
      return false;
    }
    if (query.severity && entry.metadata.severity !== query.severity) {
      return false;
    }
    return true;
  }

  private convertToCSV(entries: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'message'];
    const rows = entries.map(entry => {
      const row = [entry.timestamp, entry.level, entry.message];
      if (entry.metadata) {
        Object.entries(entry.metadata).forEach(([key, value]) => {
          if (!headers.includes(key)) {
            headers.push(key);
          }
          const index = headers.indexOf(key);
          row[index] = JSON.stringify(value);
        });
      }
      return row;
    });

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf8');
  }

  private async getFileStats(filePath: string) {
    const stats = await stat(filePath);
    return stats;
  }

  private async deleteFile(filePath: string): Promise<void> {
    await unlink(filePath);
  }
}