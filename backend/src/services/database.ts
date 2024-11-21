import { supabase } from '../config/supabase';
import { IService } from './base';
import { logger } from '../utils/logger';
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
  async init(): Promise<void> {
    try {
      const { data, error } = await supabase.from('users').select().limit(1);
      if (error) throw error;
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
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Child operations
  async createChild(childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('children')
      .insert([childData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getChildById(id: string) {
    const { data, error } = await supabase
      .from('children')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getChildrenByUserId(userId: string) {
    const { data, error } = await supabase
      .from('children')
      .select()
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  }

  // Activity operations
  async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getActivityById(id: string) {
    const { data, error } = await supabase
      .from('activities')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getActivitiesByAgeRange(minAge: number, maxAge: number) {
    const { data, error } = await supabase
      .from('activities')
      .select()
      .lte('min_age_months', maxAge)
      .gte('max_age_months', minAge);
    
    if (error) throw error;
    return data;
  }

  // Milestone operations
  async createMilestone(milestoneData: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('milestones')
      .insert([milestoneData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMilestoneById(id: string) {
    const { data, error } = await supabase
      .from('milestones')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMilestonesByAgeRange(minAge: number, maxAge: number) {
    const { data, error } = await supabase
      .from('milestones')
      .select()
      .lte('min_age_months', maxAge)
      .gte('max_age_months', minAge);
    
    if (error) throw error;
    return data;
  }

  // Activity log operations
  async createActivityLog(logData: Omit<ActivityLog, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([logData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getActivityLogsByChildId(childId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        activities (*)
      `)
      .eq('child_id', childId);
    
    if (error) throw error;
    return data;
  }

  // Milestone tracking operations
  async createMilestoneTracking(trackingData: Omit<MilestoneTracking, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('milestone_tracking')
      .insert([trackingData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMilestoneTrackingByChildId(childId: string) {
    const { data, error } = await supabase
      .from('milestone_tracking')
      .select(`
        *,
        milestones (*)
      `)
      .eq('child_id', childId);
    
    if (error) throw error;
    return data;
  }

  // Media operations
  async createMedia(mediaData: Omit<Media, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('media')
      .insert([mediaData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMediaByChildId(childId: string) {
    const { data, error } = await supabase
      .from('media')
      .select()
      .eq('child_id', childId);
    
    if (error) throw error;
    return data;
  }

  // AI chat history operations
  async createChatHistory(chatData: Omit<AIChatHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .insert([chatData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getChatHistoryByUserId(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Notification operations
  async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUnreadNotificationsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select()
      .eq('user_id', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}