import { Router } from 'express';
import { AIAssistantController } from '../controllers/ai-assistant';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const aiController = new AIAssistantController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Process a message and get AI response
router.post('/message', aiController.processMessage);

export default router;