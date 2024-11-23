import { z } from 'zod';

// Shared constants
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_NOTES_LENGTH = 500;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

// Shared schemas
export const uuidSchema = z.string().uuid();

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long');

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`);

export const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(MAX_DESCRIPTION_LENGTH, `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);

export const notesSchema = z
  .string()
  .max(MAX_NOTES_LENGTH, `Notes must be at most ${MAX_NOTES_LENGTH} characters`)
  .optional();

export const dateSchema = z.coerce.date().refine(date => !isNaN(date.getTime()), 'Invalid date');

export const timestampSchema = z.string().datetime().or(dateSchema);

export const ageRangeSchema = z
  .object({
    min_age_months: z
      .number()
      .int('Age must be a whole number')
      .min(0, 'Age cannot be negative')
      .max(216, 'Age cannot be more than 18 years'),
    max_age_months: z
      .number()
      .int('Age must be a whole number')
      .min(0, 'Age cannot be negative')
      .max(216, 'Age cannot be more than 18 years'),
  })
  .refine(
    data => data.min_age_months <= data.max_age_months,
    'Minimum age must be less than or equal to maximum age'
  );

export const durationSchema = z
  .number()
  .int('Duration must be a whole number')
  .min(1, 'Duration must be at least 1 minute')
  .max(480, 'Duration cannot be more than 8 hours');

export const tagsSchema = z
  .array(z.string().min(1, 'Tag cannot be empty').max(50, 'Tag is too long'))
  .max(10, 'Cannot have more than 10 tags');

export const categorySchema = z
  .string()
  .min(1, 'Category is required')
  .max(50, 'Category is too long');

export const importanceSchema = z
  .number()
  .int('Importance must be a whole number')
  .min(1, 'Importance must be at least 1')
  .max(5, 'Importance cannot be more than 5');

export const fileSchema = z.object({
  size: z.number().max(MAX_FILE_SIZE, `File size cannot exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  type: z
    .string()
    .refine(
      type => [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(type),
      'File type not supported'
    ),
});

// Enum schemas
export const userRoleSchema = z.enum(['parent', 'professional']);

export const subscriptionTypeSchema = z.enum(['free', 'premium', 'enterprise']);

export const mediaTypeSchema = z.enum(['photo', 'video']);

export const activityStatusSchema = z.enum(['pending', 'completed', 'skipped']);

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});
