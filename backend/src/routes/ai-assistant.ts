import { Router } from 'express';
import { z } from 'zod';
import { AIAssistantController } from '../controllers/ai-assistant';
import { AuthMiddleware } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { validateRequest, validateFileUpload } from '../middleware/validation';
import {
  aiMessageSchema,
  aiResponseSchema,
  idSchema,
  dateSchema
} from '../validation/schemas';

const router = Router();
const aiController = new AIAssistantController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Process a message and get AI response (with rate limiting and validation)
router.post('/message',
  aiLimiter,
  validateRequest({
    body: aiMessageSchema
  }),
  aiController.processMessage
);

// Get conversation history
router.get('/conversations',
  validateRequest({
    query: z.object({
      childId: idSchema.optional(),
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional()
    })
  }),
  aiController.getConversations
);

// Get specific conversation
router.get('/conversations/:conversationId',
  validateRequest({
    params: z.object({
      conversationId: idSchema
    })
  }),
  aiController.getConversation
);

// Delete conversation
router.delete('/conversations/:conversationId',
  validateRequest({
    params: z.object({
      conversationId: idSchema
    })
  }),
  aiController.deleteConversation
);

// Voice settings
router.get('/voices',
  aiController.listVoices
);

router.post('/voices/preview',
  validateRequest({
    body: z.object({
      voiceId: z.string().uuid('Invalid voice ID'),
      text: z.string()
        .min(1, 'Text cannot be empty')
        .max(200, 'Text must not exceed 200 characters')
    })
  }),
  aiController.previewVoice
);

router.put('/preferences',
  validateRequest({
    body: z.object({
      defaultVoiceId: z.string().uuid('Invalid voice ID').optional(),
      preferredLanguage: z.string()
        .min(2, 'Language code must be at least 2 characters')
        .max(10, 'Language code must not exceed 10 characters')
        .optional(),
      responseFormat: z.enum(['text', 'voice', 'both'])
        .default('text'),
      maxTokens: z.number()
        .int('Token limit must be a whole number')
        .min(50, 'Token limit must be at least 50')
        .max(4000, 'Token limit cannot exceed 4000')
        .optional(),
      temperature: z.number()
        .min(0, 'Temperature must be between 0 and 1')
        .max(1, 'Temperature must be between 0 and 1')
        .optional()
    })
  }),
  aiController.updatePreferences
);

// Feedback
router.post('/feedback',
  validateRequest({
    body: z.object({
      messageId: idSchema,
      rating: z.number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
      feedback: z.string()
        .max(1000, 'Feedback must not exceed 1000 characters')
        .optional(),
      category: z.enum([
        'accuracy',
        'helpfulness',
        'appropriateness',
        'clarity',
        'other'
      ]).optional(),
      tags: z.array(z.string()
        .min(2, 'Tag must be at least 2 characters')
        .max(30, 'Tag must not exceed 30 characters'))
        .max(5, 'Cannot have more than 5 tags')
        .optional()
    })
  }),
  aiController.submitFeedback
);

// Audio recording upload for transcription
router.post('/transcribe',
  validateFileUpload(
    ['audio/wav', 'audio/mpeg', 'audio/webm'],
    10 * 1024 * 1024 // 10MB
  ),
  aiController.transcribeAudio
);

export default router;