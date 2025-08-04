
import { serial, text, pgTable, timestamp, integer, real, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const trainingTypeEnum = pgEnum('training_type', ['pull', 'push', 'legs', 'other']);
export const bodyMetricTypeEnum = pgEnum('body_metric_type', ['arms', 'legs', 'core', 'chest', 'shoulders', 'waist', 'weight']);

// Training Sessions table
export const trainingSessionsTable = pgTable('training_sessions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: trainingTypeEnum('type').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Exercises table
export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  training_session_id: integer('training_session_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  target_series: integer('target_series').notNull(), // 2-4 series per exercise
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Predefined series data for exercises
export const seriesTable = pgTable('series', {
  id: serial('id').primaryKey(),
  exercise_id: integer('exercise_id').notNull(),
  series_number: integer('series_number').notNull(), // 1, 2, 3, or 4
  target_repetitions: integer('target_repetitions').notNull(),
  target_weight: real('target_weight').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User exercise logs (actual performance tracking)
export const userExerciseLogsTable = pgTable('user_exercise_logs', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  exercise_id: integer('exercise_id').notNull(),
  series_number: integer('series_number').notNull(),
  repetitions: integer('repetitions').notNull(),
  weight: real('weight').notNull(),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Body metrics tracking
export const bodyMetricsTable = pgTable('body_metrics', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  metric_type: bodyMetricTypeEnum('metric_type').notNull(),
  value: real('value').notNull(),
  unit: text('unit').notNull(),
  recorded_at: timestamp('recorded_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User settings
export const userSettingsTable = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull().unique(),
  timer_duration: integer('timer_duration').notNull().default(120), // 2 minutes in seconds
  dark_mode: boolean('dark_mode').notNull().default(true),
  body_metric_reminder_enabled: boolean('body_metric_reminder_enabled').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const trainingSessionsRelations = relations(trainingSessionsTable, ({ many }) => ({
  exercises: many(exercisesTable),
}));

export const exercisesRelations = relations(exercisesTable, ({ one, many }) => ({
  trainingSession: one(trainingSessionsTable, {
    fields: [exercisesTable.training_session_id],
    references: [trainingSessionsTable.id],
  }),
  series: many(seriesTable),
  userLogs: many(userExerciseLogsTable),
}));

export const seriesRelations = relations(seriesTable, ({ one }) => ({
  exercise: one(exercisesTable, {
    fields: [seriesTable.exercise_id],
    references: [exercisesTable.id],
  }),
}));

export const userExerciseLogsRelations = relations(userExerciseLogsTable, ({ one }) => ({
  exercise: one(exercisesTable, {
    fields: [userExerciseLogsTable.exercise_id],
    references: [exercisesTable.id],
  }),
}));

// TypeScript types
export type TrainingSession = typeof trainingSessionsTable.$inferSelect;
export type NewTrainingSession = typeof trainingSessionsTable.$inferInsert;

export type Exercise = typeof exercisesTable.$inferSelect;
export type NewExercise = typeof exercisesTable.$inferInsert;

export type Series = typeof seriesTable.$inferSelect;
export type NewSeries = typeof seriesTable.$inferInsert;

export type UserExerciseLog = typeof userExerciseLogsTable.$inferSelect;
export type NewUserExerciseLog = typeof userExerciseLogsTable.$inferInsert;

export type BodyMetric = typeof bodyMetricsTable.$inferSelect;
export type NewBodyMetric = typeof bodyMetricsTable.$inferInsert;

export type UserSettings = typeof userSettingsTable.$inferSelect;
export type NewUserSettings = typeof userSettingsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  trainingSessions: trainingSessionsTable,
  exercises: exercisesTable,
  series: seriesTable,
  userExerciseLogs: userExerciseLogsTable,
  bodyMetrics: bodyMetricsTable,
  userSettings: userSettingsTable,
};
