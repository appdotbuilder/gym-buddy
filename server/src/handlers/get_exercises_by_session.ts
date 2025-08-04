
import { db } from '../db';
import { exercisesTable, seriesTable } from '../db/schema';
import { type Exercise } from '../schema';
import { eq } from 'drizzle-orm';

export async function getExercisesBySession(trainingSessionId: number): Promise<Exercise[]> {
  try {
    // Query exercises for the specified training session
    const results = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.training_session_id, trainingSessionId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch exercises by session:', error);
    throw error;
  }
}
