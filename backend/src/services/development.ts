import { DatabaseService } from './database';
import { AIAssistantService } from './ai-assistant';
import { Milestone } from '../types/database';

interface CreateMilestoneData {
  name: string;
  description: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  category: string;
  importance: number;
}

interface TrackMilestoneData {
  childId: string;
  milestoneId: string;
  achievedAt?: Date;
  notes?: string;
}

export class DevelopmentService {
  private db: DatabaseService;
  private aiService: AIAssistantService;

  constructor() {
    this.db = new DatabaseService();
    this.aiService = new AIAssistantService();
  }

  /**
   * Create a new milestone
   * Only professionals can create milestones
   */
  async createMilestone(data: CreateMilestoneData): Promise<Milestone> {
    return this.db.createMilestone({
      name: data.name,
      description: data.description,
      min_age_months: data.minAgeMonths,
      max_age_months: data.maxAgeMonths,
      category: data.category,
      importance: data.importance,
    });
  }

  /**
   * Get milestones suitable for a child's age
   * Optionally filtered by category
   */
  async getMilestonesForChild(childId: string, category?: string): Promise<Milestone[]> {
    // Get child's age
    const child = await this.db.getChildById(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    // Calculate age in months
    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    );

    // Get milestones suitable for the child's age
    const milestones = await this.db.getMilestonesByAgeRange(
      Math.max(0, ageInMonths - 3), // Include milestones slightly below age
      ageInMonths + 3 // Include milestones slightly above age
    );

    // Filter by category if provided
    return category
      ? milestones.filter((milestone) => milestone.category === category)
      : milestones;
  }

  /**
   * Track a milestone achievement for a child
   */
  async trackMilestone(data: TrackMilestoneData) {
    // Verify child exists
    const child = await this.db.getChildById(data.childId);
    if (!child) {
      throw new Error('Child not found');
    }

    // Verify milestone exists and is age-appropriate
    const milestone = await this.db.getMilestoneById(data.milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    );

    if (
      ageInMonths < milestone.min_age_months - 3 ||
      ageInMonths > milestone.max_age_months + 3
    ) {
      throw new Error('Milestone not suitable for child\'s age');
    }

    // Create or update milestone tracking
    const tracking = await this.db.createMilestoneTracking({
      child_id: data.childId,
      milestone_id: data.milestoneId,
      achieved_at: data.achievedAt?.toISOString(),
      notes: data.notes,
    });

    // Get AI feedback and suggestions
    if (data.achievedAt) {
      const feedback = await this.aiService.processMessage(
        child.user_id,
        child.id,
        `The milestone "${milestone.name}" was achieved. ${
          data.notes ? `Notes: ${data.notes}` : ''
        } Please provide feedback and suggestions for next developmental goals.`
      );

      // Update tracking with AI feedback
      await this.db.updateMilestoneTracking(tracking.id, {
        notes: data.notes 
          ? `${data.notes}\n\nAI Feedback: ${feedback.text}`
          : `AI Feedback: ${feedback.text}`,
      });
    }

    return tracking;
  }

  /**
   * Get achieved milestones for a child
   */
  async getAchievedMilestones(childId: string) {
    return this.db.getAchievedMilestonesByChildId(childId);
  }

  /**
   * Get upcoming milestones for a child
   */
  async getUpcomingMilestones(childId: string) {
    return this.db.getUpcomingMilestonesByChildId(childId);
  }

  /**
   * Generate a development report for a child
   */
  async generateDevelopmentReport(childId: string): Promise<string> {
    const child = await this.db.getChildById(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    // Get all milestone data
    const [achieved, upcoming] = await Promise.all([
      this.getAchievedMilestones(childId),
      this.getUpcomingMilestones(childId),
    ]);

    // Generate prompt for AI
    const prompt = `Please generate a comprehensive development report for a child who is ${
      Math.floor(
        (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 30.44)
      )
    } months old.

Achieved Milestones:
${achieved
  .map(
    (t) =>
      `- ${t.milestone.name} (${t.milestone.category}) - Achieved on ${
        new Date(t.achieved_at!).toLocaleDateString()
      }`
  )
  .join('\n')}

Upcoming Milestones:
${upcoming
  .map((m) => `- ${m.name} (${m.category})`)
  .join('\n')}

Please include:
1. Overall development assessment
2. Areas of strength
3. Areas for focus
4. Recommendations for parents
5. When to consult healthcare providers`;

    // Get AI report
    const response = await this.aiService.processMessage(
      child.user_id,
      childId,
      prompt
    );

    return response.text;
  }

  /**
   * Get development statistics for a child
   */
  async getDevelopmentStats(childId: string) {
    const child = await this.db.getChildById(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    );

    const [achieved, total] = await Promise.all([
      this.db.getAchievedMilestoneCount(childId),
      this.db.getTotalMilestoneCount(ageInMonths),
    ]);

    const categories = await this.db.getMilestoneCategories();
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const [categoryAchieved, categoryTotal] = await Promise.all([
          this.db.getAchievedMilestoneCountByCategory(childId, category),
          this.db.getTotalMilestoneCountByCategory(ageInMonths, category),
        ]);

        return {
          category,
          achieved: categoryAchieved,
          total: categoryTotal,
          percentage: Math.round((categoryAchieved / categoryTotal) * 100),
        };
      })
    );

    return {
      overall: {
        achieved,
        total,
        percentage: Math.round((achieved / total) * 100),
      },
      categories: categoryStats,
    };
  }
}