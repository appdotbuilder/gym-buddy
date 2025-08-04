
import { z } from 'zod';

// Enums
export const trainingTypeEnum = z.enum(['pull', 'push', 'legs', 'other']);
export type TrainingType = z.infer<typeof trainingTypeEnum>;

export const bodyMetricTypeEnum = z.enum(['arms', 'legs', 'core', 'chest', 'shoulders', 'waist', 'weight']);
export type BodyMetricType = z.infer<typeof bodyMetricTypeEnum>;

// Training Session schema
export const trainingSessionSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: trainingTypeEnum,
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type TrainingSession = z.infer<typeof trainingSessionSchema>;

// Exercise schema
export const exerciseSchema = z.object({
  id: z.number(),
  training_session_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  target_series: z.number().int().min(2).max(4),
  created_at: z.coerce.date()
});

export type Exercise = z.infer<typeof exerciseSchema>;

// Series schema (predefined data for exercises)
export const seriesSchema = z.object({
  id: z.number(),
  exercise_id: z.number(),
  series_number: z.number().int().min(1).max(4),
  target_repetitions: z.number().int().positive(),
  target_weight: z.number().positive(),
  created_at: z.coerce.date()
});

export type Series = z.infer<typeof seriesSchema>;

// User Exercise Log schema (actual user performance)
export const userExerciseLogSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Using string for user ID (could be UUID or auth provider ID)
  exercise_id: z.number(),
  series_number: z.number().int().min(1).max(4),
  repetitions: z.number().int().positive(),
  weight: z.number().positive(),
  completed_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type UserExerciseLog = z.infer<typeof userExerciseLogSchema>;

// Body Metrics schema
export const bodyMetricSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  metric_type: bodyMetricTypeEnum,
  value: z.number().positive(),
  unit: z.string(), // e.g., "cm", "kg", "inches"
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type BodyMetric = z.infer<typeof bodyMetricSchema>;

// User Settings schema
export const userSettingsSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  timer_duration: z.number().int().positive().default(120), // Default 2 minutes in seconds
  dark_mode: z.boolean().default(true),
  body_metric_reminder_enabled: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Input schemas for creating/updating
export const createUserExerciseLogInputSchema = z.object({
  user_id: z.string(),
  exercise_id: z.number(),
  series_number: z.number().int().min(1).max(4),
  repetitions: z.number().int().positive(),
  weight: z.number().positive(),
  completed_at: z.coerce.date().optional()
});

export type CreateUserExerciseLogInput = z.infer<typeof createUserExerciseLogInputSchema>;

export const createBodyMetricInputSchema = z.object({
  user_id: z.string(),
  metric_type: bodyMetricTypeEnum,
  value: z.number().positive(),
  unit: z.string(),
  recorded_at: z.coerce.date().optional()
});

export type CreateBodyMetricInput = z.infer<typeof createBodyMetricInputSchema>;

export const updateUserSettingsInputSchema = z.object({
  user_id: z.string(),
  timer_duration: z.number().int().positive().optional(),
  dark_mode: z.boolean().optional(),
  body_metric_reminder_enabled: z.boolean().optional()
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputSchema>;

// Query input schemas
export const getUserExerciseLogsInputSchema = z.object({
  user_id: z.string(),
  exercise_id: z.number().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type GetUserExerciseLogsInput = z.infer<typeof getUserExerciseLogsInputSchema>;

export const getBodyMetricsInputSchema = z.object({
  user_id: z.string(),
  metric_type: bodyMetricTypeEnum.optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type GetBodyMetricsInput = z.infer<typeof getBodyMetricsInputSchema>;

export const getUserSettingsInputSchema = z.object({
  user_id: z.string()
});

export type GetUserSettingsInput = z.infer<typeof getUserSettingsInputSchema>;
