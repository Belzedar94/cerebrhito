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

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`
    });
  });

  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbService = (await initializeServices()).get('database');
    await dbService.init();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up'
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
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