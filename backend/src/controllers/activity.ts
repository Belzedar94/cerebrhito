import type { Request, Response } from 'express';
import { z } from 'zod';
import { ActivityService } from '../services/activity';
import { ActivityStatus } from '../types/database';

// Validation schemas
const createActivitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  minAgeMonths: z.number().min(0),
  maxAgeMonths: z.number().min(0),
  durationMinutes: z.number().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
});

const scheduleActivitySchema = z.object({
  childId: z.string().uuid(),
  activityId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
  notes: z.string().optional(),
});

const updateActivityLogSchema = z.object({
  status: z.enum(['pending', 'completed', 'skipped'] as const),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  durationMinutes: z.number().min(1).optional(),
});

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  /**
   * Create a new activity
   * Only admins can create non-AI-generated activities
   */
  createActivity = async (req: Request, res: Response) => {
    try {
      // Verify admin role for non-AI-generated activities
      if (!req.body.aiGenerated && req.user?.role !== 'professional') {
        return res.status(403).json({ message: 'Only professionals can create activities' });
      }

      const validatedData = createActivitySchema.parse(req.body);
      const activity = await this.activityService.createActivity({
        ...validatedData,
        aiGenerated: req.body.aiGenerated ?? false,
      });

      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        console.error('Activity creation error:', error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };

  /**
   * Get activities suitable for a child
   */
  getActivitiesForChild = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const { category, tags } = req.query;

      const activities = await this.activityService.getActivitiesForChild(
        childId,
        category as string | undefined,
        Array.isArray(tags) ? (tags as string[]) : undefined
      );

      res.json(activities);
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Schedule an activity for a child
   */
  scheduleActivity = async (req: Request, res: Response) => {
    try {
      const validatedData = scheduleActivitySchema.parse(req.body);
      const activityLog = await this.activityService.scheduleActivity({
        ...validatedData,
        scheduledFor: new Date(validatedData.scheduledFor),
      });

      res.status(201).json(activityLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        console.error('Activity scheduling error:', error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };

  /**
   * Update an activity log (mark as completed, skipped, etc.)
   */
  updateActivityLog = async (req: Request, res: Response) => {
    try {
      const { logId } = req.params;
      const validatedData = updateActivityLogSchema.parse(req.body);

      const activityLog = await this.activityService.updateActivityLog(logId, {
        ...validatedData,
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : undefined,
      });

      res.json(activityLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        console.error('Activity log update error:', error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };

  /**
   * Get upcoming activities for a child
   */
  getUpcomingActivities = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const activities = await this.activityService.getUpcomingActivities(childId);

      res.json(activities);
    } catch (error) {
      console.error('Get upcoming activities error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Get completed activities for a child
   */
  getCompletedActivities = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const activities = await this.activityService.getCompletedActivities(childId);

      res.json(activities);
    } catch (error) {
      console.error('Get completed activities error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Generate activity suggestions for a child using AI
   */
  generateSuggestions = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const suggestions = await this.activityService.generateActivitySuggestions(childId);

      res.json(suggestions);
    } catch (error) {
      console.error('Generate suggestions error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };
}
