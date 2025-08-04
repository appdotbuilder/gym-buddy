
import { db } from '../db';
import { userExerciseLogsTable } from '../db/schema';
import { type GetUserExerciseLogsInput, type UserExerciseLog } from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export async function getUserExerciseLogs(input: GetUserExerciseLogsInput): Promise<UserExerciseLog[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(userExerciseLogsTable.user_id, input.user_id));
    
    // Optional filter by exercise_id
    if (input.exercise_id !== undefined) {
      conditions.push(eq(userExerciseLogsTable.exercise_id, input.exercise_id));
    }

    // Build and execute query
    const results = await db.select()
      .from(userExerciseLogsTable)
      .where(and(...conditions))
      .orderBy(desc(userExerciseLogsTable.completed_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Convert numeric fields from database format to numbers
    return results.map(log => ({
      ...log,
      weight: typeof log.weight === 'string' ? parseFloat(log.weight) : log.weight
    }));
  } catch (error) {
    console.error('Failed to get user exercise logs:', error);
    throw error;
  }
}
