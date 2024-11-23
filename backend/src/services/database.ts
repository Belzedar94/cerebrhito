import { supabase } from '../config/supabase';
import type { IService } from './base';
import { logger } from '../utils/logger';
import type { CacheService } from './cache';
import type {
  User,
  Child,
  Activity,
  Milestone,
  ActivityLog,
  MilestoneTracking,
  Media,
  AIChatHistory,
  Notification,
} from '../types/database';

export class DatabaseService implements IService {
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
  }
  async init(): Promise<void> {
    try {
      const { data, error } = await supabase.from('users').select().limit(1);

      if (error) {
        throw error;
      }

      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // No need to dispose Supabase client
    logger.info('Database service disposed');
  }
  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('users').insert([userData]).select().single();

    if (error) {
      throw error;
    }

    return data;
  }

  async getUserById(id: string) {
    const cacheKey = this.cache.generateKey(['user', id]);
    const cached = await this.cache.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('users').select().eq('id', id).single();

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
    }

    return data;
  }

  async getUserByEmail(email: string) {
    const cacheKey = this.cache.generateKey(['user_email', email]);
    const cached = await this.cache.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('users').select().eq('email', email).single();

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      await this.cache.set(this.cache.generateKey(['user', data.id]), data, 300);
    }

    return data;
  }

  // Child operations
  async createChild(childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('children').insert([childData]).select().single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new child
      await this.cache.set(this.cache.generateKey(['child', data.id]), data, 300);
      // Invalidate the user's children list cache
      await this.cache.del(this.cache.generateKey(['user_children', childData.user_id]));
    }

    return data;
  }

  async getChildById(id: string) {
    const cacheKey = this.cache.generateKey(['child', id]);
    const cached = await this.cache.get<Child>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('children').select().eq('id', id).single();

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
    }

    return data;
  }

  async getChildrenByUserId(userId: string) {
    const cacheKey = this.cache.generateKey(['user_children', userId]);
    const cached = await this.cache.get<Child[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('children').select().eq('user_id', userId);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual children
      for (const child of data) {
        await this.cache.set(this.cache.generateKey(['child', child.id]), child, 300);
      }
    }

    return data;
  }

  // Activity operations
  async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new activity
      await this.cache.set(this.cache.generateKey(['activity', data.id]), data, 300);
      // Invalidate age range caches
      await this.cache.clearPattern('activities:age:*');
    }

    return data;
  }

  async getActivityById(id: string) {
    const cacheKey = this.cache.generateKey(['activity', id]);
    const cached = await this.cache.get<Activity>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('activities').select().eq('id', id).single();

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
    }

    return data;
  }

  async getActivitiesByAgeRange(minAge: number, maxAge: number) {
    const cacheKey = this.cache.generateKey(['activities', 'age', `${minAge}-${maxAge}`]);
    const cached = await this.cache.get<Activity[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('activities')
      .select()
      .lte('min_age_months', maxAge)
      .gte('max_age_months', minAge);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual activities
      for (const activity of data) {
        await this.cache.set(this.cache.generateKey(['activity', activity.id]), activity, 300);
      }
    }

    return data;
  }

  // Milestone operations
  async createMilestone(milestoneData: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('milestones')
      .insert([milestoneData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new milestone
      await this.cache.set(this.cache.generateKey(['milestone', data.id]), data, 300);
      // Invalidate age range caches
      await this.cache.clearPattern('milestones:age:*');
    }

    return data;
  }

  async getMilestoneById(id: string) {
    const cacheKey = this.cache.generateKey(['milestone', id]);
    const cached = await this.cache.get<Milestone>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('milestones').select().eq('id', id).single();

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
    }

    return data;
  }

  async getMilestonesByAgeRange(minAge: number, maxAge: number) {
    const cacheKey = this.cache.generateKey(['milestones', 'age', `${minAge}-${maxAge}`]);
    const cached = await this.cache.get<Milestone[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('milestones')
      .select()
      .lte('min_age_months', maxAge)
      .gte('max_age_months', minAge);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual milestones
      for (const milestone of data) {
        await this.cache.set(this.cache.generateKey(['milestone', milestone.id]), milestone, 300);
      }
    }

    return data;
  }

  // Activity log operations
  async createActivityLog(logData: Omit<ActivityLog, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([logData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new log
      await this.cache.set(this.cache.generateKey(['activity_log', data.id]), data, 300);
      // Invalidate child's activity logs cache
      await this.cache.del(this.cache.generateKey(['child_activity_logs', logData.child_id]));
    }

    return data;
  }

  async getActivityLogsByChildId(childId: string) {
    const cacheKey = this.cache.generateKey(['child_activity_logs', childId]);
    const cached = await this.cache.get<(ActivityLog & { activities: Activity })[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .select(
        `
        *,
        activities (*)
      `
      )
      .eq('child_id', childId);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual logs and activities
      for (const log of data) {
        await this.cache.set(this.cache.generateKey(['activity_log', log.id]), log, 300);

        if (log.activities) {
          await this.cache.set(
            this.cache.generateKey(['activity', log.activities.id]),
            log.activities,
            300
          );
        }
      }
    }

    return data;
  }

  // Milestone tracking operations
  async createMilestoneTracking(
    trackingData: Omit<MilestoneTracking, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('milestone_tracking')
      .insert([trackingData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new tracking
      await this.cache.set(this.cache.generateKey(['milestone_tracking', data.id]), data, 300);
      // Invalidate child's milestone tracking cache
      await this.cache.del(
        this.cache.generateKey(['child_milestone_tracking', trackingData.child_id])
      );
    }

    return data;
  }

  async getMilestoneTrackingByChildId(childId: string) {
    const cacheKey = this.cache.generateKey(['child_milestone_tracking', childId]);
    const cached =
      await this.cache.get<(MilestoneTracking & { milestones: Milestone })[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('milestone_tracking')
      .select(
        `
        *,
        milestones (*)
      `
      )
      .eq('child_id', childId);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual tracking records and milestones
      for (const tracking of data) {
        await this.cache.set(
          this.cache.generateKey(['milestone_tracking', tracking.id]),
          tracking,
          300
        );

        if (tracking.milestones) {
          await this.cache.set(
            this.cache.generateKey(['milestone', tracking.milestones.id]),
            tracking.milestones,
            300
          );
        }
      }
    }

    return data;
  }

  // Media operations
  async createMedia(mediaData: Omit<Media, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('media').insert([mediaData]).select().single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new media
      await this.cache.set(this.cache.generateKey(['media', data.id]), data, 300);
      // Invalidate child's media cache
      await this.cache.del(this.cache.generateKey(['child_media', mediaData.child_id]));
    }

    return data;
  }

  async getMediaByChildId(childId: string) {
    const cacheKey = this.cache.generateKey(['child_media', childId]);
    const cached = await this.cache.get<Media[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.from('media').select().eq('child_id', childId);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual media items
      for (const media of data) {
        await this.cache.set(this.cache.generateKey(['media', media.id]), media, 300);
      }
    }

    return data;
  }

  // AI chat history operations
  async createChatHistory(chatData: Omit<AIChatHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .insert([chatData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new chat history
      await this.cache.set(this.cache.generateKey(['chat_history', data.id]), data, 300);
      // Invalidate user's chat history cache
      await this.cache.clearPattern(`user_chat_history:${chatData.user_id}:*`);
    }

    return data;
  }

  async getChatHistoryByUserId(userId: string, limit = 50) {
    const cacheKey = this.cache.generateKey(['user_chat_history', userId, limit.toString()]);
    const cached = await this.cache.get<AIChatHistory[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('ai_chat_history')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 300); // Cache for 5 minutes
      // Cache individual chat history items
      for (const chat of data) {
        await this.cache.set(this.cache.generateKey(['chat_history', chat.id]), chat, 300);
      }
    }

    return data;
  }

  // Notification operations
  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Cache the new notification
      await this.cache.set(this.cache.generateKey(['notification', data.id]), data, 300);
      // Invalidate user's unread notifications cache
      await this.cache.del(
        this.cache.generateKey(['user_unread_notifications', notificationData.user_id])
      );
    }

    return data;
  }

  async getUnreadNotificationsByUserId(userId: string) {
    const cacheKey = this.cache.generateKey(['user_unread_notifications', userId]);
    const cached = await this.cache.get<Notification[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select()
      .eq('user_id', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (data) {
      await this.cache.set(cacheKey, data, 60); // Cache for 1 minute (shorter due to frequent updates)
      // Cache individual notifications
      for (const notification of data) {
        await this.cache.set(
          this.cache.generateKey(['notification', notification.id]),
          notification,
          60
        );
      }
    }

    return data;
  }

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Update notification cache
      await this.cache.set(this.cache.generateKey(['notification', data.id]), data, 60);
      // Invalidate user's unread notifications cache
      await this.cache.del(this.cache.generateKey(['user_unread_notifications', data.user_id]));
    }

    return data;
  }
}
