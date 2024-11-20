import { Router } from 'express';
import { DevelopmentController } from '../controllers/development';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const developmentController = new DevelopmentController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Milestone management
router.post(
  '/milestones',
  authMiddleware.requireRole(['professional']),
  developmentController.createMilestone
);

// Child development tracking
router.get(
  '/child/:childId/milestones',
  developmentController.getMilestonesForChild
);

router.get(
  '/child/:childId/milestones/achieved',
  developmentController.getAchievedMilestones
);

router.get(
  '/child/:childId/milestones/upcoming',
  developmentController.getUpcomingMilestones
);

router.post(
  '/milestones/track',
  developmentController.trackMilestone
);

// Development reports and stats
router.get(
  '/child/:childId/report',
  developmentController.generateReport
);

router.get(
  '/child/:childId/stats',
  developmentController.getDevelopmentStats
);

export default router;