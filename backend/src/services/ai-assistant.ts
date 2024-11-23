import { DatabaseService } from './database';
import { supabase } from '../config/supabase';
import type { AIChatHistory } from '../types/database';

// Types for Groq API
interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Types for ElevenLabs API
interface ElevenLabsResponse {
  audio: string;
}

export class AIAssistantService {
  private db: DatabaseService;
  private groqApiKey: string;
  private elevenLabsApiKey: string;
  private systemPrompt: string;

  constructor() {
    this.db = new DatabaseService();
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';

    // System prompt that defines the AI assistant's behavior and knowledge
    this.systemPrompt = `You are CerebrHito, an expert AI assistant in child development and neuropsychology. Your role is to help parents and professionals track and support child development.

Key aspects of your personality and behavior:
1. Empathetic and supportive: Always show understanding and validate parents' concerns
2. Professional but approachable: Use clear language while maintaining expertise
3. Evidence-based: Base recommendations on scientific research
4. Safety-conscious: Always prioritize child safety and recommend professional consultation when needed
5. Culturally sensitive: Adapt advice to cultural context
6. Age-appropriate: Tailor recommendations to the child's specific age and development stage

Areas of expertise:
- Child development milestones
- Early intervention strategies
- Play-based learning activities
- Motor skills development
- Cognitive development
- Social-emotional development
- Language acquisition
- Behavioral guidance
- Parent-child bonding
- Safe sleep practices
- Nutrition and feeding
- Developmental red flags

When giving advice:
1. Ask clarifying questions when needed
2. Provide specific, actionable recommendations
3. Explain the developmental benefits of suggested activities
4. Include safety considerations
5. Suggest when to consult healthcare providers
6. Offer alternatives for different situations

Remember: You are a supportive guide, not a replacement for healthcare professionals. Always encourage parents to consult with their pediatrician or relevant specialists for medical concerns.`;
  }

  /**
   * Generate embeddings for text using Supabase's vector functionality
   * This helps in maintaining context across conversations
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const { data: embedding, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text },
    });

    if (error) {
      throw error;
    }

    return embedding;
  }

  /**
   * Get relevant conversation history based on the current message
   * Uses similarity search on embeddings to find related context
   */
  private async getRelevantHistory(
    userId: string,
    message: string,
    limit = 5
  ): Promise<AIChatHistory[]> {
    const messageEmbedding = await this.generateEmbedding(message);

    const { data: history, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId)
      .not('embedding', 'is', null)
      .order('embedding <-> $1', { ascending: true })
      .limit(limit)
      .bind(messageEmbedding);

    if (error) {
      throw error;
    }

    return history;
  }

  /**
   * Call Groq API to generate a response
   * Uses llama-3.1-70b-versatile model for high-quality responses
   */
  private async callGroqAPI(messages: GroqMessage[]): Promise<string> {
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages,
        max_tokens: 8192,
        temperature: 1.2,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Groq API');
    }

    const data: GroqResponse = await response.json();

    return data.choices[0].message.content;
  }

  /**
   * Convert text to speech using ElevenLabs API
   * Uses Eleven_turbo_v2_5 model for natural-sounding speech
   */
  private async textToSpeech(text: string): Promise<Buffer> {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.elevenLabsApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'Eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.82,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }

    const data: ElevenLabsResponse = await response.json();

    return Buffer.from(data.audio, 'base64');
  }

  /**
   * Process a user message and generate a response
   * Includes context from previous conversations and converts response to speech
   */
  async processMessage(
    userId: string,
    childId: string | null,
    message: string
  ): Promise<{
    text: string;
    audio: Buffer;
  }> {
    // Get relevant conversation history
    const history = await this.getRelevantHistory(userId, message);

    // Build conversation context
    const messages: GroqMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...history
        .map(h => [
          { role: 'user' as const, content: h.message },
          { role: 'assistant' as const, content: h.response },
        ])
        .flat(),
      { role: 'user', content: message },
    ];

    // Get AI response
    const response = await this.callGroqAPI(messages);

    // Convert response to speech
    const audio = await this.textToSpeech(response);

    // Save conversation to history
    const embedding = await this.generateEmbedding(`${message} ${response}`);

    await this.db.createChatHistory({
      user_id: userId,
      child_id: childId,
      message,
      response,
      embedding,
    });

    return {
      text: response,
      audio,
    };
  }
}
