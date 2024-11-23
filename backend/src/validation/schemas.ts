import { z } from 'zod';

// Common schemas and constants
export const MAX_AGE_MONTHS = 216; // 18 years
export const MAX_ACTIVITY_DURATION = 480; // 8 hours in minutes
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

const idSchema = z.string().uuid({
  message: 'Invalid ID format. Must be a valid UUID.',
});

const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must not exceed 2048 characters');

const dateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.date())
  .transform(val => new Date(val).toISOString());

const mediaFileSchema = z.object({
  size: z.number().max(MAX_FILE_SIZE, 'File size must not exceed 10MB'),
  type: z.enum(
    [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES] as const,
    {
      errorMap: () => ({ message: 'Invalid file type' }),
    }
  ),
  name: z.string().max(255, 'File name must not exceed 255 characters'),
});

// Auth schemas
const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(val => val.trim());

const specializationSchema = z
  .string()
  .min(2, 'Specialization must be at least 2 characters')
  .max(100, 'Specialization must not exceed 100 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'Specialization can only contain letters, spaces, hyphens, and apostrophes'
  )
  .transform(val => val.trim());

const licenseNumberSchema = z
  .string()
  .min(5, 'License number must be at least 5 characters')
  .max(50, 'License number must not exceed 50 characters')
  .regex(
    /^[A-Z0-9\-]+$/,
    'License number can only contain uppercase letters, numbers, and hyphens'
  );

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    role: z.enum(['parent', 'professional'], {
      errorMap: () => ({ message: 'Role must be either "parent" or "professional"' }),
    }),
    specialization: specializationSchema.optional(),
    license_number: licenseNumberSchema.optional(),
  })
  .refine(
    data => {
      if (data.role === 'professional') {
        return data.specialization && data.license_number;
      }

      return true;
    },
    {
      message: 'Professionals must provide specialization and license number',
      path: ['role'],
    }
  );

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(100, 'Password must not exceed 100 characters'),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(100, 'Password must not exceed 100 characters'),
    newPassword: passwordSchema,
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(500, 'Invalid reset token'),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').max(500, 'Invalid refresh token'),
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    specialization: specializationSchema.optional(),
    license_number: licenseNumberSchema.optional(),
    avatar_url: urlSchema.optional(),
    notification_preferences: z
      .object({
        email: z.boolean(),
        push: z.boolean(),
        sms: z.boolean(),
      })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Child schemas
const medicalConditionSchema = z
  .string()
  .min(2, 'Medical condition must be at least 2 characters')
  .max(200, 'Medical condition must not exceed 200 characters')
  .transform(val => val.trim());

const allergySchema = z
  .string()
  .min(2, 'Allergy must be at least 2 characters')
  .max(200, 'Allergy must not exceed 200 characters')
  .transform(val => val.trim());

const notesSchema = z
  .string()
  .max(2000, 'Notes must not exceed 2000 characters')
  .transform(val => val.trim());

export const childSchema = z.object({
  name: nameSchema,
  birth_date: dateSchema.refine(
    date => {
      const birthDate = new Date(date);
      const now = new Date();
      const minDate = new Date(now);

      minDate.setFullYear(now.getFullYear() - 18); // Max 18 years old

      return birthDate <= now && birthDate >= minDate;
    },
    {
      message: 'Birth date must be between 0 and 18 years ago',
    }
  ),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Gender must be one of: male, female, other, prefer_not_to_say' }),
  }),
  notes: notesSchema.optional(),
  medical_conditions: z
    .array(medicalConditionSchema)
    .max(20, 'Cannot have more than 20 medical conditions')
    .optional()
    .default([]),
  allergies: z
    .array(allergySchema)
    .max(20, 'Cannot have more than 20 allergies')
    .optional()
    .default([]),
  avatar_url: urlSchema.optional(),
  primary_language: z
    .string()
    .min(2, 'Language must be at least 2 characters')
    .max(50, 'Language must not exceed 50 characters')
    .optional(),
  additional_languages: z
    .array(
      z
        .string()
        .min(2, 'Language must be at least 2 characters')
        .max(50, 'Language must not exceed 50 characters')
    )
    .max(5, 'Cannot have more than 5 additional languages')
    .optional()
    .default([]),
  development_concerns: z
    .array(
      z
        .string()
        .min(2, 'Concern must be at least 2 characters')
        .max(200, 'Concern must not exceed 200 characters')
    )
    .max(10, 'Cannot have more than 10 development concerns')
    .optional()
    .default([]),
  professionals: z
    .array(
      z.object({
        professional_id: idSchema,
        role: z
          .string()
          .min(2, 'Professional role must be at least 2 characters')
          .max(100, 'Professional role must not exceed 100 characters'),
        access_level: z.enum(['read', 'write', 'admin'], {
          errorMap: () => ({ message: 'Access level must be one of: read, write, admin' }),
        }),
      })
    )
    .max(10, 'Cannot have more than 10 professionals')
    .optional()
    .default([]),
});

