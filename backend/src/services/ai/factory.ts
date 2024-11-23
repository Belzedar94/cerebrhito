import { IAIServiceFactory, ILLMService, ITTSService } from './interfaces';
import { GroqService } from './groq';
import { ElevenLabsService } from './elevenlabs';
import { logger } from '../../utils/logger';
import { AppError } from '../../errors/types';

export class AIServiceFactory implements IAIServiceFactory {
  private static instance: AIServiceFactory;
  private llmServices: Map<string, ILLMService>;
  private ttsServices: Map<string, ITTSService>;

  private constructor() {
    this.llmServices = new Map();
    this.ttsServices = new Map();
  }

  static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  async createLLMService(config: {
    provider: string;
    apiKey: string;
    model?: string;
    options?: Record<string, any>;
  }): Promise<ILLMService> {
    try {
      const serviceKey = `${config.provider}:${config.model || 'default'}`;

      // Return existing service if available
      if (this.llmServices.has(serviceKey)) {
        return this.llmServices.get(serviceKey)!;
      }

      // Create new service based on provider
      let service: ILLMService;
      switch (config.provider.toLowerCase()) {
        case 'groq':
          service = new GroqService({
            apiKey: config.apiKey,
            model: config.model,
            options: config.options
          });
          break;
        // Add more providers here
        default:
          throw new Error(`Unsupported LLM provider: ${config.provider}`);
      }

      // Initialize service
      await service.init();

      // Cache service instance
      this.llmServices.set(serviceKey, service);

      return service;
    } catch (error) {
      logger.error('Failed to create LLM service', {
        error,
        provider: config.provider
      });
      throw AppError.aiError('Failed to create LLM service', error);
    }
  }

  async createTTSService(config: {
    provider: string;
    apiKey: string;
    options?: Record<string, any>;
  }): Promise<ITTSService> {
    try {
      const serviceKey = config.provider;

      // Return existing service if available
      if (this.ttsServices.has(serviceKey)) {
        return this.ttsServices.get(serviceKey)!;
      }

      // Create new service based on provider
      let service: ITTSService;
      switch (config.provider.toLowerCase()) {
        case 'elevenlabs':
          service = new ElevenLabsService({
            apiKey: config.apiKey,
            options: config.options
          });
          break;
        // Add more providers here
        default:
          throw new Error(`Unsupported TTS provider: ${config.provider}`);
      }

      // Initialize service
      await service.init();

      // Cache service instance
      this.ttsServices.set(serviceKey, service);

      return service;
    } catch (error) {
      logger.error('Failed to create TTS service', {
        error,
        provider: config.provider
      });
      throw AppError.aiError('Failed to create TTS service', error);
    }
  }

  /**
   * Get all available LLM services
   */
  getLLMServices(): Map<string, ILLMService> {
    return new Map(this.llmServices);
  }

  /**
   * Get all available TTS services
   */
  getTTSServices(): Map<string, ITTSService> {
    return new Map(this.ttsServices);
  }

  /**
   * Dispose all services
   */
  async dispose(): Promise<void> {
    try {
      // Dispose LLM services
      for (const [key, service] of this.llmServices) {
        try {
          await service.dispose();
          this.llmServices.delete(key);
        } catch (error) {
          logger.error('Error disposing LLM service', { error, key });
        }
      }

      // Dispose TTS services
      for (const [key, service] of this.ttsServices) {
        try {
          await service.dispose();
          this.ttsServices.delete(key);
        } catch (error) {
          logger.error('Error disposing TTS service', { error, key });
        }
      }
    } catch (error) {
      logger.error('Error disposing AI services', { error });
      throw AppError.aiError('Failed to dispose AI services', error);
    }
  }
}