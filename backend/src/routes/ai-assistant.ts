import { Router } from 'express';
import { AIAssistantController } from '../controllers/ai-assistant';
import { AuthMiddleware } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();
const aiController = new AIAssistantController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Process a message and get AI response (with rate limiting)
router.post('/message', aiLimiter, aiController.processMessage);

export default router;