export const updateChildSchema = childSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const addProfessionalSchema = z.object({
  professional_id: idSchema,
  role: z
    .string()
    .min(2, 'Professional role must be at least 2 characters')
    .max(100, 'Professional role must not exceed 100 characters'),
  access_level: z.enum(['read', 'write', 'admin'], {
    errorMap: () => ({ message: 'Access level must be one of: read, write, admin' }),
  }),
});

export const updateProfessionalSchema = z
  .object({
    role: z
      .string()
      .min(2, 'Professional role must be at least 2 characters')
      .max(100, 'Professional role must not exceed 100 characters')
      .optional(),
    access_level: z
      .enum(['read', 'write', 'admin'], {
        errorMap: () => ({ message: 'Access level must be one of: read, write, admin' }),
      })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Activity schemas
const activityNameSchema = z
  .string()
  .min(3, 'Activity name must be at least 3 characters')
  .max(100, 'Activity name must not exceed 100 characters')
  .transform(val => val.trim());

const activityDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(2000, 'Description must not exceed 2000 characters')
  .transform(val => val.trim());

const categorySchema = z
  .string()
  .min(2, 'Category must be at least 2 characters')
  .max(50, 'Category must not exceed 50 characters')
  .transform(val => val.trim());

const materialSchema = z
  .string()
  .min(2, 'Material must be at least 2 characters')
  .max(100, 'Material must not exceed 100 characters')
  .transform(val => val.trim());

const skillSchema = z
  .string()
  .min(2, 'Skill must be at least 2 characters')
  .max(100, 'Skill must not exceed 100 characters')
  .transform(val => val.trim());

export const activitySchema = z
  .object({
    name: activityNameSchema,
    description: activityDescriptionSchema,
    category: categorySchema,
    min_age_months: z
      .number()
      .int('Age must be a whole number')
      .min(0, 'Minimum age cannot be negative')
      .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
    max_age_months: z
      .number()
      .int('Age must be a whole number')
      .min(0, 'Minimum age cannot be negative')
      .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
    duration_minutes: z
      .number()
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 minute')
      .max(MAX_ACTIVITY_DURATION, 'Duration cannot exceed 8 hours'),
    materials_needed: z
      .array(materialSchema)
      .max(20, 'Cannot have more than 20 materials')
      .optional()
      .default([]),
    skills_developed: z
      .array(skillSchema)
      .min(1, 'At least one skill must be specified')
      .max(10, 'Cannot have more than 10 skills'),
    difficulty_level: z.enum(['easy', 'medium', 'hard'], {
      errorMap: () => ({ message: 'Difficulty must be one of: easy, medium, hard' }),
    }),
    indoor: z.boolean(),
    supervision_required: z.boolean(),
    safety_notes: z.string().max(1000, 'Safety notes must not exceed 1000 characters').optional(),
    adaptations: z
      .array(
        z.object({
          condition: z
            .string()
            .min(2, 'Condition must be at least 2 characters')
            .max(100, 'Condition must not exceed 100 characters'),
          modifications: z
            .string()
            .min(10, 'Modifications must be at least 10 characters')
            .max(500, 'Modifications must not exceed 500 characters'),
        })
      )
      .max(10, 'Cannot have more than 10 adaptations')
      .optional()
      .default([]),
    media: z
      .array(
        z.object({
          type: z.enum(['image', 'video', 'document']),
          url: urlSchema,
          title: z
            .string()
            .min(2, 'Media title must be at least 2 characters')
            .max(100, 'Media title must not exceed 100 characters'),
          description: z
            .string()
            .max(500, 'Media description must not exceed 500 characters')
            .optional(),
        })
      )
      .max(10, 'Cannot have more than 10 media items')
      .optional()
      .default([]),
    tags: z
      .array(
        z
          .string()
          .min(2, 'Tag must be at least 2 characters')
          .max(30, 'Tag must not exceed 30 characters')
      )
      .max(10, 'Cannot have more than 10 tags')
      .optional()
      .default([]),
    created_by: idSchema,
    last_modified_by: idSchema,
    status: z
      .enum(['draft', 'published', 'archived'], {
        errorMap: () => ({ message: 'Status must be one of: draft, published, archived' }),
      })
      .default('draft'),
    visibility: z
      .enum(['public', 'private', 'shared'], {
        errorMap: () => ({ message: 'Visibility must be one of: public, private, shared' }),
      })
      .default('private'),
  })
  .refine(data => data.min_age_months <= data.max_age_months, {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['min_age_months'],
  });

export const updateActivitySchema = z.preprocess(
  (obj: any) => ({
    ...obj,
    last_modified_by: obj.last_modified_by || undefined,
  }),
  z
    .object({
      name: activityNameSchema.optional(),
      description: activityDescriptionSchema.optional(),
      category: categorySchema.optional(),
      min_age_months: z
        .number()
        .int('Age must be a whole number')
        .min(0, 'Minimum age cannot be negative')
        .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years')
        .optional(),
      max_age_months: z
        .number()
        .int('Age must be a whole number')
        .min(0, 'Minimum age cannot be negative')
        .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years')
        .optional(),
      duration_minutes: z
        .number()
        .int('Duration must be a whole number')
        .min(1, 'Duration must be at least 1 minute')
        .max(MAX_ACTIVITY_DURATION, 'Duration cannot exceed 8 hours')
        .optional(),
      materials_needed: z
        .array(materialSchema)
        .max(20, 'Cannot have more than 20 materials')
        .optional(),
      skills_developed: z
        .array(skillSchema)
        .min(1, 'At least one skill must be specified')
        .max(10, 'Cannot have more than 10 skills')
        .optional(),
      difficulty_level: z
        .enum(['easy', 'medium', 'hard'], {
          errorMap: () => ({ message: 'Difficulty must be one of: easy, medium, hard' }),
        })
        .optional(),
      indoor: z.boolean().optional(),
      supervision_required: z.boolean().optional(),
      safety_notes: z.string().max(1000, 'Safety notes must not exceed 1000 characters').optional(),
      adaptations: z
        .array(
          z.object({
            condition: z
              .string()
              .min(2, 'Condition must be at least 2 characters')
              .max(100, 'Condition must not exceed 100 characters'),
            modifications: z
              .string()
              .min(10, 'Modifications must be at least 10 characters')
              .max(500, 'Modifications must not exceed 500 characters'),
          })
        )
        .max(10, 'Cannot have more than 10 adaptations')
        .optional(),
      media: z
        .array(
          z.object({
            type: z.enum(['image', 'video', 'document']),
            url: urlSchema,
            title: z
              .string()
              .min(2, 'Media title must be at least 2 characters')
              .max(100, 'Media title must not exceed 100 characters'),
            description: z
              .string()
              .max(500, 'Media description must not exceed 500 characters')
              .optional(),
          })
        )
        .max(10, 'Cannot have more than 10 media items')
        .optional(),
      tags: z
        .array(
          z
            .string()
            .min(2, 'Tag must be at least 2 characters')
            .max(30, 'Tag must not exceed 30 characters')
        )
        .max(10, 'Cannot have more than 10 tags')
        .optional(),
      status: z
        .enum(['draft', 'published', 'archived'], {
          errorMap: () => ({ message: 'Status must be one of: draft, published, archived' }),
        })
        .optional(),
      visibility: z
        .enum(['public', 'private', 'shared'], {
          errorMap: () => ({ message: 'Visibility must be one of: public, private, shared' }),
        })
        .optional(),
      last_modified_by: idSchema,
    })
    .refine(
      data => Object.keys(data).length > 1, // At least one field besides last_modified_by
      {
        message: 'At least one field must be provided for update',
      }
    )
    .refine(
      data => {
        if (data.min_age_months !== undefined && data.max_age_months !== undefined) {
          return data.min_age_months <= data.max_age_months;
        }

        return true;
      },
      {
        message: 'Minimum age must be less than or equal to maximum age',
        path: ['min_age_months'],
      }
    )
);

// Activity log schemas
const ratingSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating cannot exceed 5');

const logNotesSchema = z
  .string()
  .max(1000, 'Notes must not exceed 1000 characters')
  .transform(val => val.trim());

export const activityLogSchema = z.object({
  child_id: idSchema,
  activity_id: idSchema,
  completed_at: dateSchema.refine(
    date => {
      const completedDate = new Date(date);
      const now = new Date();
      const minDate = new Date();

      minDate.setDate(now.getDate() - 30); // Max 30 days in the past
      const maxDate = new Date();

      maxDate.setMinutes(now.getMinutes() + 1); // Allow 1 minute in the future for clock differences

      return completedDate <= maxDate && completedDate >= minDate;
    },
    {
      message: 'Completion date must be within the last 30 days and not in the future',
    }
  ),
  duration_minutes: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(MAX_ACTIVITY_DURATION, 'Duration cannot exceed 8 hours'),
  notes: logNotesSchema.optional(),
  enjoyment_level: ratingSchema.optional(),
  difficulty_experienced: ratingSchema.optional(),
  engagement_level: ratingSchema.optional(),
  completion_level: z
    .number()
    .int('Completion level must be a whole number')
    .min(0, 'Completion level must be at least 0%')
    .max(100, 'Completion level cannot exceed 100%')
    .optional(),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video', 'document']),
        url: urlSchema,
        title: z
          .string()
          .min(2, 'Media title must be at least 2 characters')
          .max(100, 'Media title must not exceed 100 characters'),
        description: z
          .string()
          .max(500, 'Media description must not exceed 500 characters')
          .optional(),
        timestamp: dateSchema.optional(),
      })
    )
    .max(10, 'Cannot have more than 10 media items')
    .optional()
    .default([]),
  milestones_observed: z
    .array(
      z.object({
        milestone_id: idSchema,
        observation_notes: z
          .string()
          .max(500, 'Observation notes must not exceed 500 characters')
          .optional(),
      })
    )
    .max(5, 'Cannot have more than 5 milestones per activity')
    .optional()
    .default([]),
  skills_practiced: z
    .array(skillSchema)
    .max(10, 'Cannot have more than 10 skills')
    .optional()
    .default([]),
  challenges_faced: z
    .array(
      z
        .string()
        .min(2, 'Challenge must be at least 2 characters')
        .max(200, 'Challenge must not exceed 200 characters')
    )
    .max(5, 'Cannot have more than 5 challenges')
    .optional()
    .default([]),
  parent_feedback: z
    .string()
    .max(1000, 'Parent feedback must not exceed 1000 characters')
    .optional(),
  professional_feedback: z
    .string()
    .max(1000, 'Professional feedback must not exceed 1000 characters')
    .optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_notes: z.string().max(500, 'Follow-up notes must not exceed 500 characters').optional(),
  created_by: idSchema,
  last_modified_by: idSchema.optional(),
});

