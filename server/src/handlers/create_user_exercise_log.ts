
import { db } from '../db';
import { userExerciseLogsTable, exercisesTable } from '../db/schema';
import { type CreateUserExerciseLogInput, type UserExerciseLog } from '../schema';
import { eq } from 'drizzle-orm';

export async function createUserExerciseLog(input: CreateUserExerciseLogInput): Promise<UserExerciseLog> {
  try {
    // Verify the exercise exists first to prevent foreign key constraint violation
    const exercise = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, input.exercise_id))
      .execute();

    if (exercise.length === 0) {
      throw new Error(`Exercise with id ${input.exercise_id} does not exist`);
    }

    // Insert user exercise log record
    const result = await db.insert(userExerciseLogsTable)
      .values({
        user_id: input.user_id,
        exercise_id: input.exercise_id,
        series_number: input.series_number,
        repetitions: input.repetitions,
        weight: input.weight, // real column - no conversion needed
        completed_at: input.completed_at || new Date()
      })
      .returning()
      .execute();

    // Return the result directly - real columns are already numbers
    return result[0];
  } catch (error) {
    console.error('User exercise log creation failed:', error);
    throw error;
  }
}
