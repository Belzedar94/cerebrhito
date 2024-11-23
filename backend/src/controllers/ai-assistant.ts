import type { Request, Response } from 'express';
import { z } from 'zod';
import { AIAssistantService } from '../services/ai-assistant';

const messageSchema = z.object({
  message: z.string().min(1),
  childId: z.string().uuid().nullable(),
});

export class AIAssistantController {
  private aiService: AIAssistantService;

  constructor() {
    this.aiService = new AIAssistantService();
  }

  /**
   * Process a message and return both text and audio responses
   * Requires authentication
   */
  processMessage = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = messageSchema.parse(req.body);

      // Get user ID from auth middleware
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      // Process message
      const response = await this.aiService.processMessage(
        req.user.userId,
        validatedData.childId,
        validatedData.message
      );

      // Send response
      res.json({
        text: response.text,
        audio: response.audio.toString('base64'),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        console.error('AI Assistant Error:', error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };
}