export const updateActivityLogSchema = activityLogSchema
  .partial()
  .extend({
    last_modified_by: idSchema,
  })
  .refine(
    data => Object.keys(data).length > 1, // At least one field besides last_modified_by
    {
      message: 'At least one field must be provided for update',
    }
  );

// Milestone schemas
const milestoneNameSchema = z
  .string()
  .min(3, 'Milestone name must be at least 3 characters')
  .max(200, 'Milestone name must not exceed 200 characters')
  .transform(val => val.trim());

const milestoneDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(2000, 'Description must not exceed 2000 characters')
  .transform(val => val.trim());

const indicatorSchema = z
  .string()
  .min(5, 'Indicator must be at least 5 characters')
  .max(200, 'Indicator must not exceed 200 characters')
  .transform(val => val.trim());

const developmentAreaSchema = z.object({
  id: idSchema,
  name: z
    .string()
    .min(2, 'Development area name must be at least 2 characters')
    .max(100, 'Development area name must not exceed 100 characters'),
  description: z
    .string()
    .max(1000, 'Development area description must not exceed 1000 characters')
    .optional(),
  order: z.number().int('Order must be a whole number').min(0, 'Order cannot be negative'),
});

export const milestoneSchema = z
  .object({
    name: milestoneNameSchema,
    description: milestoneDescriptionSchema,
    development_area_id: idSchema,
    category: categorySchema,
    min_age_months: z
      .number()
      .int('Age must be a whole number')
      .min(0, 'Minimum age cannot be negative')
      .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
    max_age_months: z
      .number()
      .int('Age must be a whole number')
      .min(0, 'Minimum age cannot be negative')
      .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
    indicators: z
      .array(indicatorSchema)
      .min(1, 'At least one indicator is required')
      .max(10, 'Cannot have more than 10 indicators'),
    supporting_activities: z
      .array(
        z.object({
          activity_id: idSchema,
          notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
        })
      )
      .max(10, 'Cannot have more than 10 supporting activities')
      .optional()
      .default([]),
    professional_notes: z
      .string()
      .max(2000, 'Professional notes must not exceed 2000 characters')
      .optional(),
    references: z
      .array(
        z.object({
          title: z
            .string()
            .min(2, 'Reference title must be at least 2 characters')
            .max(200, 'Reference title must not exceed 200 characters'),
          url: urlSchema.optional(),
          description: z
            .string()
            .max(500, 'Reference description must not exceed 500 characters')
            .optional(),
        })
      )
      .max(5, 'Cannot have more than 5 references')
      .optional()
      .default([]),
    media: z
      .array(
        z.object({
          type: z.enum(['image', 'video', 'document']),
          url: urlSchema,
          title: z
            .string()
            .min(2, 'Media title must be at least 2 characters')
            .max(100, 'Media title must not exceed 100 characters'),
          description: z
            .string()
            .max(500, 'Media description must not exceed 500 characters')
            .optional(),
        })
      )
      .max(5, 'Cannot have more than 5 media items')
      .optional()
      .default([]),
    prerequisites: z
      .array(idSchema)
      .max(5, 'Cannot have more than 5 prerequisite milestones')
      .optional()
      .default([]),
    next_milestones: z
      .array(idSchema)
      .max(5, 'Cannot have more than 5 next milestones')
      .optional()
      .default([]),
    typical_age_range: z
      .object({
        min_months: z
          .number()
          .int('Age must be a whole number')
          .min(0, 'Minimum age cannot be negative')
          .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
        max_months: z
          .number()
          .int('Age must be a whole number')
          .min(0, 'Minimum age cannot be negative')
          .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
      })
      .refine(data => data.min_months <= data.max_months, {
        message: 'Minimum age must be less than or equal to maximum age',
        path: ['min_months'],
      }),
    status: z
      .enum(['draft', 'published', 'archived'], {
        errorMap: () => ({ message: 'Status must be one of: draft, published, archived' }),
      })
      .default('draft'),
    created_by: idSchema,
    last_modified_by: idSchema.optional(),
    review_required: z.boolean().default(false),
    review_notes: z.string().max(1000, 'Review notes must not exceed 1000 characters').optional(),
  })
  .refine(data => data.min_age_months <= data.max_age_months, {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['min_age_months'],
  });

