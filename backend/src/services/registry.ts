import { ServiceLocator } from './base';
import { DatabaseService } from './database';
import { AIAssistantService } from './aiAssistant';
import { CacheService } from './cache';
import { logger } from '../utils/logger';

export async function initializeServices(): Promise<ServiceLocator> {
  const serviceLocator = ServiceLocator.getInstance();

  try {
    // Initialize cache service
    const cacheService = new CacheService({
      url: process.env.REDIS_URL,
      defaultTtl: 300 // 5 minutes default TTL
    });
    serviceLocator.register('cache', cacheService);

    // Initialize database service with cache
    const dbService = new DatabaseService(cacheService);
    serviceLocator.register('database', dbService);

    // Initialize AI assistant service
    const aiService = new AIAssistantService(dbService, {
      groqApiKey: process.env.GROQ_API_KEY || '',
      elevenLabsApiKey: process.env.ELEVEN_LABS_API_KEY || '',
      model: process.env.AI_MODEL || 'mixtral-8x7b-32768'
    });
    serviceLocator.register('aiAssistant', aiService);

    // Initialize all services
    await serviceLocator.initializeAll();
    logger.info('All services initialized successfully');

    return serviceLocator;
  } catch (error) {
    logger.error('Failed to initialize services', error);
    throw error;
  }
}

export async function shutdownServices(): Promise<void> {
  const serviceLocator = ServiceLocator.getInstance();
  try {
    await serviceLocator.disposeAll();
    logger.info('All services disposed successfully');
  } catch (error) {
    logger.error('Error during service shutdown', error);
    throw error;
  }
}