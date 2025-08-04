
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserExerciseLogInputSchema,
  createBodyMetricInputSchema,
  updateUserSettingsInputSchema,
  getUserExerciseLogsInputSchema,
  getBodyMetricsInputSchema,
  getUserSettingsInputSchema
} from './schema';

// Import handlers
import { getTrainingSessions } from './handlers/get_training_sessions';
import { getExercisesBySession } from './handlers/get_exercises_by_session';
import { getExerciseWithSeries } from './handlers/get_exercise_with_series';
import { createUserExerciseLog } from './handlers/create_user_exercise_log';
import { getUserExerciseLogs } from './handlers/get_user_exercise_logs';
import { getLastExercisePerformance } from './handlers/get_last_exercise_performance';
import { createBodyMetric } from './handlers/create_body_metric';
import { getBodyMetrics } from './handlers/get_body_metrics';
import { getUserSettings } from './handlers/get_user_settings';
import { updateUserSettings } from './handlers/update_user_settings';
import { initializeTrainingData } from './handlers/initialize_training_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Training session endpoints
  getTrainingSessions: publicProcedure
    .query(() => getTrainingSessions()),

  getExercisesBySession: publicProcedure
    .input(z.object({ trainingSessionId: z.number() }))
    .query(({ input }) => getExercisesBySession(input.trainingSessionId)),

  getExerciseWithSeries: publicProcedure
    .input(z.object({ exerciseId: z.number() }))
    .query(({ input }) => getExerciseWithSeries(input.exerciseId)),

  // User exercise logging endpoints
  createUserExerciseLog: publicProcedure
    .input(createUserExerciseLogInputSchema)
    .mutation(({ input }) => createUserExerciseLog(input)),

  getUserExerciseLogs: publicProcedure
    .input(getUserExerciseLogsInputSchema)
    .query(({ input }) => getUserExerciseLogs(input)),

  getLastExercisePerformance: publicProcedure
    .input(z.object({ 
      userId: z.string(), 
      exerciseId: z.number() 
    }))
    .query(({ input }) => getLastExercisePerformance(input.userId, input.exerciseId)),

  // Body metrics endpoints
  createBodyMetric: publicProcedure
    .input(createBodyMetricInputSchema)
    .mutation(({ input }) => createBodyMetric(input)),

  getBodyMetrics: publicProcedure
    .input(getBodyMetricsInputSchema)
    .query(({ input }) => getBodyMetrics(input)),

  // User settings endpoints
  getUserSettings: publicProcedure
    .input(getUserSettingsInputSchema)
    .query(({ input }) => getUserSettings(input)),

  updateUserSettings: publicProcedure
    .input(updateUserSettingsInputSchema)
    .mutation(({ input }) => updateUserSettings(input)),

  // Data initialization endpoint (for setup)
  initializeTrainingData: publicProcedure
    .mutation(() => initializeTrainingData()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Training Tracker TRPC server listening at port: ${port}`);
}

start();
