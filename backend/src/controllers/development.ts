import type { Request, Response } from 'express';
import { z } from 'zod';
import { DevelopmentService } from '../services/development';

// Validation schemas
const createMilestoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  minAgeMonths: z.number().min(0),
  maxAgeMonths: z.number().min(0),
  category: z.string().min(1),
  importance: z.number().min(1).max(5),
});

const trackMilestoneSchema = z.object({
  childId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  achievedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export class DevelopmentController {
  private developmentService: DevelopmentService;

  constructor() {
    this.developmentService = new DevelopmentService();
  }

  /**
   * Create a new milestone
   * Only professionals can create milestones
   */
  createMilestone = async (req: Request, res: Response) => {
    try {
      // Verify professional role
      if (req.user?.role !== 'professional') {
        return res.status(403).json({ message: 'Only professionals can create milestones' });
      }

      const validatedData = createMilestoneSchema.parse(req.body);
      const milestone = await this.developmentService.createMilestone(validatedData);

      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        console.error('Milestone creation error:', error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };

  /**
   * Get milestones suitable for a child
   */
  getMilestonesForChild = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const { category } = req.query;

      const milestones = await this.developmentService.getMilestonesForChild(
        childId,
        category as string | undefined
      );

      res.json(milestones);
    } catch (error) {
      console.error('Get milestones error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Track a milestone achievement
   */
  trackMilestone = async (req: Request, res: Response) => {
    try {
      const validatedData = trackMilestoneSchema.parse(req.body);
      const tracking = await this.developmentService.trackMilestone({
        ...validatedData,
        achievedAt: validatedData.achievedAt ? new Date(validatedData.achievedAt) : undefined,
      });

      res.status(201).json(tracking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        console.error('Milestone tracking error:', error);
        res.status(500).json({ message: (error as Error).message });
      }
    }
  };

  /**
   * Get achieved milestones for a child
   */
  getAchievedMilestones = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const milestones = await this.developmentService.getAchievedMilestones(childId);

      res.json(milestones);
    } catch (error) {
      console.error('Get achieved milestones error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Get upcoming milestones for a child
   */
  getUpcomingMilestones = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const milestones = await this.developmentService.getUpcomingMilestones(childId);

      res.json(milestones);
    } catch (error) {
      console.error('Get upcoming milestones error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Generate a development report for a child
   */
  generateReport = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const report = await this.developmentService.generateDevelopmentReport(childId);

      res.json({ report });
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };

  /**
   * Get development statistics for a child
   */
  getDevelopmentStats = async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const stats = await this.developmentService.getDevelopmentStats(childId);

      res.json(stats);
    } catch (error) {
      console.error('Get development stats error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  };
}
