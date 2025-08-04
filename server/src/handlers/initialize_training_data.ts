
import { db } from '../db';
import { trainingSessionsTable, exercisesTable, seriesTable } from '../db/schema';
import { type TrainingSession, type Exercise, type Series } from '../schema';

export interface InitialTrainingData {
    trainingSessions: TrainingSession[];
    exercises: Exercise[];
    series: Series[];
}

export async function initializeTrainingData(): Promise<InitialTrainingData> {
    try {
        // Define training sessions data
        const trainingSessionsData = [
            // Pull sessions
            { name: 'Pull Day A', type: 'pull' as const, description: 'Back and biceps focused workout' },
            { name: 'Pull Day B', type: 'pull' as const, description: 'Lat and rear delt focused workout' },
            // Push sessions
            { name: 'Push Day A', type: 'push' as const, description: 'Chest and triceps focused workout' },
            { name: 'Push Day B', type: 'push' as const, description: 'Shoulders and triceps focused workout' },
            // Legs sessions
            { name: 'Leg Day A', type: 'legs' as const, description: 'Quad and glute focused workout' },
            { name: 'Leg Day B', type: 'legs' as const, description: 'Hamstring and calf focused workout' },
            // Other sessions
            { name: 'Full Body A', type: 'other' as const, description: 'Complete body compound movements' },
            { name: 'Core & Cardio', type: 'other' as const, description: 'Core strengthening and cardio' }
        ];

        // Insert training sessions
        const trainingSessions = await db.insert(trainingSessionsTable)
            .values(trainingSessionsData)
            .returning()
            .execute();

        // Define exercises for each training session
        const exercisesData = [
            // Pull Day A exercises
            { training_session_id: trainingSessions[0].id, name: 'Pull-ups', description: 'Bodyweight back exercise', target_series: 3 },
            { training_session_id: trainingSessions[0].id, name: 'Barbell Rows', description: 'Heavy rowing movement', target_series: 4 },
            { training_session_id: trainingSessions[0].id, name: 'Bicep Curls', description: 'Isolation bicep exercise', target_series: 3 },
            
            // Pull Day B exercises
            { training_session_id: trainingSessions[1].id, name: 'Lat Pulldowns', description: 'Lat focused pulling', target_series: 4 },
            { training_session_id: trainingSessions[1].id, name: 'Face Pulls', description: 'Rear delt and mid trap exercise', target_series: 3 },
            { training_session_id: trainingSessions[1].id, name: 'Hammer Curls', description: 'Neutral grip bicep exercise', target_series: 3 },
            
            // Push Day A exercises
            { training_session_id: trainingSessions[2].id, name: 'Bench Press', description: 'Primary chest exercise', target_series: 4 },
            { training_session_id: trainingSessions[2].id, name: 'Overhead Press', description: 'Shoulder pressing movement', target_series: 3 },
            { training_session_id: trainingSessions[2].id, name: 'Tricep Dips', description: 'Bodyweight tricep exercise', target_series: 3 },
            
            // Push Day B exercises
            { training_session_id: trainingSessions[3].id, name: 'Incline Dumbbell Press', description: 'Upper chest focused press', target_series: 4 },
            { training_session_id: trainingSessions[3].id, name: 'Lateral Raises', description: 'Side delt isolation', target_series: 3 },
            { training_session_id: trainingSessions[3].id, name: 'Tricep Extensions', description: 'Overhead tricep exercise', target_series: 3 },
            
            // Leg Day A exercises
            { training_session_id: trainingSessions[4].id, name: 'Squats', description: 'Primary leg compound movement', target_series: 4 },
            { training_session_id: trainingSessions[4].id, name: 'Bulgarian Split Squats', description: 'Single leg quad exercise', target_series: 3 },
            { training_session_id: trainingSessions[4].id, name: 'Hip Thrusts', description: 'Glute focused exercise', target_series: 3 },
            
            // Leg Day B exercises
            { training_session_id: trainingSessions[5].id, name: 'Romanian Deadlifts', description: 'Hamstring focused movement', target_series: 4 },
            { training_session_id: trainingSessions[5].id, name: 'Walking Lunges', description: 'Dynamic leg exercise', target_series: 3 },
            { training_session_id: trainingSessions[5].id, name: 'Calf Raises', description: 'Calf isolation exercise', target_series: 4 },
            
            // Full Body A exercises
            { training_session_id: trainingSessions[6].id, name: 'Deadlifts', description: 'Full body compound movement', target_series: 3 },
            { training_session_id: trainingSessions[6].id, name: 'Push-ups', description: 'Bodyweight chest exercise', target_series: 3 },
            { training_session_id: trainingSessions[6].id, name: 'Bodyweight Squats', description: 'Bodyweight leg exercise', target_series: 3 },
            
            // Core & Cardio exercises
            { training_session_id: trainingSessions[7].id, name: 'Plank', description: 'Core stability exercise', target_series: 3 },
            { training_session_id: trainingSessions[7].id, name: 'Mountain Climbers', description: 'Cardio and core exercise', target_series: 4 },
            { training_session_id: trainingSessions[7].id, name: 'Russian Twists', description: 'Oblique focused exercise', target_series: 3 }
        ];

        // Insert exercises
        const exercises = await db.insert(exercisesTable)
            .values(exercisesData)
            .returning()
            .execute();

        // Define series data for each exercise
        const seriesData = [];
        for (const exercise of exercises) {
            for (let seriesNum = 1; seriesNum <= exercise.target_series; seriesNum++) {
                // Different rep/weight schemes based on exercise type
                let targetReps = 10;
                let targetWeight = 50;
                
                // Adjust based on exercise name for variety
                if (exercise.name.includes('Plank')) {
                    targetReps = 60; // seconds for plank
                    targetWeight = 0; // bodyweight
                } else if (exercise.name.includes('Pull-ups') || exercise.name.includes('Push-ups')) {
                    targetReps = 8;
                    targetWeight = 0; // bodyweight
                } else if (exercise.name.includes('Deadlifts') || exercise.name.includes('Squats')) {
                    targetReps = 6;
                    targetWeight = 80;
                } else if (exercise.name.includes('Curls') || exercise.name.includes('Raises')) {
                    targetReps = 12;
                    targetWeight = 15;
                }

                seriesData.push({
                    exercise_id: exercise.id,
                    series_number: seriesNum,
                    target_repetitions: targetReps,
                    target_weight: targetWeight
                });
            }
        }

        // Insert series
        const seriesResults = await db.insert(seriesTable)
            .values(seriesData)
            .returning()
            .execute();

        // Convert numeric fields back to numbers for return
        const series = seriesResults.map(s => ({
            ...s,
            target_weight: parseFloat(s.target_weight.toString())
        }));

        return {
            trainingSessions,
            exercises,
            series
        };
    } catch (error) {
        console.error('Training data initialization failed:', error);
        throw error;
    }
}
