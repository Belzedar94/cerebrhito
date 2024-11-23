import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { AppError } from '../errors/types';

interface SecurityPolicyConfig {
  client: SupabaseClient;
}

export class SecurityPolicy {
  private client: SupabaseClient;

  constructor(config: SecurityPolicyConfig) {
    this.client = config.client;
  }

  /**
   * Check if a user has access to a resource
   */
  async hasAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get user role
      const { data: user, error: userError } = await this.client
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Admin has full access
      if (user.role === 'admin') {
        return true;
      }

      // Check resource-specific policies
      switch (resourceType) {
        case 'children':
          return this.hasChildAccess(userId, resourceId, action);
        case 'activities':
          return this.hasActivityAccess(userId, resourceId, action);
        case 'milestones':
          return this.hasMilestoneAccess(userId, resourceId, action);
        case 'media':
          return this.hasMediaAccess(userId, resourceId, action);
        case 'ai_chat_history':
          return this.hasChatAccess(userId, resourceId, action);
        case 'notifications':
          return this.hasNotificationAccess(userId, resourceId, action);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking access', {
        error,
        userId,
        resourceType,
        resourceId,
        action,
      });
      throw AppError.securityError('Failed to check access', error);
    }
  }

  /**
   * Check if a user has access to a child
   */
  private async hasChildAccess(
    userId: string,
    childId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get child
      const { data: child, error: childError } = await this.client
        .from('children')
        .select('user_id')
        .eq('id', childId)
        .single();

      if (childError) {
        throw childError;
      }

      // Only the parent can access their children
      return child.user_id === userId;
    } catch (error) {
      logger.error('Error checking child access', {
        error,
        userId,
        childId,
        action,
      });
      throw AppError.securityError('Failed to check child access', error);
    }
  }

  /**
   * Check if a user has access to an activity
   */
  private async hasActivityAccess(
    userId: string,
    activityId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get activity
      const { data: activity, error: activityError } = await this.client
        .from('activities')
        .select('user_id, ai_generated')
        .eq('id', activityId)
        .single();

      if (activityError) {
        throw activityError;
      }

      // AI-generated activities are read-only for all users
      if (activity.ai_generated && action !== 'read') {
        return false;
      }

      // Users can only modify their own activities
      if (action !== 'read') {
        return activity.user_id === userId;
      }

      return true;
    } catch (error) {
      logger.error('Error checking activity access', {
        error,
        userId,
        activityId,
        action,
      });
      throw AppError.securityError('Failed to check activity access', error);
    }
  }

  /**
   * Check if a user has access to a milestone
   */
  private async hasMilestoneAccess(
    userId: string,
    milestoneId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get milestone
      const { data: milestone, error: milestoneError } = await this.client
        .from('milestones')
        .select('user_id')
        .eq('id', milestoneId)
        .single();

      if (milestoneError) {
        throw milestoneError;
      }

      // System milestones are read-only for all users
      if (!milestone.user_id && action !== 'read') {
        return false;
      }

      // Users can only modify their own milestones
      if (action !== 'read') {
        return milestone.user_id === userId;
      }

      return true;
    } catch (error) {
      logger.error('Error checking milestone access', {
        error,
        userId,
        milestoneId,
        action,
      });
      throw AppError.securityError('Failed to check milestone access', error);
    }
  }

  /**
   * Check if a user has access to media
   */
  private async hasMediaAccess(
    userId: string,
    mediaId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get media
      const { data: media, error: mediaError } = await this.client
        .from('media')
        .select('child_id')
        .eq('id', mediaId)
        .single();

      if (mediaError) {
        throw mediaError;
      }

      // Check if user has access to the child
      return this.hasChildAccess(userId, media.child_id, action);
    } catch (error) {
      logger.error('Error checking media access', {
        error,
        userId,
        mediaId,
        action,
      });
      throw AppError.securityError('Failed to check media access', error);
    }
  }

  /**
   * Check if a user has access to chat history
   */
  private async hasChatAccess(
    userId: string,
    chatId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get chat history
      const { data: chat, error: chatError } = await this.client
        .from('ai_chat_history')
        .select('user_id')
        .eq('id', chatId)
        .single();

      if (chatError) {
        throw chatError;
      }

      // Users can only access their own chat history
      return chat.user_id === userId;
    } catch (error) {
      logger.error('Error checking chat access', {
        error,
        userId,
        chatId,
        action,
      });
      throw AppError.securityError('Failed to check chat access', error);
    }
  }

  /**
   * Check if a user has access to notifications
   */
  private async hasNotificationAccess(
    userId: string,
    notificationId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get notification
      const { data: notification, error: notificationError } = await this.client
        .from('notifications')
        .select('user_id')
        .eq('id', notificationId)
        .single();

      if (notificationError) {
        throw notificationError;
      }

      // Users can only access their own notifications
      return notification.user_id === userId;
    } catch (error) {
      logger.error('Error checking notification access', {
        error,
        userId,
        notificationId,
        action,
      });
      throw AppError.securityError('Failed to check notification access', error);
    }
  }

  /**
   * Check if a user has required subscription
   */
  async hasSubscription(
    userId: string,
    requiredType: 'free' | 'basic' | 'premium'
  ): Promise<boolean> {
    try {
      // Get user subscription
      const { data: user, error: userError } = await this.client
        .from('users')
        .select('subscription_type')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Map subscription types to numeric values
      const subscriptionValues = {
        free: 0,
        basic: 1,
        premium: 2,
      };

      // Compare subscription levels
      return subscriptionValues[user.subscription_type] >= subscriptionValues[requiredType];
    } catch (error) {
      logger.error('Error checking subscription', {
        error,
        userId,
        requiredType,
      });
      throw AppError.securityError('Failed to check subscription', error);
    }
  }

  /**
   * Check if a user has reached their quota
   */
  async hasQuota(
    userId: string,
    quotaType: 'children' | 'activities' | 'media' | 'ai_chat'
  ): Promise<boolean> {
    try {
      // Get user subscription
      const { data: user, error: userError } = await this.client
        .from('users')
        .select('subscription_type')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // Define quota limits
      const quotaLimits = {
        children: {
          free: 1,
          basic: 3,
          premium: Infinity,
        },
        activities: {
          free: 10,
          basic: 50,
          premium: Infinity,
        },
        media: {
          free: 100,
          basic: 500,
          premium: Infinity,
        },
        ai_chat: {
          free: 10,
          basic: 100,
          premium: Infinity,
        },
      };

      // Get current usage
      let currentUsage = 0;

      switch (quotaType) {
        case 'children':
          const { count: childCount } = await this.client
            .from('children')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

          currentUsage = childCount || 0;
          break;

        case 'activities':
          const { count: activityCount } = await this.client
            .from('activities')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('ai_generated', false);

          currentUsage = activityCount || 0;
          break;

        case 'media':
          const { count: mediaCount } = await this.client
            .from('media')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

          currentUsage = mediaCount || 0;
          break;

        case 'ai_chat':
          const { count: chatCount } = await this.client
            .from('ai_chat_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          currentUsage = chatCount || 0;
          break;
      }

      // Check if user has reached their quota
      return currentUsage < quotaLimits[quotaType][user.subscription_type];
    } catch (error) {
      logger.error('Error checking quota', {
        error,
        userId,
        quotaType,
      });
      throw AppError.securityError('Failed to check quota', error);
    }
  }
}
