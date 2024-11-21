import { Router } from 'express';
import { z } from 'zod';
import { ActivityController } from '../controllers/activity';
import { AuthMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { validateAndSanitize } from '../validation/middleware';
import { activitySchema, activityLogSchema } from '../validation/schemas';

const router = Router();
const activityController = new ActivityController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication and rate limiting
router.use(authMiddleware.authenticate);
router.use(apiLimiter);

// Activity management
router.post(
  '/',
  authMiddleware.requireRole(['professional']),
  validateAndSanitize(activitySchema, ['name', 'description', 'materials_needed', 'skills_developed']),
  activityController.createActivity
);

// Activity suggestions
router.get(
  '/child/:childId/suggestions',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  activityController.generateSuggestions
);

// Activity scheduling and tracking
router.get(
  '/child/:childId',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  activityController.getActivitiesForChild
);

router.get(
  '/child/:childId/upcoming',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  activityController.getUpcomingActivities
);

router.get(
  '/child/:childId/completed',
  validateAndSanitize(z.object({
    params: z.object({
      childId: z.string().uuid()
    })
  })),
  activityController.getCompletedActivities
);

router.post(
  '/schedule',
  validateAndSanitize(z.object({
    body: z.object({
      child_id: z.string().uuid(),
      activity_id: z.string().uuid(),
      scheduled_for: z.string().datetime(),
      notes: z.string().optional()
    })
  }), ['notes']),
  activityController.scheduleActivity
);

router.put(
  '/log/:logId',
  validateAndSanitize(z.object({
    params: z.object({
      logId: z.string().uuid()
    }),
    body: activityLogSchema
  }), ['notes']),
  activityController.updateActivityLog
);

export default router;