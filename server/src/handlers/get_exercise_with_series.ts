
import { db } from '../db';
import { exercisesTable, seriesTable } from '../db/schema';
import { type Exercise, type Series } from '../schema';
import { eq } from 'drizzle-orm';

export interface ExerciseWithSeries extends Exercise {
    series: Series[];
}

export async function getExerciseWithSeries(exerciseId: number): Promise<ExerciseWithSeries | null> {
    try {
        // First get the exercise
        const exercises = await db.select()
            .from(exercisesTable)
            .where(eq(exercisesTable.id, exerciseId))
            .execute();

        if (exercises.length === 0) {
            return null;
        }

        const exercise = exercises[0];

        // Then get all series for this exercise
        const series = await db.select()
            .from(seriesTable)
            .where(eq(seriesTable.exercise_id, exerciseId))
            .execute();

        // Convert numeric fields back to numbers
        const convertedSeries: Series[] = series.map(s => ({
            ...s,
            target_weight: parseFloat(s.target_weight.toString())
        }));

        return {
            ...exercise,
            series: convertedSeries
        };
    } catch (error) {
        console.error('Failed to get exercise with series:', error);
        throw error;
    }
}
