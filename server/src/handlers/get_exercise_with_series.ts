
import { type Exercise, type Series } from '../schema';

export interface ExerciseWithSeries extends Exercise {
    series: Series[];
}

export async function getExerciseWithSeries(exerciseId: number): Promise<ExerciseWithSeries | null> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching a specific exercise with its predefined series data.
    // This is used when user starts an exercise to show target reps/weight
    return null;
}
