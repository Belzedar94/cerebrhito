import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { initializeServices, shutdownServices } from './services/registry';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import aiAssistantRoutes from './routes/ai-assistant';
import activityRoutes from './routes/activity';
import developmentRoutes from './routes/development';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.CORS_ORIGIN || 'http://localhost:3000'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
import { requestLogger } from './middleware/requestLogger';
app.use(requestLogger);

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const error = new Error('Too many requests') as any;

    error.name = 'TooManyRequestsError';
    errorHandler(error, req, res, () => {});
  },
});

// Apply rate limiting to all routes
app.use(limiter);

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    const services = await initializeServices();
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'checking',
        groq: 'checking',
        elevenLabs: 'checking',
        cache: 'checking',
      },
    };

    // Check database connection
    try {
      const dbService = services.get('database');

      await dbService.init();
      healthStatus.services.database = 'up';
    } catch (error) {
      healthStatus.services.database = 'down';
      healthStatus.status = 'degraded';
      logger.error('Database health check failed', error);
    }

    // Check Groq API
    try {
      const groqService = services.get('groq');

      await groqService.testConnection();
      healthStatus.services.groq = 'up';
    } catch (error) {
      healthStatus.services.groq = 'down';
      healthStatus.status = 'degraded';
      logger.error('Groq API health check failed', error);
    }

    // Check ElevenLabs API
    try {
      const ttsService = services.get('elevenLabs');

      await ttsService.testConnection();
      healthStatus.services.elevenLabs = 'up';
    } catch (error) {
      healthStatus.services.elevenLabs = 'down';
      healthStatus.status = 'degraded';
      logger.error('ElevenLabs API health check failed', error);
    }

    // Check Redis cache
    try {
      const cacheService = services.get('cache');

      await cacheService.ping();
      healthStatus.services.cache = 'up';
    } catch (error) {
      healthStatus.services.cache = 'down';
      healthStatus.status = 'degraded';
      logger.error('Cache health check failed', error);
    }

    // If any critical service is down, mark as unhealthy
    if (healthStatus.services.database === 'down') {
      healthStatus.status = 'unhealthy';
    }

    const statusCode =
      healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 207 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Detailed health check (requires authentication)
import { authenticateToken } from './middleware/auth';
app.get('/health/details', authenticateToken, async (req, res) => {
  try {
    const services = await initializeServices();
    const detailedStatus = {
      status: 'checking',
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        env: process.env.NODE_ENV,
      },
      services: {},
    };

    // Detailed database check
    try {
      const dbService = services.get('database');
      const dbStatus = await dbService.getDetailedStatus();

      detailedStatus.services.database = {
        status: 'up',
        version: dbStatus.version,
        connectionPool: dbStatus.poolStatus,
        latency: dbStatus.latency,
      };
    } catch (error) {
      detailedStatus.services.database = {
        status: 'down',
        error: error.message,
      };
    }

    // Detailed Groq API check
    try {
      const groqService = services.get('groq');
      const groqStatus = await groqService.getDetailedStatus();

      detailedStatus.services.groq = {
        status: 'up',
        version: groqStatus.version,
        models: groqStatus.availableModels,
        quotaRemaining: groqStatus.quotaRemaining,
      };
    } catch (error) {
      detailedStatus.services.groq = {
        status: 'down',
        error: error.message,
      };
    }

    // Detailed ElevenLabs check
    try {
      const ttsService = services.get('elevenLabs');
      const ttsStatus = await ttsService.getDetailedStatus();

      detailedStatus.services.elevenLabs = {
        status: 'up',
        version: ttsStatus.version,
        voices: ttsStatus.availableVoices,
        quotaRemaining: ttsStatus.quotaRemaining,
      };
    } catch (error) {
      detailedStatus.services.elevenLabs = {
        status: 'down',
        error: error.message,
      };
    }

    // Detailed cache check
    try {
      const cacheService = services.get('cache');
      const cacheStatus = await cacheService.getDetailedStatus();

      detailedStatus.services.cache = {
        status: 'up',
        version: cacheStatus.version,
        memory: cacheStatus.memory,
        hitRate: cacheStatus.hitRate,
        connectedClients: cacheStatus.clients,
      };
    } catch (error) {
      detailedStatus.services.cache = {
        status: 'down',
        error: error.message,
      };
    }

    // Determine overall status
    const serviceStatuses = Object.values(detailedStatus.services).map(s => s.status);

    if (serviceStatuses.every(s => s === 'up')) {
      detailedStatus.status = 'healthy';
    } else if (serviceStatuses.some(s => s === 'down')) {
      detailedStatus.status =
        detailedStatus.services.database.status === 'down' ? 'unhealthy' : 'degraded';
    }

    const statusCode =
      detailedStatus.status === 'healthy' ? 200 : detailedStatus.status === 'degraded' ? 207 : 503;

    res.status(statusCode).json(detailedStatus);
  } catch (error) {
    logger.error('Detailed health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/development', developmentRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(port, async () => {
  try {
    // Initialize services
    await initializeServices();
    logger.info(`Server running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Starting graceful shutdown...');

  server.close(async () => {
    try {
      await shutdownServices();
      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  });
});
