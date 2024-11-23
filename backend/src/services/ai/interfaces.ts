import { IService } from '../base';

// Common types
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  message: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface TTSResponse {
  audio: Buffer;
  duration: number;
  metadata?: Record<string, any>;
}

export interface Voice {
  id: string;
  name: string;
  gender: string;
  language: string;
  preview_url?: string;
}

// LLM service interface
export interface ILLMService extends IService {
  /**
   * Generate a response from the LLM
   */
  generateResponse(
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
  ): Promise<AIResponse>;

  /**
   * Generate embeddings for text
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Get available models
   */
  getModels(): Promise<string[]>;

  /**
   * Get model info
   */
  getModelInfo(model: string): Promise<{
    name: string;
    description: string;
    maxTokens: number;
    trainingData: string;
    capabilities: string[];
  }>;
}

// TTS service interface
export interface ITTSService extends IService {
  /**
   * Convert text to speech
   */
  textToSpeech(
    text: string,
    options?: {
      voiceId?: string;
      speed?: number;
      pitch?: number;
      volume?: number;
      format?: 'mp3' | 'wav' | 'ogg';
      quality?: 'low' | 'medium' | 'high';
    }
  ): Promise<TTSResponse>;

  /**
   * Get available voices
   */
  getVoices(): Promise<Voice[]>;

  /**
   * Get voice by ID
   */
  getVoice(voiceId: string): Promise<Voice>;

  /**
   * Get voice preview
   */
  getVoicePreview(voiceId: string, text?: string): Promise<Buffer>;
}

// AI service factory interface
export interface IAIServiceFactory {
  /**
   * Create LLM service instance
   */
  createLLMService(config: {
    provider: string;
    apiKey: string;
    model?: string;
    options?: Record<string, any>;
  }): Promise<ILLMService>;

  /**
   * Create TTS service instance
   */
  createTTSService(config: {
    provider: string;
    apiKey: string;
    options?: Record<string, any>;
  }): Promise<ITTSService>;
}