export const updateMilestoneSchema = z.preprocess(
  (obj: any) => ({
    ...obj,
    last_modified_by: obj.last_modified_by || undefined,
  }),
  z
    .object({
      name: milestoneNameSchema.optional(),
      description: milestoneDescriptionSchema.optional(),
      development_area_id: idSchema.optional(),
      category: categorySchema.optional(),
      min_age_months: z
        .number()
        .int('Age must be a whole number')
        .min(0, 'Minimum age cannot be negative')
        .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years')
        .optional(),
      max_age_months: z
        .number()
        .int('Age must be a whole number')
        .min(0, 'Minimum age cannot be negative')
        .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years')
        .optional(),
      indicators: z
        .array(indicatorSchema)
        .min(1, 'At least one indicator is required')
        .max(10, 'Cannot have more than 10 indicators')
        .optional(),
      supporting_activities: z
        .array(
          z.object({
            activity_id: idSchema,
            notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
          })
        )
        .max(10, 'Cannot have more than 10 supporting activities')
        .optional(),
      professional_notes: z
        .string()
        .max(2000, 'Professional notes must not exceed 2000 characters')
        .optional(),
      references: z
        .array(
          z.object({
            title: z
              .string()
              .min(2, 'Reference title must be at least 2 characters')
              .max(200, 'Reference title must not exceed 200 characters'),
            url: urlSchema.optional(),
            description: z
              .string()
              .max(500, 'Reference description must not exceed 500 characters')
              .optional(),
          })
        )
        .max(5, 'Cannot have more than 5 references')
        .optional(),
      media: z
        .array(
          z.object({
            type: z.enum(['image', 'video', 'document']),
            url: urlSchema,
            title: z
              .string()
              .min(2, 'Media title must be at least 2 characters')
              .max(100, 'Media title must not exceed 100 characters'),
            description: z
              .string()
              .max(500, 'Media description must not exceed 500 characters')
              .optional(),
          })
        )
        .max(5, 'Cannot have more than 5 media items')
        .optional(),
      prerequisites: z
        .array(idSchema)
        .max(5, 'Cannot have more than 5 prerequisite milestones')
        .optional(),
      next_milestones: z
        .array(idSchema)
        .max(5, 'Cannot have more than 5 next milestones')
        .optional(),
      typical_age_range: z
        .object({
          min_months: z
            .number()
            .int('Age must be a whole number')
            .min(0, 'Minimum age cannot be negative')
            .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
          max_months: z
            .number()
            .int('Age must be a whole number')
            .min(0, 'Minimum age cannot be negative')
            .max(MAX_AGE_MONTHS, 'Maximum age cannot exceed 18 years'),
        })
        .optional()
        .refine(data => !data || data.min_months <= data.max_months, {
          message: 'Minimum age must be less than or equal to maximum age',
          path: ['min_months'],
        }),
      status: z
        .enum(['draft', 'published', 'archived'], {
          errorMap: () => ({ message: 'Status must be one of: draft, published, archived' }),
        })
        .optional(),
      review_required: z.boolean().optional(),
      review_notes: z.string().max(1000, 'Review notes must not exceed 1000 characters').optional(),
      last_modified_by: idSchema,
    })
    .refine(
      data => Object.keys(data).length > 1, // At least one field besides last_modified_by
      {
        message: 'At least one field must be provided for update',
      }
    )
    .refine(
      data => {
        if (data.min_age_months !== undefined && data.max_age_months !== undefined) {
          return data.min_age_months <= data.max_age_months;
        }

        return true;
      },
      {
        message: 'Minimum age must be less than or equal to maximum age',
        path: ['min_age_months'],
      }
    )
);

