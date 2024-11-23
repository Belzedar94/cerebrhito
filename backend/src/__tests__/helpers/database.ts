import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';

// Create test database client
export const createTestClient = () => {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return client;
};

// Clean up test database
export const cleanupDatabase = async (client: SupabaseClient) => {
  try {
    // Delete all data in reverse order of dependencies
    await client.from('notifications').delete().neq('id', '');
    await client.from('ai_chat_history').delete().neq('id', '');
    await client.from('media').delete().neq('id', '');
    await client.from('milestone_tracking').delete().neq('id', '');
    await client.from('activity_logs').delete().neq('id', '');
    await client.from('milestones').delete().neq('id', '');
    await client.from('activities').delete().neq('id', '');
    await client.from('children').delete().neq('id', '');
    await client.from('users').delete().neq('id', '');
  } catch (error) {
    logger.error('Error cleaning up test database', error);
    throw error;
  }
};

// Seed test database
export const seedDatabase = async (client: SupabaseClient) => {
  try {
    // Create test user
    const { data: user, error: userError } = await client
      .from('users')
      .insert({
        email: 'test@example.com',
        encrypted_password: 'test-password',
        full_name: 'Test User',
        role: 'parent',
        subscription_type: 'free'
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create test child
    const { data: child, error: childError } = await client
      .from('children')
      .insert({
        user_id: user.id,
        name: 'Test Child',
        date_of_birth: '2020-01-01',
        gender: 'male'
      })
      .select()
      .single();

    if (childError) throw childError;

    // Create test activity
    const { data: activity, error: activityError } = await client
      .from('activities')
      .insert({
        name: 'Test Activity',
        description: 'Test activity description',
        min_age_months: 12,
        max_age_months: 24,
        duration_minutes: 30,
        category: 'physical',
        tags: ['test', 'activity']
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Create test milestone
    const { data: milestone, error: milestoneError } = await client
      .from('milestones')
      .insert({
        name: 'Test Milestone',
        description: 'Test milestone description',
        min_age_months: 12,
        max_age_months: 24,
        category: 'physical',
        importance: 1
      })
      .select()
      .single();

    if (milestoneError) throw milestoneError;

    // Create test activity log
    const { error: activityLogError } = await client
      .from('activity_logs')
      .insert({
        child_id: child.id,
        activity_id: activity.id,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

    if (activityLogError) throw activityLogError;

    // Create test milestone tracking
    const { error: milestoneTrackingError } = await client
      .from('milestone_tracking')
      .insert({
        child_id: child.id,
        milestone_id: milestone.id
      });

    if (milestoneTrackingError) throw milestoneTrackingError;

    // Create test media
    const { error: mediaError } = await client
      .from('media')
      .insert({
        child_id: child.id,
        type: 'photo',
        file_path: '/test/path/image.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg'
      });

    if (mediaError) throw mediaError;

    // Create test AI chat history
    const { error: aiChatError } = await client
      .from('ai_chat_history')
      .insert({
        user_id: user.id,
        child_id: child.id,
        message: 'Test message',
        response: 'Test response'
      });

    if (aiChatError) throw aiChatError;

    // Create test notification
    const { error: notificationError } = await client
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Test Notification',
        message: 'Test notification message'
      });

    if (notificationError) throw notificationError;

    return {
      user,
      child,
      activity,
      milestone
    };
  } catch (error) {
    logger.error('Error seeding test database', error);
    throw error;
  }
};

// Get test data
export const getTestData = async (client: SupabaseClient) => {
  try {
    const { data: user } = await client
      .from('users')
      .select()
      .eq('email', 'test@example.com')
      .single();

    const { data: child } = await client
      .from('children')
      .select()
      .eq('user_id', user.id)
      .single();

    const { data: activity } = await client
      .from('activities')
      .select()
      .eq('name', 'Test Activity')
      .single();

    const { data: milestone } = await client
      .from('milestones')
      .select()
      .eq('name', 'Test Milestone')
      .single();

    const { data: activityLog } = await client
      .from('activity_logs')
      .select()
      .eq('child_id', child.id)
      .single();

    const { data: milestoneTracking } = await client
      .from('milestone_tracking')
      .select()
      .eq('child_id', child.id)
      .single();

    const { data: media } = await client
      .from('media')
      .select()
      .eq('child_id', child.id)
      .single();

    const { data: aiChat } = await client
      .from('ai_chat_history')
      .select()
      .eq('user_id', user.id)
      .single();

    const { data: notification } = await client
      .from('notifications')
      .select()
      .eq('user_id', user.id)
      .single();

    return {
      user,
      child,
      activity,
      milestone,
      activityLog,
      milestoneTracking,
      media,
      aiChat,
      notification
    };
  } catch (error) {
    logger.error('Error getting test data', error);
    throw error;
  }
};