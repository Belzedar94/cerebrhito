import { ElevenLabs } from 'elevenlabs';
import { ITTSService, TTSResponse, Voice } from './interfaces';
import { logger } from '../../utils/logger';
import { AppError } from '../../errors/types';

interface ElevenLabsConfig {
  apiKey: string;
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  };
}

export class ElevenLabsService implements ITTSService {
  private client: ElevenLabs;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(config: ElevenLabsConfig) {
    this.client = new ElevenLabs({
      apiKey: config.apiKey
    });

    this.maxRetries = config.options?.maxRetries || 3;
    this.retryDelay = config.options?.retryDelay || 1000;
    this.timeout = config.options?.timeout || 30000;
  }

  async init(): Promise<void> {
    try {
      // Verify API key and service availability
      await this.getVoices();
      logger.info('ElevenLabs service initialized');
    } catch (error) {
      logger.error('Failed to initialize ElevenLabs service', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // No cleanup needed
  }

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
      let attempts = 0;
      let lastError: Error | undefined;

      while (attempts < this.maxRetries) {
        try {
          const response = await Promise.race([
            this.client.textToSpeech({
              text,
              voice_id: options?.voiceId,
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.5,
                use_speaker_boost: true
              },
              model_id: options?.quality === 'high' ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1',
              output_format: options?.format || 'mp3'
            }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Request timed out')),
                this.timeout
              )
            )
          ]);

          // Get audio duration
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(response.arrayBuffer());
          const duration = audioBuffer.duration;

          return {
            audio: Buffer.from(response),
            duration,
            metadata: {
              format: options?.format || 'mp3',
              quality: options?.quality || 'medium',
              voiceId: options?.voiceId
            }
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          attempts++;

          if (attempts < this.maxRetries) {
            logger.warn('Retrying ElevenLabs request', {
              attempt: attempts,
              error: lastError.message
            });
            await new Promise(resolve =>
              setTimeout(resolve, this.retryDelay * attempts)
            );
          }
        }
      }

      throw lastError || new Error('Failed to generate speech');
    } catch (error) {
      logger.error('ElevenLabs text to speech error', { error, text });
      throw AppError.aiError('Failed to generate speech', error);
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await this.client.getVoices();

      return response.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'unknown',
        language: voice.labels?.language || 'en',
        preview_url: voice.preview_url
      }));
    } catch (error) {
      logger.error('ElevenLabs get voices error', { error });
      throw AppError.aiError('Failed to get voices', error);
    }
  }

  async getVoice(voiceId: string): Promise<Voice> {
    try {
      const response = await this.client.getVoice(voiceId);

      return {
        id: response.voice_id,
        name: response.name,
        gender: response.labels?.gender || 'unknown',
        language: response.labels?.language || 'en',
        preview_url: response.preview_url
      };
    } catch (error) {
      logger.error('ElevenLabs get voice error', { error, voiceId });
      throw AppError.aiError('Failed to get voice', error);
    }
  }

  async getVoicePreview(voiceId: string, text?: string): Promise<Buffer> {
    try {
      if (text) {
        const response = await this.textToSpeech(text, {
          voiceId,
          quality: 'low'
        });
        return response.audio;
      } else {
        const voice = await this.getVoice(voiceId);
        if (!voice.preview_url) {
          throw new Error('Voice has no preview URL');
        }

        const response = await fetch(voice.preview_url);
        return Buffer.from(await response.arrayBuffer());
      }
    } catch (error) {
      logger.error('ElevenLabs get voice preview error', { error, voiceId });
      throw AppError.aiError('Failed to get voice preview', error);
    }
  }
}