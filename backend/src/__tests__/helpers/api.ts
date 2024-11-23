import request from 'supertest';
import { Express } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestClient, seedDatabase } from './database';
import { logger } from '../../utils/logger';

interface TestContext {
  app: Express;
  client: SupabaseClient;
  token: string;
  testData: {
    user: any;
    child: any;
    activity: any;
    milestone: any;
  };
}

/**
 * Initialize test context
 */
export const initTestContext = async (app: Express): Promise<TestContext> => {
  try {
    // Create test client
    const client = createTestClient();

    // Seed database and get test data
    const testData = await seedDatabase(client);

    // Get auth token
    const { data: auth, error } = await client.auth.signInWithPassword({
      email: testData.user.email,
      password: 'test-password'
    });

    if (error) throw error;

    return {
      app,
      client,
      token: auth.session!.access_token,
      testData
    };
  } catch (error) {
    logger.error('Error initializing test context', error);
    throw error;
  }
};

/**
 * Make authenticated request
 */
export const authRequest = (
  context: TestContext,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
) => {
  return request(context.app)
    [method]
    .bind(request(context.app))
    .set('Authorization', `Bearer ${context.token}`);
};

/**
 * Test helpers for user endpoints
 */
export const userApi = {
  // Get current user
  getCurrentUser: (context: TestContext) =>
    authRequest(context, 'get')('/api/users/me'),

  // Update current user
  updateCurrentUser: (context: TestContext, data: any) =>
    authRequest(context, 'put')('/api/users/me').send(data),

  // Update password
  updatePassword: (context: TestContext, data: any) =>
    authRequest(context, 'put')('/api/users/me/password').send(data),

  // Get user notifications
  getNotifications: (context: TestContext) =>
    authRequest(context, 'get')('/api/users/me/notifications'),

  // Mark notification as read
  markNotificationAsRead: (context: TestContext, notificationId: string) =>
    authRequest(context, 'put')(`/api/users/me/notifications/${notificationId}/read`)
};

/**
 * Test helpers for child endpoints
 */
export const childApi = {
  // Get user's children
  getChildren: (context: TestContext) =>
    authRequest(context, 'get')('/api/children'),

  // Get child by ID
  getChild: (context: TestContext, childId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}`),

  // Create child
  createChild: (context: TestContext, data: any) =>
    authRequest(context, 'post')('/api/children').send(data),

  // Update child
  updateChild: (context: TestContext, childId: string, data: any) =>
    authRequest(context, 'put')(`/api/children/${childId}`).send(data),

  // Delete child
  deleteChild: (context: TestContext, childId: string) =>
    authRequest(context, 'delete')(`/api/children/${childId}`)
};

/**
 * Test helpers for activity endpoints
 */
export const activityApi = {
  // Get activities
  getActivities: (context: TestContext) =>
    authRequest(context, 'get')('/api/activities'),

  // Get activity by ID
  getActivity: (context: TestContext, activityId: string) =>
    authRequest(context, 'get')(`/api/activities/${activityId}`),

  // Create activity
  createActivity: (context: TestContext, data: any) =>
    authRequest(context, 'post')('/api/activities').send(data),

  // Update activity
  updateActivity: (context: TestContext, activityId: string, data: any) =>
    authRequest(context, 'put')(`/api/activities/${activityId}`).send(data),

  // Delete activity
  deleteActivity: (context: TestContext, activityId: string) =>
    authRequest(context, 'delete')(`/api/activities/${activityId}`)
};

/**
 * Test helpers for milestone endpoints
 */
export const milestoneApi = {
  // Get milestones
  getMilestones: (context: TestContext) =>
    authRequest(context, 'get')('/api/milestones'),

  // Get milestone by ID
  getMilestone: (context: TestContext, milestoneId: string) =>
    authRequest(context, 'get')(`/api/milestones/${milestoneId}`),

  // Create milestone
  createMilestone: (context: TestContext, data: any) =>
    authRequest(context, 'post')('/api/milestones').send(data),

  // Update milestone
  updateMilestone: (context: TestContext, milestoneId: string, data: any) =>
    authRequest(context, 'put')(`/api/milestones/${milestoneId}`).send(data),

  // Delete milestone
  deleteMilestone: (context: TestContext, milestoneId: string) =>
    authRequest(context, 'delete')(`/api/milestones/${milestoneId}`)
};

/**
 * Test helpers for activity log endpoints
 */
export const activityLogApi = {
  // Get child's activity logs
  getActivityLogs: (context: TestContext, childId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}/activity-logs`),

  // Get activity log by ID
  getActivityLog: (context: TestContext, childId: string, logId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}/activity-logs/${logId}`),

  // Create activity log
  createActivityLog: (context: TestContext, childId: string, data: any) =>
    authRequest(context, 'post')(`/api/children/${childId}/activity-logs`).send(data),

  // Update activity log
  updateActivityLog: (context: TestContext, childId: string, logId: string, data: any) =>
    authRequest(context, 'put')(`/api/children/${childId}/activity-logs/${logId}`).send(data),

  // Delete activity log
  deleteActivityLog: (context: TestContext, childId: string, logId: string) =>
    authRequest(context, 'delete')(`/api/children/${childId}/activity-logs/${logId}`)
};

/**
 * Test helpers for milestone tracking endpoints
 */
export const milestoneTrackingApi = {
  // Get child's milestone tracking
  getMilestoneTracking: (context: TestContext, childId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}/milestone-tracking`),

  // Get milestone tracking by ID
  getMilestoneTrackingById: (context: TestContext, childId: string, trackingId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}/milestone-tracking/${trackingId}`),

  // Create milestone tracking
  createMilestoneTracking: (context: TestContext, childId: string, data: any) =>
    authRequest(context, 'post')(`/api/children/${childId}/milestone-tracking`).send(data),

  // Update milestone tracking
  updateMilestoneTracking: (context: TestContext, childId: string, trackingId: string, data: any) =>
    authRequest(context, 'put')(`/api/children/${childId}/milestone-tracking/${trackingId}`).send(data),

  // Delete milestone tracking
  deleteMilestoneTracking: (context: TestContext, childId: string, trackingId: string) =>
    authRequest(context, 'delete')(`/api/children/${childId}/milestone-tracking/${trackingId}`)
};

/**
 * Test helpers for media endpoints
 */
export const mediaApi = {
  // Get child's media
  getMedia: (context: TestContext, childId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}/media`),

  // Get media by ID
  getMediaById: (context: TestContext, childId: string, mediaId: string) =>
    authRequest(context, 'get')(`/api/children/${childId}/media/${mediaId}`),

  // Upload media
  uploadMedia: (context: TestContext, childId: string, file: any) =>
    authRequest(context, 'post')(`/api/children/${childId}/media`)
      .attach('file', file.buffer, file.originalname),

  // Delete media
  deleteMedia: (context: TestContext, childId: string, mediaId: string) =>
    authRequest(context, 'delete')(`/api/children/${childId}/media/${mediaId}`)
};

/**
 * Test helpers for AI chat endpoints
 */
export const aiChatApi = {
  // Get chat history
  getChatHistory: (context: TestContext) =>
    authRequest(context, 'get')('/api/ai/chat/history'),

  // Send message
  sendMessage: (context: TestContext, data: any) =>
    authRequest(context, 'post')('/api/ai/chat').send(data),

  // Generate speech
  generateSpeech: (context: TestContext, data: any) =>
    authRequest(context, 'post')('/api/ai/speech').send(data)
};