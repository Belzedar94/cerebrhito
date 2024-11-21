import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { AuthMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../validation/middleware';
import { signUpSchema, signInSchema, updatePasswordSchema } from '../validation/schemas';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes with strict rate limiting and validation
router.post('/signup',
  authLimiter,
  validateRequest(signUpSchema),
  authController.signUp
);

router.post('/signin',
  authLimiter,
  validateRequest(signInSchema),
  authController.signIn
);

router.post('/reset-password',
  authLimiter,
  validateRequest(signInSchema),
  authController.resetPassword
);

// Protected routes with standard rate limiting and validation
router.post('/signout',
  authMiddleware.authenticate,
  authController.signOut
);

router.put('/password',
  authMiddleware.authenticate,
  validateRequest(updatePasswordSchema),
  authController.updatePassword
);

export default router;