export const milestoneTrackingSchema = z.object({
  child_id: idSchema,
  milestone_id: idSchema,
  achieved_at: z.string().datetime(),
  notes: z.string().optional(),
  observed_indicators: z.array(z.string()).min(1, 'At least one indicator must be observed'),
  media_urls: z.array(z.string().url()).optional(),
  professional_id: idSchema.optional(),
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
  activity_id: idSchema.optional(),
});

// AI Assistant schemas
const messageSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(1000, 'Message must not exceed 1000 characters')
  .transform(val => val.trim());

const concernSchema = z
  .string()
  .min(5, 'Concern must be at least 5 characters')
  .max(500, 'Concern must not exceed 500 characters')
  .transform(val => val.trim());

export const aiMessageSchema = z.object({
  message: messageSchema,
  child_id: idSchema.optional(),
  context: z
    .object({
      recent_activities: z
        .array(idSchema)
        .max(10, 'Cannot include more than 10 recent activities')
        .optional(),
      recent_milestones: z
        .array(idSchema)
        .max(10, 'Cannot include more than 10 recent milestones')
        .optional(),
      specific_concern: concernSchema.optional(),
      child_age_months: z
        .number()
        .int('Age must be a whole number')
        .min(0, 'Age cannot be negative')
        .max(MAX_AGE_MONTHS, 'Age cannot exceed 18 years')
        .optional(),
      development_areas: z
        .array(z.string())
        .max(5, 'Cannot include more than 5 development areas')
        .optional(),
      language: z
        .string()
        .min(2, 'Language must be at least 2 characters')
        .max(50, 'Language must not exceed 50 characters')
        .optional(),
      voice_id: z.string().uuid('Invalid voice ID format').optional(),
      response_format: z
        .enum(['text', 'voice', 'both'], {
          errorMap: () => ({ message: 'Response format must be one of: text, voice, both' }),
        })
        .default('text'),
      max_tokens: z
        .number()
        .int('Token limit must be a whole number')
        .min(50, 'Token limit must be at least 50')
        .max(4000, 'Token limit cannot exceed 4000')
        .optional(),
      temperature: z
        .number()
        .min(0, 'Temperature must be between 0 and 1')
        .max(1, 'Temperature must be between 0 and 1')
        .optional(),
      previous_messages: z
        .array(
          z.object({
            role: z.enum(['user', 'assistant', 'system'], {
              errorMap: () => ({ message: 'Role must be one of: user, assistant, system' }),
            }),
            content: messageSchema,
            timestamp: dateSchema,
          })
        )
        .max(10, 'Cannot include more than 10 previous messages')
        .optional(),
    })
    .optional(),
  metadata: z
    .object({
      session_id: z.string().uuid('Invalid session ID format').optional(),
      client_timestamp: dateSchema.optional(),
      client_timezone: z.string().max(50, 'Timezone must not exceed 50 characters').optional(),
      client_locale: z
        .string()
        .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Invalid locale format (e.g., en-US)')
        .optional(),
    })
    .optional(),
});

