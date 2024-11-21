import { Router } from 'express';
import { ActivityController } from '../controllers/activity';
import { AuthMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

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
  activityController.createActivity
);

// Activity suggestions
router.get(
  '/child/:childId/suggestions',
  activityController.generateSuggestions
);

// Activity scheduling and tracking
router.get(
  '/child/:childId',
  activityController.getActivitiesForChild
);

router.get(
  '/child/:childId/upcoming',
  activityController.getUpcomingActivities
);

router.get(
  '/child/:childId/completed',
  activityController.getCompletedActivities
);

router.post(
  '/schedule',
  activityController.scheduleActivity
);

router.put(
  '/log/:logId',
  activityController.updateActivityLog
);

export default router;