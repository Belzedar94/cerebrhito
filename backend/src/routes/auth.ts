import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { AuthMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes with strict rate limiting
router.post('/signup', authLimiter, authController.signUp);
router.post('/signin', authLimiter, authController.signIn);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes with standard rate limiting
router.post('/signout', authMiddleware.authenticate, authController.signOut);
router.put('/password', authMiddleware.authenticate, authController.updatePassword);

export default router;