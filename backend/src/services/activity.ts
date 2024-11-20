import { DatabaseService } from './database';
import { Activity, ActivityLog, ActivityStatus } from '../types/database';
import { AIAssistantService } from './ai-assistant';

interface CreateActivityData {
  name: string;
  description: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  durationMinutes: number;
  category: string;
  tags: string[];
  aiGenerated?: boolean;
}

interface ScheduleActivityData {
  childId: string;
  activityId: string;
  scheduledFor: Date;
  notes?: string;
}

interface UpdateActivityLogData {
  status: ActivityStatus;
  completedAt?: Date;
  notes?: string;
  durationMinutes?: number;
}

export class ActivityService {
  private db: DatabaseService;
  private aiService: AIAssistantService;

  constructor() {
    this.db = new DatabaseService();
    this.aiService = new AIAssistantService();
  }

  /**
   * Create a new activity
   * Only admins can create non-AI-generated activities
   */
  async createActivity(data: CreateActivityData): Promise<Activity> {
    return this.db.createActivity({
      name: data.name,
      description: data.description,
      min_age_months: data.minAgeMonths,
      max_age_months: data.maxAgeMonths,
      duration_minutes: data.durationMinutes,
      category: data.category,
      tags: data.tags,
      ai_generated: data.aiGenerated ?? false,
    });
  }

  /**
   * Get activities suitable for a child's age
   * Optionally filtered by category and tags
   */
  async getActivitiesForChild(childId: string, category?: string, tags?: string[]): Promise<Activity[]> {
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

    // Get activities suitable for the child's age
    const activities = await this.db.getActivitiesByAgeRange(
      Math.max(0, ageInMonths - 3), // Include activities slightly below age
      ageInMonths + 3 // Include activities slightly above age
    );

    // Filter by category and tags if provided
    return activities.filter((activity) => {
      if (category && activity.category !== category) {
        return false;
      }
      if (tags && !tags.every((tag) => activity.tags.includes(tag))) {
        return false;
      }
      return true;
    });
  }

  /**
   * Schedule an activity for a child
   */
  async scheduleActivity(data: ScheduleActivityData): Promise<ActivityLog> {
    // Verify child exists
    const child = await this.db.getChildById(data.childId);
    if (!child) {
      throw new Error('Child not found');
    }

    // Verify activity exists and is age-appropriate
    const activity = await this.db.getActivityById(data.activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    const ageInMonths = Math.floor(
      (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
    );

    if (
      ageInMonths < activity.min_age_months - 3 ||
      ageInMonths > activity.max_age_months + 3
    ) {
      throw new Error('Activity not suitable for child\'s age');
    }

    // Create activity log
    return this.db.createActivityLog({
      child_id: data.childId,
      activity_id: data.activityId,
      status: 'pending',
      scheduled_for: data.scheduledFor.toISOString(),
      notes: data.notes,
      completed_at: null,
      duration_minutes: null,
    });
  }

  /**
   * Update an activity log (mark as completed, skipped, etc.)
   */
  async updateActivityLog(logId: string, data: UpdateActivityLogData): Promise<ActivityLog> {
    const log = await this.db.getActivityLogById(logId);
    if (!log) {
      throw new Error('Activity log not found');
    }

    // Update log
    const updatedLog = await this.db.updateActivityLog(logId, {
      status: data.status,
      completed_at: data.completedAt?.toISOString(),
      notes: data.notes,
      duration_minutes: data.durationMinutes,
    });

    // If completed, get AI feedback and suggestions
    if (data.status === 'completed') {
      const activity = await this.db.getActivityById(log.activity_id);
      const child = await this.db.getChildById(log.child_id);
      
      if (activity && child) {
        const feedback = await this.aiService.processMessage(
          child.user_id,
          child.id,
          `The activity "${activity.name}" was completed in ${data.durationMinutes} minutes. ${
            data.notes ? `Notes: ${data.notes}` : ''
          } Please provide feedback and suggestions for future activities.`
        );

        // Update log with AI feedback
        await this.db.updateActivityLog(logId, {
          notes: data.notes 
            ? `${data.notes}\n\nAI Feedback: ${feedback.text}`
            : `AI Feedback: ${feedback.text}`,
        });
      }
    }

    return updatedLog;
  }

  /**
   * Get upcoming activities for a child
   */
  async getUpcomingActivities(childId: string): Promise<ActivityLog[]> {
    return this.db.getUpcomingActivitiesByChildId(childId);
  }

  /**
   * Get completed activities for a child
   */
  async getCompletedActivities(childId: string): Promise<ActivityLog[]> {
    return this.db.getCompletedActivitiesByChildId(childId);
  }

  /**
   * Generate activity suggestions for a child using AI
   */
  async generateActivitySuggestions(childId: string): Promise<Activity[]> {
    const child = await this.db.getChildById(childId);
    if (!child) {
      throw new Error('Child not found');
    }

    // Get recent activities
    const recentActivities = await this.db.getRecentActivitiesByChildId(childId, 5);

    // Generate prompt for AI
    const prompt = `Please suggest 3 new age-appropriate activities for a child who is ${
      Math.floor(
        (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 30.44)
      )
    } months old. ${
      recentActivities.length > 0
        ? `Recent activities: ${recentActivities
            .map((log) => log.activity.name)
            .join(', ')}`
        : ''
    }

For each activity, provide:
1. Name
2. Description
3. Duration in minutes
4. Category (e.g., motor skills, cognitive, social, language)
5. Tags (comma-separated)

Format the response as a JSON array.`;

    // Get AI suggestions
    const response = await this.aiService.processMessage(child.user_id, childId, prompt);

    try {
      const suggestions = JSON.parse(response.text);
      const activities: Activity[] = [];

      // Create activities from suggestions
      for (const suggestion of suggestions) {
        const activity = await this.createActivity({
          name: suggestion.name,
          description: suggestion.description,
          minAgeMonths: Math.max(0, child.age_months - 3),
          maxAgeMonths: child.age_months + 3,
          durationMinutes: suggestion.duration,
          category: suggestion.category,
          tags: suggestion.tags.split(',').map((t: string) => t.trim()),
          aiGenerated: true,
        });
        activities.push(activity);
      }

      return activities;
    } catch (error) {
      console.error('Failed to parse AI suggestions:', error);
      throw new Error('Failed to generate activity suggestions');
    }
  }
}