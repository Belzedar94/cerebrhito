import { Router } from 'express';
import { AIAssistantController } from '../controllers/ai-assistant';
import { AuthMiddleware } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { validateAndSanitize } from '../validation/middleware';
import { aiMessageSchema } from '../validation/schemas';

const router = Router();
const aiController = new AIAssistantController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Process a message and get AI response (with rate limiting and validation)
router.post('/message',
  aiLimiter,
  validateAndSanitize(aiMessageSchema, ['message', 'context.specific_concern']),
  aiController.processMessage
);

export default router;