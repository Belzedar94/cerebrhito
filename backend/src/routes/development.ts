import { Router } from 'express';
import { z } from 'zod';
import { DevelopmentController } from '../controllers/development';
import { AuthMiddleware } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import {
  validateRequest,
  validateFileUpload,
  validatePagination,
  validateSort,
} from '../middleware/validation';
import {
  milestoneSchema,
  milestoneTrackingSchema,
  updateMilestoneSchema,
  developmentAreaSchema,
  idSchema,
  dateSchema,
  paginationSchema,
  sortSchema,
  MAX_FILE_SIZE,
  MAX_AGE_MONTHS,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from '../validation/schemas';

const router = Router();
const developmentController = new DevelopmentController();
const authMiddleware = new AuthMiddleware();

// All routes require authentication and rate limiting
router.use(authMiddleware.authenticate);
router.use(apiLimiter);

// Development Areas
router.get(
  '/areas',
  validateRequest({
    query: z.object({
      ...paginationSchema.shape,
      ...sortSchema.shape,
    }),
  }),
  validatePagination(),
  validateSort(['name', 'order']),
  developmentController.listDevelopmentAreas
);

router.post(
  '/areas',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    body: developmentAreaSchema,
  }),
  developmentController.createDevelopmentArea
);

router.put(
  '/areas/:areaId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      areaId: idSchema,
    }),
    body: developmentAreaSchema.partial().refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
  }),
  developmentController.updateDevelopmentArea
);

// Milestone management
router.get(
  '/milestones',
  validateRequest({
    query: z.object({
      area: idSchema.optional(),
      minAge: z.number().int().min(0).max(MAX_AGE_MONTHS).optional(),
      maxAge: z.number().int().min(0).max(MAX_AGE_MONTHS).optional(),
      category: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      search: z.string().optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape,
    }),
  }),
  validatePagination(),
  validateSort(['name', 'createdAt', 'category', 'minAge']),
  developmentController.listMilestones
);

router.post(
  '/milestones',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    body: milestoneSchema,
  }),
  developmentController.createMilestone
);

router.get(
  '/milestones/:milestoneId',
  validateRequest({
    params: z.object({
      milestoneId: idSchema,
    }),
  }),
  developmentController.getMilestone
);

router.put(
  '/milestones/:milestoneId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      milestoneId: idSchema,
    }),
    body: updateMilestoneSchema,
  }),
  developmentController.updateMilestone
);

router.delete(
  '/milestones/:milestoneId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      milestoneId: idSchema,
    }),
  }),
  developmentController.deleteMilestone
);

// Milestone media
router.post(
  '/milestones/:milestoneId/media',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      milestoneId: idSchema,
    }),
  }),
  validateFileUpload(
    [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES],
    MAX_FILE_SIZE
  ),
  developmentController.uploadMilestoneMedia
);

router.delete(
  '/milestones/:milestoneId/media/:mediaId',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      milestoneId: idSchema,
      mediaId: idSchema,
    }),
  }),
  developmentController.deleteMilestoneMedia
);

// Child development tracking
router.get(
  '/child/:childId/milestones',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      area: idSchema.optional(),
      status: z.enum(['not_started', 'in_progress', 'achieved', 'skipped']).optional(),
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape,
    }),
  }),
  validatePagination(),
  validateSort(['achievedAt', 'status', 'minAge']),
  developmentController.getMilestonesForChild
);

router.get(
  '/child/:childId/milestones/achieved',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      area: idSchema.optional(),
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape,
    }),
  }),
  validatePagination(),
  validateSort(['achievedAt', 'minAge']),
  developmentController.getAchievedMilestones
);

router.get(
  '/child/:childId/milestones/upcoming',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      area: idSchema.optional(),
      timeframe: z.number().int().min(1).max(12).default(3), // months
      ...paginationSchema.shape,
      ...sortSchema.shape,
    }),
  }),
  validatePagination(),
  validateSort(['minAge', 'category']),
  developmentController.getUpcomingMilestones
);

router.post(
  '/milestones/track',
  validateRequest({
    body: milestoneTrackingSchema,
  }),
  developmentController.trackMilestone
);

router.put(
  '/milestones/track/:trackingId',
  validateRequest({
    params: z.object({
      trackingId: idSchema,
    }),
    body: milestoneTrackingSchema
      .partial()
      .extend({
        last_modified_by: idSchema,
      })
      .refine(data => Object.keys(data).length > 1, {
        message: 'At least one field must be provided for update',
      }),
  }),
  developmentController.updateMilestoneTracking
);

// Development reports and stats
router.get(
  '/child/:childId/report',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      areas: z.array(idSchema).optional(),
      format: z.enum(['json', 'pdf', 'csv']).default('json'),
    }),
  }),
  developmentController.generateReport
);

router.get(
  '/child/:childId/stats',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      areas: z.array(idSchema).optional(),
    }),
  }),
  developmentController.getDevelopmentStats
);

// Development insights
router.get(
  '/child/:childId/insights',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      area: idSchema.optional(),
      timeframe: z.number().int().min(1).max(12).default(3), // months
      ...paginationSchema.shape,
    }),
  }),
  validatePagination(),
  developmentController.getDevelopmentInsights
);

// Professional observations
router.post(
  '/child/:childId/observations',
  authMiddleware.requireRole(['professional']),
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    body: z.object({
      area: idSchema,
      observation: z
        .string()
        .min(10, 'Observation must be at least 10 characters')
        .max(2000, 'Observation must not exceed 2000 characters'),
      recommendations: z
        .string()
        .max(2000, 'Recommendations must not exceed 2000 characters')
        .optional(),
      follow_up_required: z.boolean().optional(),
      follow_up_date: dateSchema.optional(),
      media: z
        .array(
          z.object({
            type: z.enum(['image', 'video', 'document']),
            url: z.string().url(),
            title: z
              .string()
              .min(2, 'Media title must be at least 2 characters')
              .max(100, 'Media title must not exceed 100 characters'),
            description: z
              .string()
              .max(500, 'Media description must not exceed 500 characters')
              .optional(),
          })
        )
        .max(5, 'Cannot have more than 5 media items')
        .optional(),
    }),
  }),
  developmentController.addProfessionalObservation
);

router.get(
  '/child/:childId/observations',
  validateRequest({
    params: z.object({
      childId: idSchema,
    }),
    query: z.object({
      area: idSchema.optional(),
      professionalId: idSchema.optional(),
      startDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      followUpRequired: z.boolean().optional(),
      ...paginationSchema.shape,
      ...sortSchema.shape,
    }),
  }),
  validatePagination(),
  validateSort(['createdAt', 'followUpDate']),
  developmentController.getProfessionalObservations
);

export default router;
