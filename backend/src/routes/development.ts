import { Router } from 'express';
import { z } from 'zod';
import { DevelopmentController } from '../controllers/development';
import { AuthMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { validateAndSanitize } from '../validation/middleware';
import { milestoneSchema, milestoneTrackingSchema } from '../validation/schemas';

const router = Router();
const developmentController = new DevelopmentController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication and rate limiting
router.use(authMiddleware.authenticate);
router.use(apiLimiter);

// Milestone management
router.post(
  '/milestones',
  authMiddleware.requireRole(['professional']),
  validateAndSanitize(milestoneSchema, [
    'name',
    'description',
    'indicators',
    'supporting_activities',
    'professional_notes'
  ]),
  developmentController.createMilestone
);

// Child development tracking
router.get(
  '/child/:childId/milestones',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  developmentController.getMilestonesForChild
);

router.get(
  '/child/:childId/milestones/achieved',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  developmentController.getAchievedMilestones
);

router.get(
  '/child/:childId/milestones/upcoming',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  developmentController.getUpcomingMilestones
);

router.post(
  '/milestones/track',
  validateAndSanitize(milestoneTrackingSchema, [
    'notes',
    'observed_indicators'
  ]),
  developmentController.trackMilestone
);

// Development reports and stats
router.get(
  '/child/:childId/report',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    }),
    query: z.object({
      start_date: z.string().datetime().optional(),
      end_date: z.string().datetime().optional()
    })
  })),
  developmentController.generateReport
);

router.get(
  '/child/:childId/stats',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    }),
    query: z.object({
      period: z.enum(['week', 'month', 'year']).optional()
    })
  })),
  developmentController.getDevelopmentStats
);

export default router;