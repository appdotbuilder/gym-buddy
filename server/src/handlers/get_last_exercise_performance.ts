
import { db } from '../db';
import { userExerciseLogsTable } from '../db/schema';
import { type UserExerciseLog } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getLastExercisePerformance(userId: string, exerciseId: number): Promise<UserExerciseLog[]> {
  try {
    // Get the most recent completed_at timestamp for this user and exercise
    const latestSessionQuery = await db.select({
      completed_at: userExerciseLogsTable.completed_at
    })
      .from(userExerciseLogsTable)
      .where(
        and(
          eq(userExerciseLogsTable.user_id, userId),
          eq(userExerciseLogsTable.exercise_id, exerciseId)
        )
      )
      .orderBy(desc(userExerciseLogsTable.completed_at))
      .limit(1)
      .execute();

    // If no previous performance exists, return empty array
    if (latestSessionQuery.length === 0) {
      return [];
    }

    const latestCompletedAt = latestSessionQuery[0].completed_at;

    // Get all series from the most recent workout session for this exercise
    const results = await db.select()
      .from(userExerciseLogsTable)
      .where(
        and(
          eq(userExerciseLogsTable.user_id, userId),
          eq(userExerciseLogsTable.exercise_id, exerciseId),
          eq(userExerciseLogsTable.completed_at, latestCompletedAt)
        )
      )
      .orderBy(userExerciseLogsTable.series_number)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(log => ({
      ...log,
      weight: parseFloat(log.weight.toString()) // Convert numeric field to number
    }));
  } catch (error) {
    console.error('Failed to get last exercise performance:', error);
    throw error;
  }
}
