import { z } from 'zod';

// Common schemas
const idSchema = z.string().uuid();
const emailSchema = z.string().email();
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Auth schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['parent', 'professional']),
  specialization: z.string().optional(),
  license_number: z.string().optional()
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string()
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema
});

// Child schemas
export const childSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  birth_date: z.string().datetime(),
  gender: z.enum(['male', 'female', 'other']),
  notes: z.string().optional(),
  medical_conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional()
});

// Activity schemas
export const activitySchema = z.object({
  name: z.string().min(3, 'Activity name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string(),
  min_age_months: z.number().min(0).max(216), // 0-18 years
  max_age_months: z.number().min(0).max(216),
  duration_minutes: z.number().min(1).max(480), // 1 min to 8 hours
  materials_needed: z.array(z.string()).optional(),
  skills_developed: z.array(z.string()),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  indoor: z.boolean(),
  supervision_required: z.boolean()
}).refine(data => data.min_age_months <= data.max_age_months, {
  message: 'Minimum age must be less than or equal to maximum age',
  path: ['min_age_months']
});

// Activity log schemas
export const activityLogSchema = z.object({
  child_id: idSchema,
  activity_id: idSchema,
  completed_at: z.string().datetime(),
  duration_minutes: z.number().min(1),
  notes: z.string().optional(),
  enjoyment_level: z.number().min(1).max(5).optional(),
  difficulty_experienced: z.number().min(1).max(5).optional(),
  media_urls: z.array(z.string().url()).optional()
});

// Milestone schemas
export const milestoneSchema = z.object({
  name: z.string().min(3, 'Milestone name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string(),
  min_age_months: z.number().min(0).max(216),
  max_age_months: z.number().min(0).max(216),
  indicators: z.array(z.string()).min(1, 'At least one indicator is required'),
  supporting_activities: z.array(z.string()).optional(),
  professional_notes: z.string().optional()
}).refine(data => data.min_age_months <= data.max_age_months, {
  message: 'Minimum age must be less than or equal to maximum age',
  path: ['min_age_months']
});

// Milestone tracking schemas
export const milestoneTrackingSchema = z.object({
  child_id: idSchema,
  milestone_id: idSchema,
  achieved_at: z.string().datetime(),
  notes: z.string().optional(),
  observed_indicators: z.array(z.string()).min(1, 'At least one indicator must be observed'),
  media_urls: z.array(z.string().url()).optional(),
  professional_id: idSchema.optional()
});

// Media schemas
export const mediaSchema = z.object({
  child_id: idSchema,
  type: z.enum(['image', 'video', 'document']),
  url: z.string().url(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  milestone_id: idSchema.optional(),
  activity_id: idSchema.optional()
});

// AI Assistant schemas
export const aiMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  child_id: idSchema.optional(),
  context: z.object({
    recent_activities: z.array(idSchema).optional(),
    recent_milestones: z.array(idSchema).optional(),
    specific_concern: z.string().optional()
  }).optional()
});