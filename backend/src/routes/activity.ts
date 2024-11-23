import { Router } from 'express';
import { z } from 'zod';
import { ActivityController } from '../controllers/activity';
import { AuthMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { validateRequest, validateFileUpload, validatePagination, validateSort } from '../middleware/validation';
import {
  activitySchema,
  activityLogSchema,
  updateActivitySchema,
  idSchema,
  dateSchema,
  paginationSchema,
  sortSchema,
  MAX_AGE_MONTHS,
  MAX_ACTIVITY_DURATION,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES
} from '../validation/schemas';

const router = Router();
const activityController = new ActivityController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication and rate limiting
router.use(authMiddleware.authenticate);
router.use(apiLimiter);

// Activity management
router.post('/',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    body: activitySchema
  }),
  activityController.createActivity
);

router.get('/',
  validateRequest({
    query: z.object({
      category: z.string().optional(),
      minAge: z.number().int().min(0).max(MAX_AGE_MONTHS).optional(),
      maxAge: z.number().int().min(0).max(MAX_AGE_MONTHS).optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      indoor: z.boolean().optional(),
      skills: z.array(z.string()).optional(),
      search: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      createdBy: idSchema.optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape
    })
  }),
  validatePagination(),
  validateSort(['name', 'createdAt', 'category', 'difficulty']),
  activityController.listActivities
);

router.get('/:activityId',
  validateRequest({
    params: z.object({
      activityId: idSchema
    })
  }),
  activityController.getActivity
);

router.put('/:activityId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      activityId: idSchema
    }),
    body: updateActivitySchema
  }),
  activityController.updateActivity
);

router.delete('/:activityId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      activityId: idSchema
    })
  }),
  activityController.deleteActivity
);

// Activity media
router.post('/:activityId/media',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      activityId: idSchema
    })
  }),
  validateFileUpload(
    [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES],
    MAX_FILE_SIZE
  ),
  activityController.uploadActivityMedia
);

router.delete('/:activityId/media/:mediaId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      activityId: idSchema,
      mediaId: idSchema
    })
  }),
  activityController.deleteActivityMedia
);

// Activity suggestions
router.get('/child/:childId/suggestions',
  validateRequest({
    params: z.object({
      childId: idSchema
    }),
    query: z.object({
      category: z.string().optional(),
      includeCompleted: z.boolean().optional(),
      limit: z.number().int().min(1).max(20).default(10)
    })
  }),
  activityController.generateSuggestions
);

// Activity scheduling and tracking
router.get('/child/:childId',
  validateRequest({
    params: z.object({
      childId: idSchema
    }),
    query: z.object({
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape
    })
  }),
  validatePagination(),
  validateSort(['scheduledFor', 'completedAt', 'status']),
  activityController.getActivitiesForChild
);

router.get('/child/:childId/upcoming',
  validateRequest({
    params: z.object({
      childId: idSchema
    }),
    query: z.object({
      days: z.number().int().min(1).max(30).default(7),
      ...paginationSchema.shape
    })
  }),
  validatePagination(),
  activityController.getUpcomingActivities
);

router.get('/child/:childId/completed',
  validateRequest({
    params: z.object({
      childId: idSchema
    }),
    query: z.object({
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape
    })
  }),
  validatePagination(),
  validateSort(['completedAt', 'enjoymentLevel', 'difficultyLevel']),
  activityController.getCompletedActivities
);

router.post('/schedule',
  validateRequest({
    body: z.object({
      child_id: idSchema,
      activity_id: idSchema,
      scheduled_for: dateSchema,
      duration_minutes: z.number()
        .int('Duration must be a whole number')
        .min(1, 'Duration must be at least 1 minute')
        .max(MAX_ACTIVITY_DURATION, 'Duration cannot exceed 8 hours'),
      notes: z.string()
        .max(1000, 'Notes must not exceed 1000 characters')
        .optional(),
      reminders: z.array(z.object({
        type: z.enum(['email', 'push', 'sms']),
        minutes_before: z.number()
          .int('Reminder time must be a whole number')
          .min(0, 'Reminder time cannot be negative')
          .max(10080) // 1 week in minutes
      }))
        .max(5, 'Cannot have more than 5 reminders')
        .optional()
    })
  }),
  activityController.scheduleActivity
);

router.put('/schedule/:scheduleId',
  validateRequest({
    params: z.object({
      scheduleId: idSchema
    }),
    body: z.object({
      scheduled_for: dateSchema.optional(),
      duration_minutes: z.number()
        .int('Duration must be a whole number')
        .min(1, 'Duration must be at least 1 minute')
        .max(MAX_ACTIVITY_DURATION, 'Duration cannot exceed 8 hours')
        .optional(),
      notes: z.string()
        .max(1000, 'Notes must not exceed 1000 characters')
        .optional(),
      status: z.enum(['scheduled', 'cancelled']).optional(),
      reminders: z.array(z.object({
        type: z.enum(['email', 'push', 'sms']),
        minutes_before: z.number()
          .int('Reminder time must be a whole number')
          .min(0, 'Reminder time cannot be negative')
          .max(10080) // 1 week in minutes
      }))
        .max(5, 'Cannot have more than 5 reminders')
        .optional()
    }).refine(
      data => Object.keys(data).length > 0,
      {
        message: 'At least one field must be provided for update'
      }
    )
  }),
  activityController.updateScheduledActivity
);

router.post('/log',
  validateRequest({
    body: activityLogSchema
  }),
  activityController.createActivityLog
);

router.put('/log/:logId',
  validateRequest({
    params: z.object({
      logId: idSchema
    }),
    body: activityLogSchema.partial().extend({
      last_modified_by: idSchema
    }).refine(
      data => Object.keys(data).length > 1,
      {
        message: 'At least one field must be provided for update'
      }
    )
  }),
  activityController.updateActivityLog
);

router.delete('/log/:logId',
  validateRequest({
    params: z.object({
      logId: idSchema
    })
  }),
  activityController.deleteActivityLog
);

// Activity media for logs
router.post('/log/:logId/media',
  validateRequest({
    params: z.object({
      logId: idSchema
    })
  }),
  validateFileUpload(
    [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
    MAX_FILE_SIZE
  ),
  activityController.uploadLogMedia
);

router.delete('/log/:logId/media/:mediaId',
  validateRequest({
    params: z.object({
      logId: idSchema,
      mediaId: idSchema
    })
  }),
  activityController.deleteLogMedia
);

export default router;