import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth';
import { AuthMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import {
  signUpSchema,
  signInSchema,
  updatePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
  idSchema,
} from '../validation/schemas';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes with strict rate limiting and validation
router.post(
  '/signup',
  authLimiter,
  validateRequest({
    body: signUpSchema,
  }),
  authController.signUp
);

router.post(
  '/signin',
  authLimiter,
  validateRequest({
    body: signInSchema,
  }),
  authController.signIn
);

router.post(
  '/refresh-token',
  authLimiter,
  validateRequest({
    body: refreshTokenSchema,
  }),
  authController.refreshToken
);

router.post(
  '/reset-password/request',
  authLimiter,
  validateRequest({
    body: resetPasswordRequestSchema,
  }),
  authController.requestPasswordReset
);

router.post(
  '/reset-password/confirm',
  authLimiter,
  validateRequest({
    body: resetPasswordSchema,
  }),
  authController.confirmPasswordReset
);

// Protected routes with standard rate limiting and validation
router.post('/signout', authMiddleware.authenticate, authController.signOut);

router.put(
  '/password',
  authMiddleware.authenticate,
  validateRequest({
    body: updatePasswordSchema,
  }),
  authController.updatePassword
);

router.get('/profile', authMiddleware.authenticate, authController.getProfile);

router.put(
  '/profile',
  authMiddleware.authenticate,
  validateRequest({
    body: updateProfileSchema,
  }),
  authController.updateProfile
);

// Professional-specific routes
router.get(
  '/professionals',
  authMiddleware.authenticate,
  authMiddleware.requireRole('parent'),
  authController.listProfessionals
);

router.get(
  '/professionals/:professionalId',
  authMiddleware.authenticate,
  authMiddleware.requireRole('parent'),
  validateRequest({
    params: {
      professionalId: idSchema,
    },
  }),
  authController.getProfessionalProfile
);

// Session management
router.get('/sessions', authMiddleware.authenticate, authController.listActiveSessions);

router.post(
  '/sessions/revoke',
  authMiddleware.authenticate,
  validateRequest({
    body: z.object({
      sessionId: z.string().uuid('Invalid session ID'),
    }),
  }),
  authController.revokeSession
);

router.post('/sessions/revoke-all', authMiddleware.authenticate, authController.revokeAllSessions);

export default router;
