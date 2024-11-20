import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/signout', authMiddleware.authenticate, authController.signOut);
router.put('/password', authMiddleware.authenticate, authController.updatePassword);

export default router;