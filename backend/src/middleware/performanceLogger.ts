import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  totalDuration: number;
  dbDuration?: number;
  aiDuration?: number;
  ttsDuration?: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  const startTime = performance.now();
  const startCpu = process.cpuUsage();
  const startMemory = process.memoryUsage();

  // Track database operations timing
  let dbDuration = 0;
  const originalQuery = (req as any).db?.query;

  if (originalQuery) {
    (req as any).db.query = async (...args: any[]) => {
      const dbStartTime = performance.now();

      try {
        return await originalQuery.apply((req as any).db, args);
      } finally {
        dbDuration += performance.now() - dbStartTime;
      }
    };
  }

  // Track AI operations timing
  let aiDuration = 0;
  const originalAiCall = (req as any).ai?.generateResponse;

  if (originalAiCall) {
    (req as any).ai.generateResponse = async (...args: any[]) => {
      const aiStartTime = performance.now();

      try {
        return await originalAiCall.apply((req as any).ai, args);
      } finally {
        aiDuration += performance.now() - aiStartTime;
      }
    };
  }

  // Track TTS operations timing
  let ttsDuration = 0;
  const originalTtsCall = (req as any).tts?.generateSpeech;

  if (originalTtsCall) {
    (req as any).tts.generateSpeech = async (...args: any[]) => {
      const ttsStartTime = performance.now();

      try {
        return await originalTtsCall.apply((req as any).tts, args);
      } finally {
        ttsDuration += performance.now() - ttsStartTime;
      }
    };
  }

  // Log performance metrics on response finish
  res.on('finish', () => {
    const endTime = performance.now();
    const endCpu = process.cpuUsage(startCpu);
    const endMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      totalDuration: endTime - startTime,
      dbDuration: dbDuration || undefined,
      aiDuration: aiDuration || undefined,
      ttsDuration: ttsDuration || undefined,
      memoryUsage: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      },
      cpuUsage: {
        user: endCpu.user,
        system: endCpu.system,
      },
    };

    // Log performance metrics
    logger.info('Performance metrics', {
      ...metrics,
      timestamp: new Date().toISOString(),
    });

    // Add performance headers
    res.setHeader('X-Response-Time', `${metrics.totalDuration}ms`);

    if (metrics.dbDuration) {
      res.setHeader('X-DB-Time', `${metrics.dbDuration}ms`);
    }

    if (metrics.aiDuration) {
      res.setHeader('X-AI-Time', `${metrics.aiDuration}ms`);
    }

    if (metrics.ttsDuration) {
      res.setHeader('X-TTS-Time', `${metrics.ttsDuration}ms`);
    }

    // Log slow requests
    const slowThreshold = 1000; // 1 second

    if (metrics.totalDuration > slowThreshold) {
      logger.warn('Slow request detected', {
        ...metrics,
        threshold: slowThreshold,
        timestamp: new Date().toISOString(),
      });
    }

    // Log high memory usage
    const heapThreshold = 100 * 1024 * 1024; // 100MB

    if (metrics.memoryUsage.heapUsed > heapThreshold) {
      logger.warn('High memory usage detected', {
        ...metrics,
        threshold: heapThreshold,
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};