export const aiResponseSchema = z.object({
  message: messageSchema,
  audio_url: urlSchema.optional(),
  suggested_activities: z
    .array(
      z.object({
        title: z
          .string()
          .min(3, 'Activity title must be at least 3 characters')
          .max(100, 'Activity title must not exceed 100 characters'),
        description: z
          .string()
          .max(500, 'Activity description must not exceed 500 characters')
          .optional(),
        type: z.enum(['milestone', 'interaction', 'assessment'], {
          errorMap: () => ({
            message: 'Activity type must be one of: milestone, interaction, assessment',
          }),
        }),
        age_range: z
          .object({
            min_months: z
              .number()
              .int('Age must be a whole number')
              .min(0, 'Age cannot be negative')
              .max(MAX_AGE_MONTHS, 'Age cannot exceed 18 years'),
            max_months: z
              .number()
              .int('Age must be a whole number')
              .min(0, 'Age cannot be negative')
              .max(MAX_AGE_MONTHS, 'Age cannot exceed 18 years'),
          })
          .optional(),
        development_areas: z
          .array(z.string())
          .max(5, 'Cannot include more than 5 development areas')
          .optional(),
      })
    )
    .max(5, 'Cannot include more than 5 suggested activities')
    .optional(),
  development_insights: z
    .array(
      z.object({
        area: z
          .string()
          .min(2, 'Development area must be at least 2 characters')
          .max(100, 'Development area must not exceed 100 characters'),
        observation: z
          .string()
          .min(10, 'Observation must be at least 10 characters')
          .max(500, 'Observation must not exceed 500 characters'),
        recommendation: z
          .string()
          .max(500, 'Recommendation must not exceed 500 characters')
          .optional(),
      })
    )
    .max(5, 'Cannot include more than 5 development insights')
    .optional(),
  metadata: z.object({
    model: z
      .string()
      .min(1, 'Model name is required')
      .max(100, 'Model name must not exceed 100 characters'),
    tokens_used: z
      .number()
      .int('Token count must be a whole number')
      .min(0, 'Token count cannot be negative'),
    processing_time_ms: z.number().min(0, 'Processing time cannot be negative'),
    timestamp: dateSchema,
    voice_id: z.string().uuid('Invalid voice ID format').optional(),
  }),
});
