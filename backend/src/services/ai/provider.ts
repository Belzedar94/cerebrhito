import type { IService } from '../base';
import type { ILLMService, ITTSService, AIMessage, AIResponse, TTSResponse } from './interfaces';
import { AIServiceFactory } from './factory';
import { logger } from '../../utils/logger';
import { AppError } from '../../errors/types';

interface AIProviderConfig {
  llm: {
    provider: string;
    apiKey: string;
    model?: string;
    options?: Record<string, any>;
  };
  tts: {
    provider: string;
    apiKey: string;
    options?: Record<string, any>;
  };
}

/**
 * AI service provider that manages LLM and TTS services
 */
export class AIProvider implements IService {
  private factory: AIServiceFactory;
  private llmService?: ILLMService;
  private ttsService?: ITTSService;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.factory = AIServiceFactory.getInstance();
    this.config = config;
  }

  async init(): Promise<void> {
    try {
      // Initialize LLM service
      this.llmService = await this.factory.createLLMService(this.config.llm);

      // Initialize TTS service
      this.ttsService = await this.factory.createTTSService(this.config.tts);

      logger.info('AI provider initialized');
    } catch (error) {
      logger.error('Failed to initialize AI provider', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    await this.factory.dispose();
  }

  /**
   * Generate response from LLM
   */
  async generateResponse(
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stopSequences?: string[];
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      generateEmbedding?: boolean;
    }
  ): Promise<AIResponse> {
    try {
      if (!this.llmService) {
        throw new Error('LLM service not initialized');
      }

      return await this.llmService.generateResponse(messages, options);
    } catch (error) {
      logger.error('AI provider generate response error', { error, messages });
      throw AppError.aiError('Failed to generate response', error);
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.llmService) {
        throw new Error('LLM service not initialized');
      }

      return await this.llmService.generateEmbedding(text);
    } catch (error) {
      logger.error('AI provider generate embedding error', { error, text });
      throw AppError.aiError('Failed to generate embedding', error);
    }
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(
    text: string,
    options?: {
      voiceId?: string;
      speed?: number;
      pitch?: number;
      volume?: number;
      format?: 'mp3' | 'wav' | 'ogg';
      quality?: 'low' | 'medium' | 'high';
    }
  ): Promise<TTSResponse> {
    try {
      if (!this.ttsService) {
        throw new Error('TTS service not initialized');
      }

      return await this.ttsService.textToSpeech(text, options);
    } catch (error) {
      logger.error('AI provider text to speech error', { error, text });
      throw AppError.aiError('Failed to generate speech', error);
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Voice[]> {
    try {
      if (!this.ttsService) {
        throw new Error('TTS service not initialized');
      }

      return await this.ttsService.getVoices();
    } catch (error) {
      logger.error('AI provider get voices error', { error });
      throw AppError.aiError('Failed to get voices', error);
    }
  }

  /**
   * Get voice by ID
   */
  async getVoice(voiceId: string): Promise<Voice> {
    try {
      if (!this.ttsService) {
        throw new Error('TTS service not initialized');
      }

      return await this.ttsService.getVoice(voiceId);
    } catch (error) {
      logger.error('AI provider get voice error', { error, voiceId });
      throw AppError.aiError('Failed to get voice', error);
    }
  }

  /**
   * Get voice preview
   */
  async getVoicePreview(voiceId: string, text?: string): Promise<Buffer> {
    try {
      if (!this.ttsService) {
        throw new Error('TTS service not initialized');
      }

      return await this.ttsService.getVoicePreview(voiceId, text);
    } catch (error) {
      logger.error('AI provider get voice preview error', { error, voiceId });
      throw AppError.aiError('Failed to get voice preview', error);
    }
  }

  /**
   * Get LLM models
   */
  async getModels(): Promise<string[]> {
    try {
      if (!this.llmService) {
        throw new Error('LLM service not initialized');
      }

      return await this.llmService.getModels();
    } catch (error) {
      logger.error('AI provider get models error', { error });
      throw AppError.aiError('Failed to get models', error);
    }
  }

  /**
   * Get model info
   */
  async getModelInfo(model: string): Promise<{
    name: string;
    description: string;
    maxTokens: number;
    trainingData: string;
    capabilities: string[];
  }> {
    try {
      if (!this.llmService) {
        throw new Error('LLM service not initialized');
      }

      return await this.llmService.getModelInfo(model);
    } catch (error) {
      logger.error('AI provider get model info error', { error, model });
      throw AppError.aiError('Failed to get model info', error);
    }
  }
}
