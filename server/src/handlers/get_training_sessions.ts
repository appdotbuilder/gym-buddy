
import { db } from '../db';
import { trainingSessionsTable } from '../db/schema';
import { type TrainingSession } from '../schema';

export async function getTrainingSessions(): Promise<TrainingSession[]> {
  try {
    const results = await db.select()
      .from(trainingSessionsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch training sessions:', error);
    throw error;
  }
}
