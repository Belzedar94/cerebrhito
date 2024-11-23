import { Groq } from 'groq-sdk';
import { ILLMService, AIMessage, AIResponse } from './interfaces';
import { logger } from '../../utils/logger';
import { AppError } from '../../errors/types';

interface GroqConfig {
  apiKey: string;
  model?: string;
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  };
}

export class GroqService implements ILLMService {
  private client: Groq;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(config: GroqConfig) {
    this.client = new Groq({
      apiKey: config.apiKey
    });

    this.model = config.model || 'mixtral-8x7b-32768';
    this.maxRetries = config.options?.maxRetries || 3;
    this.retryDelay = config.options?.retryDelay || 1000;
    this.timeout = config.options?.timeout || 30000;
  }

  async init(): Promise<void> {
    try {
      // Verify API key and model availability
      await this.getModels();
      logger.info('Groq service initialized');
    } catch (error) {
      logger.error('Failed to initialize Groq service', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // No cleanup needed
  }

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
      let attempts = 0;
      let lastError: Error | undefined;

      while (attempts < this.maxRetries) {
        try {
          const completion = await Promise.race([
            this.client.chat.completions.create({
              messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              model: this.model,
              temperature: options?.temperature,
              max_tokens: options?.maxTokens,
              stop: options?.stopSequences,
              top_p: options?.topP,
              frequency_penalty: options?.frequencyPenalty,
              presence_penalty: options?.presencePenalty
            }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Request timed out')),
                this.timeout
              )
            )
          ]);

          const response: AIResponse = {
            message: completion.choices[0].message.content || ''
          };

          if (options?.generateEmbedding) {
            response.embedding = await this.generateEmbedding(response.message);
          }

          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attempts++;

          if (attempts < this.maxRetries) {
            logger.warn('Retrying Groq request', {
              attempt: attempts,
              error: lastError.message
            });
            await new Promise(resolve =>
              setTimeout(resolve, this.retryDelay * attempts)
            );
          }
        }
      }

      throw lastError || new Error('Failed to generate response');
    } catch (error) {
      logger.error('Groq generate response error', { error, messages });
      throw AppError.aiError('Failed to generate response', error);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'llama2-70b-4096',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Groq generate embedding error', { error, text });
      throw AppError.aiError('Failed to generate embedding', error);
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      return response.data.map(model => model.id);
    } catch (error) {
      logger.error('Groq get models error', { error });
      throw AppError.aiError('Failed to get models', error);
    }
  }

  async getModelInfo(model: string): Promise<{
    name: string;
    description: string;
    maxTokens: number;
    trainingData: string;
    capabilities: string[];
  }> {
    try {
      const response = await this.client.models.retrieve(model);

      return {
        name: response.id,
        description: response.description || '',
        maxTokens: response.context_window || 0,
        trainingData: response.training_data || '',
        capabilities: response.capabilities || []
      };
    } catch (error) {
      logger.error('Groq get model info error', { error, model });
      throw AppError.aiError('Failed to get model info', error);
    }
  }
}